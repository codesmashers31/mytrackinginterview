import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { sendTestEmail } from '../utils/mailer.js';

const router = express.Router();

// Protected route to trigger a test email. Body: { to?: string }
router.post('/test-email', authMiddleware, async (req, res) => {
  const to = req.body.to || process.env.TEST_EMAIL || process.env.SMTP_USER || process.env.SENDGRID_FROM;
  if (!to) return res.status(400).json({ message: 'No recipient configured (provide `to` in body or set TEST_EMAIL/SENDGRID_FROM).' });

  try {
    const info = await sendTestEmail(to);
    return res.json({ success: true, info });
  } catch (err) {
    console.error('Test email failed:', err);
    return res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
