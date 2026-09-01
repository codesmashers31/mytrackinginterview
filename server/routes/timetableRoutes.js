import express from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import {
  generatePreviewTimetable,
  getMyTimetable,
  saveMyTimetable,
  toggleSlotCheck,
  markAllSlots,
  getTimetableLeaderboard,
  deleteMyTimetable,
  getAllStudentTimetables
} from '../controllers/timetableController.js';

const router = express.Router();

// Student endpoints
router.post('/generate', authMiddleware, roleMiddleware(['student', 'admin', 'coordinator', 'placement']), generatePreviewTimetable);
router.get('/my', authMiddleware, roleMiddleware(['student', 'admin', 'coordinator', 'placement']), getMyTimetable);
router.post('/my', authMiddleware, roleMiddleware(['student', 'admin', 'coordinator', 'placement']), saveMyTimetable);
router.post('/', authMiddleware, roleMiddleware(['student', 'admin', 'coordinator', 'placement']), saveMyTimetable);
router.put('/my', authMiddleware, roleMiddleware(['student', 'admin', 'coordinator', 'placement']), saveMyTimetable);
router.put('/', authMiddleware, roleMiddleware(['student', 'admin', 'coordinator', 'placement']), saveMyTimetable);
router.post('/my/check-slot', authMiddleware, roleMiddleware(['student', 'admin', 'coordinator', 'placement']), toggleSlotCheck);
router.post('/check-slot', authMiddleware, roleMiddleware(['student', 'admin', 'coordinator', 'placement']), toggleSlotCheck);
router.post('/my/check-all', authMiddleware, roleMiddleware(['student', 'admin', 'coordinator', 'placement']), markAllSlots);
router.post('/check-all', authMiddleware, roleMiddleware(['student', 'admin', 'coordinator', 'placement']), markAllSlots);
router.get('/leaderboard', authMiddleware, getTimetableLeaderboard);
router.delete('/my', authMiddleware, roleMiddleware(['student', 'admin', 'coordinator', 'placement']), deleteMyTimetable);
router.delete('/', authMiddleware, roleMiddleware(['student', 'admin', 'coordinator', 'placement']), deleteMyTimetable);

// Admin & Coordinator endpoints
router.get('/admin', authMiddleware, roleMiddleware(['admin', 'coordinator', 'placement']), getAllStudentTimetables);

export default router;
