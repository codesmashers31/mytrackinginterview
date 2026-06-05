import SplRegistration from '../models/SplRegistration.js';
import { sendRegistrationConfirmation } from '../utils/mailer.js';

export const createRegistration = async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const existing = await SplRegistration.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'This email is already registered' });
    }

    const payload = {
      ...req.body,
      email,
      ip: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || ''
    };

    const reg = new SplRegistration(payload);
    await reg.save();

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await sendRegistrationConfirmation(reg);
      } catch (emailError) {
        console.error('Failed to send registration email:', emailError);
      }
    } else {
      console.warn('SMTP not configured; confirmation email skipped.');
    }

    res.status(201).json(reg);
  } catch (err) {
    res.status(400).json({ message: 'Registration failed', error: err.message });
  }
};

export const listRegistrations = async (req, res) => {
  try {
    const regs = await SplRegistration.find().sort({ createdAt: -1 });
    res.json(regs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list registrations' });
  }
};

export const updateRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const reg = await SplRegistration.findByIdAndUpdate(id, updates, { returnDocument: 'after' });
    if (!reg) return res.status(404).json({ message: 'Registration not found' });
    res.json(reg);
  } catch (err) {
    res.status(400).json({ message: 'Update failed', error: err.message });
  }
};

export const deleteRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const reg = await SplRegistration.findByIdAndDelete(id);
    if (!reg) return res.status(404).json({ message: 'Registration not found' });
    res.json({ message: 'Registration deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Delete failed', error: err.message });
  }
};
