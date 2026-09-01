import express from 'express';
import multer from 'multer';
import {
  getCommunicationTopics,
  generateCustomCommunicationTopic,
  submitSpeechForEvaluation,
  getMyCommunicationHistory,
  getMyCommunicationAnalytics,
  getAdminCommunicationOverview
} from '../controllers/communicationController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB audio limit
});

const router = express.Router();

// Student endpoints
router.get('/topics', authMiddleware, getCommunicationTopics);
router.post('/generate-topic', authMiddleware, generateCustomCommunicationTopic);
router.post('/submit-speech', authMiddleware, upload.single('audio'), submitSpeechForEvaluation);
router.get('/my-history', authMiddleware, getMyCommunicationHistory);
router.get('/my-analytics', authMiddleware, getMyCommunicationAnalytics);

// Admin endpoints
router.get('/admin/overview', authMiddleware, requireRole(['admin', 'coordinator', 'placement']), getAdminCommunicationOverview);

export default router;
