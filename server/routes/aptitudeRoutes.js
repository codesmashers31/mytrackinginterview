import express from 'express';
import {
  getAptitudeTopics,
  generateAptitudeTest,
  submitAptitudeTest,
  getMyAptitudeHistory,
  getMyAptitudeAnalytics,
  getAdminAptitudeOverview
} from '../controllers/aptitudeController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';

const router = express.Router();

// Student endpoints
router.get('/topics', authMiddleware, getAptitudeTopics);
router.post('/generate-test', authMiddleware, generateAptitudeTest);
router.post('/submit-test', authMiddleware, submitAptitudeTest);
router.get('/my-history', authMiddleware, getMyAptitudeHistory);
router.get('/my-analytics', authMiddleware, getMyAptitudeAnalytics);

// Admin endpoints
router.get('/admin/overview', authMiddleware, requireRole(['admin', 'coordinator', 'placement']), getAdminAptitudeOverview);

export default router;
