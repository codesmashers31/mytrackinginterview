import Redis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// In-Memory L1 Cache / Fallback Map
const memoryCache = new Map(); // key -> { value, expiresAt }

// Periodic cleanup of expired memory entries every 60s
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of memoryCache.entries()) {
    if (item.expiresAt && item.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
}, 60000).unref?.();

let redisClient = null;
let isRedisReady = false;

const redisUrl = process.env.REDIS_URL || process.env.KV_URL || process.env.UPSTASH_REDIS_URL;
const redisHost = process.env.REDIS_HOST;

if (redisUrl || redisHost) {
  try {
    const config = redisUrl
      ? redisUrl
      : {
          host: redisHost || '127.0.0.1',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD || undefined,
          tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
        };

    redisClient = new Redis(config, {
      maxRetriesPerRequest: 2,
      connectTimeout: 5000,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 5) {
          console.warn('[Redis] Max connection retries reached. Using in-memory cache.');
          return null; // Stop reconnecting after 5 attempts
        }
        return Math.min(times * 1000, 5000);
      },
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connecting...');
    });

    redisClient.on('ready', () => {
      isRedisReady = true;
      console.log('[Redis] Connected and ready for caching');
    });

    redisClient.on('error', (err) => {
      isRedisReady = false;
      console.warn('[Redis] Connection warning (using in-memory fallback):', err.message);
    });

    redisClient.on('close', () => {
      isRedisReady = false;
    });

    // Initiate connection asynchronously without blocking server startup
    redisClient.connect().catch((err) => {
      console.warn('[Redis] Initial connect failed, running with in-memory cache fallback:', err.message);
    });
  } catch (initErr) {
    console.warn('[Redis] Initialization error, using in-memory cache fallback:', initErr.message);
    redisClient = null;
    isRedisReady = false;
  }
} else {
  console.log('[Cache] No REDIS_URL configured; running with high-performance in-memory cache.');
}

/**
 * Get value from cache (Redis if connected, else In-Memory)
 */
export const getCache = async (key) => {
  try {
    if (redisClient && isRedisReady) {
      const data = await redisClient.get(key);
      if (data) {
        return JSON.parse(data);
      }
    }
  } catch (err) {
    console.warn(`[Cache] Redis GET error for ${key}:`, err.message);
  }

  // Fallback to In-Memory L1 Cache
  const mem = memoryCache.get(key);
  if (mem) {
    if (!mem.expiresAt || mem.expiresAt > Date.now()) {
      return mem.value;
    }
    memoryCache.delete(key);
  }

  return null;
};

/**
 * Set value in cache (Redis and In-Memory)
 */
export const setCache = async (key, value, ttlSeconds = 60) => {
  // Always update in-memory cache
  memoryCache.set(key, {
    value,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
  });

  try {
    if (redisClient && isRedisReady) {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await redisClient.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await redisClient.set(key, serialized);
      }
    }
  } catch (err) {
    console.warn(`[Cache] Redis SET error for ${key}:`, err.message);
  }
};

/**
 * Delete key or pattern from cache
 */
export const delCache = async (patternOrKey) => {
  // Delete from in-memory cache
  if (patternOrKey.includes('*')) {
    const regex = new RegExp('^' + patternOrKey.replace(/\*/g, '.*') + '$');
    for (const k of memoryCache.keys()) {
      if (regex.test(k)) {
        memoryCache.delete(k);
      }
    }
  } else {
    memoryCache.delete(patternOrKey);
  }

  // Delete from Redis if ready
  try {
    if (redisClient && isRedisReady) {
      if (patternOrKey.includes('*')) {
        const keys = await redisClient.keys(patternOrKey);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } else {
        await redisClient.del(patternOrKey);
      }
    }
  } catch (err) {
    console.warn(`[Cache] Redis DEL error for ${patternOrKey}:`, err.message);
  }
};

/**
 * Invalidate all dashboard & student caches after any mutation
 */
export const invalidateDashboardCache = async () => {
  await Promise.allSettled([
    delCache('dashboard:*'),
    delCache('students:*'),
    delCache('spl:*'),
    delCache('leaves:*'),
    delCache('attendance:*'),
  ]);
};

/**
 * Express Route Middleware for caching GET requests
 */
export const cacheMiddleware = (keyPrefix, ttlSeconds = 60) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `${keyPrefix}:${req.originalUrl || req.url}`;
    try {
      const cachedData = await getCache(cacheKey);
      if (cachedData !== null && cachedData !== undefined) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Backend', isRedisReady ? 'Redis' : 'Memory');
        return res.json(cachedData);
      }

      // Intercept res.json to store response in cache
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        // Only cache successful 200 responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setCache(cacheKey, body, ttlSeconds).catch(() => {});
        }
        res.setHeader('X-Cache', 'MISS');
        return originalJson(body);
      };

      next();
    } catch (err) {
      console.warn('[Cache] Middleware error, bypassing cache:', err.message);
      next();
    }
  };
};

export const getRedisClient = () => redisClient;
export default {
  getCache,
  setCache,
  delCache,
  invalidateDashboardCache,
  cacheMiddleware,
  getRedisClient,
};
