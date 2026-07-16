export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const localHosts = ['localhost', '127.0.0.1', '0.0.0.0'];

    if (localHosts.includes(hostname) || hostname.endsWith('.localhost')) {
      return '/api';
    }
  }

  return envUrl || '/api';
};

export const buildApiUrl = (path) => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

import { authHeaders, logout } from './auth';

// Simple in-memory GET cache with request de-duplication.
// Avoids re-fetching the same collection (e.g. /students, /spl-registration)
// every time a page mounts, while staying fresh via a short TTL.
const getCache = new Map(); // url -> { data, timestamp }
const inflightRequests = new Map(); // url -> Promise
const DEFAULT_CACHE_TTL = 30000;

export const cachedGet = async (path, { ttl = DEFAULT_CACHE_TTL, force = false } = {}) => {
  const url = buildApiUrl(path);
  const now = Date.now();

  if (!force) {
    const cached = getCache.get(url);
    if (cached && (now - cached.timestamp) < ttl) {
      return cached.data;
    }
    const pending = inflightRequests.get(url);
    if (pending) return pending;
  }

  const requestPromise = fetch(url, { headers: { ...authHeaders() } })
    .then(async (res) => {
      if (res.status === 401) {
        logout();
        throw new Error('Session expired');
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Request failed: ${path}`);
      }
      return res.json();
    })
    .then((data) => {
      getCache.set(url, { data, timestamp: Date.now() });
      inflightRequests.delete(url);
      return data;
    })
    .catch((err) => {
      inflightRequests.delete(url);
      throw err;
    });

  inflightRequests.set(url, requestPromise);
  return requestPromise;
};

// Call after mutations (create/update/delete) so the next read is fresh.
export const invalidateCache = (path) => {
  if (!path) {
    getCache.clear();
    return;
  }
  const url = buildApiUrl(path);
  getCache.delete(url);
};

// Coordinator API helpers
export const createCoordinator = async (data) => {
  const response = await fetch(buildApiUrl('auth/register-coordinator'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to create coordinator');
  }
  return await response.json();
};

export const fetchCoordinators = async () => {
  const response = await fetch(buildApiUrl('auth/coordinators'), {
    headers: { ...authHeaders() }
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to fetch coordinators');
  }
  return await response.json();
};

// Placement API helpers
export const createPlacement = async (data) => {
  const response = await fetch(buildApiUrl('auth/register-placement'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to create placement account');
  }
  return await response.json();
};

export const fetchPlacements = async () => {
  const response = await fetch(buildApiUrl('auth/placements'), {
    headers: { ...authHeaders() }
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to fetch placement accounts');
  }
  return await response.json();
};

export const updateUser = async (id, data) => {
  const response = await fetch(buildApiUrl(`auth/users/${id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to update user account');
  }
  return await response.json();
};

export const deleteUser = async (id) => {
  const response = await fetch(buildApiUrl(`auth/users/${id}`), {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to delete user account');
  }
  return await response.json();
};
