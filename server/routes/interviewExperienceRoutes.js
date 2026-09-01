import express from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import {
  createInterviewExperience,
  getMyInterviewExperiences,
  updateInterviewExperience,
  deleteInterviewExperience,
  getAllInterviewExperiences
} from '../controllers/interviewExperienceController.js';

const router = express.Router();

// Student routes
router.post('/', authMiddleware, roleMiddleware(['student']), createInterviewExperience);
router.get('/my', authMiddleware, roleMiddleware(['student']), getMyInterviewExperiences);

// Shared update & delete routes
router.put('/:id', authMiddleware, updateInterviewExperience);
router.delete('/:id', authMiddleware, deleteInterviewExperience);

// Admin & Coordinator routes
router.get('/', authMiddleware, roleMiddleware(['admin', 'coordinator', 'placement']), getAllInterviewExperiences);

export default router;
