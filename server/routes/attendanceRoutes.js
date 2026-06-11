import express from 'express';
import * as attendanceController from '../controllers/attendanceController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// ─── Student self-service routes (specific paths FIRST before param routes) ───
router.post('/check-in', authMiddleware, attendanceController.studentCheckIn);
router.post('/check-out', authMiddleware, attendanceController.studentCheckOut);
router.get('/today', authMiddleware, attendanceController.getTodayAttendance);

// ─── Admin/bulk routes ────────────────────────────────────────────────────────
// Mark attendance for a single student
router.post('/', authMiddleware, attendanceController.markAttendance);

// Mark attendance in bulk
router.post('/bulk', authMiddleware, attendanceController.markBulkAttendance);

// Get attendance summary for date range
router.get('/summary/range', authMiddleware, attendanceController.getAttendanceSummary);

// Get attendance for a specific date (all students)
router.get('/date/:date', authMiddleware, attendanceController.getAttendanceByDate);

// Get students not marked for a specific date
router.get('/unmarked/:date', authMiddleware, attendanceController.getUnmarkedStudents);

// List all attendance with filters
router.get('/', authMiddleware, attendanceController.listAttendance);

// Get attendance for a specific student (keep after static routes)
router.get('/student/:studentId', authMiddleware, attendanceController.getStudentAttendance);

// Update attendance record
router.put('/:id', authMiddleware, attendanceController.updateAttendance);

// Delete attendance record
router.delete('/:id', authMiddleware, attendanceController.deleteAttendance);

export default router;
