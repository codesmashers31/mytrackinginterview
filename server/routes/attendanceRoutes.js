import express from 'express';
import * as attendanceController from '../controllers/attendanceController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Mark attendance for a single student
router.post('/', authMiddleware, attendanceController.markAttendance);

// Mark attendance in bulk
router.post('/bulk', authMiddleware, attendanceController.markBulkAttendance);

// Get attendance for a specific student
router.get('/student/:studentId', authMiddleware, attendanceController.getStudentAttendance);

// Get attendance for a specific date
router.get('/date/:date', authMiddleware, attendanceController.getAttendanceByDate);

// Get students not marked for a specific date
router.get('/unmarked/:date', authMiddleware, attendanceController.getUnmarkedStudents);

// Get attendance summary
router.get('/summary/range', authMiddleware, attendanceController.getAttendanceSummary);

// List all attendance with filters
router.get('/', authMiddleware, attendanceController.listAttendance);

// Update attendance record
router.put('/:id', authMiddleware, attendanceController.updateAttendance);

// Delete attendance record
router.delete('/:id', authMiddleware, attendanceController.deleteAttendance);

export default router;
