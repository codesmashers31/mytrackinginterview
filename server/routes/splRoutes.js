import express from 'express';
import * as splController from '../controllers/splController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

// Public endpoint to receive SPL registrations
router.post('/', splController.createRegistration);

// Admin-only listing of registrations
router.get('/', authMiddleware, splController.listRegistrations);

// Admin-only upload Excel registrations
router.post('/upload', authMiddleware, upload.single('file'), splController.uploadRegistrations);

// Admin-only update registration (status, reason, etc.)
router.put('/:id', authMiddleware, splController.updateRegistration);

// Admin-only delete registration
router.delete('/:id', authMiddleware, splController.deleteRegistration);

export default router;
