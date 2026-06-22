import express from 'express';
import {
  applyLeaveRequest,
  getMyLeaveRequests,
  getAllLeaveRequests,
  reviewLeaveRequest
} from '../controllers/leaveController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';

const router = express.Router();

// Student routes (also allowed for admin/coordinator for testing and convenience)
router.post('/', authMiddleware, requireRole('student', 'admin', 'coordinator'), applyLeaveRequest);
router.get('/my', authMiddleware, requireRole('student', 'admin', 'coordinator'), getMyLeaveRequests);

// Admin & Coordinator routes
router.get('/', authMiddleware, requireRole('admin', 'coordinator'), getAllLeaveRequests);
router.put('/:id/status', authMiddleware, requireRole('admin', 'coordinator'), reviewLeaveRequest);

export default router;
