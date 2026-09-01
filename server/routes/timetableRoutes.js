import express from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import {
  generatePreviewTimetable,
  getMyTimetable,
  saveMyTimetable,
  toggleSlotCheck,
  deleteMyTimetable,
  getAllStudentTimetables
} from '../controllers/timetableController.js';

const router = express.Router();

// Student endpoints
router.post('/generate', authMiddleware, roleMiddleware(['student']), generatePreviewTimetable);
router.get('/my', authMiddleware, roleMiddleware(['student']), getMyTimetable);
router.post('/', authMiddleware, roleMiddleware(['student']), saveMyTimetable);
router.put('/my', authMiddleware, roleMiddleware(['student']), saveMyTimetable);
router.post('/my/check-slot', authMiddleware, roleMiddleware(['student']), toggleSlotCheck);
router.delete('/my', authMiddleware, roleMiddleware(['student']), deleteMyTimetable);

// Admin & Coordinator endpoints
router.get('/admin', authMiddleware, roleMiddleware(['admin', 'coordinator', 'placement']), getAllStudentTimetables);

export default router;
