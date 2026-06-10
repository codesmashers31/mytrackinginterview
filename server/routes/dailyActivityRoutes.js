import express from 'express';
import { 
  createActivityLog, 
  getMyActivityLogs, 
  getAllActivityLogs 
} from '../controllers/dailyActivityController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';

const router = express.Router();

// Student routes
router.post('/', authMiddleware, requireRole('student'), createActivityLog);
router.get('/my', authMiddleware, requireRole('student'), getMyActivityLogs);

// Admin routes
router.get('/', authMiddleware, requireRole('admin'), getAllActivityLogs);

export default router;
