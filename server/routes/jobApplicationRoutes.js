import express from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import {
  createJobApplication,
  getMyJobApplications,
  updateJobApplication,
  deleteJobApplication,
  getAllJobApplications
} from '../controllers/jobApplicationController.js';

const router = express.Router();

// Student routes
router.post('/', authMiddleware, roleMiddleware(['student']), createJobApplication);
router.get('/my', authMiddleware, roleMiddleware(['student']), getMyJobApplications);

// Shared update & delete routes
router.put('/:id', authMiddleware, updateJobApplication);
router.delete('/:id', authMiddleware, deleteJobApplication);

// Admin & Coordinator routes
router.get('/', authMiddleware, roleMiddleware(['admin', 'coordinator', 'placement']), getAllJobApplications);

export default router;
