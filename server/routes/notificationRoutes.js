import express from 'express';
import { getMyNotifications, markAllAsRead, markAsRead } from '../controllers/notificationController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getMyNotifications);
router.put('/mark-all-read', authMiddleware, markAllAsRead);
router.put('/:id/read', authMiddleware, markAsRead);

export default router;
