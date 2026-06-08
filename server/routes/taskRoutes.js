import express from 'express';
import * as taskController from '../controllers/taskController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, requireRole('admin'), taskController.createTask);
router.get('/', authMiddleware, requireRole('admin'), taskController.listTasks);
router.get('/my/list', authMiddleware, requireRole('student'), taskController.getMyTasks);
router.get('/student/:studentId', authMiddleware, requireRole('admin'), taskController.getStudentTasks);
router.get('/:id', authMiddleware, requireRole('admin'), taskController.getTaskById);
router.put('/:id', authMiddleware, taskController.updateTask);
router.delete('/:id', authMiddleware, requireRole('admin'), taskController.deleteTask);

export default router;
