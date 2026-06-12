import SplRegistration from '../models/SplRegistration.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import DailyActivity from '../models/DailyActivity.js';
import Attendance from '../models/Attendance.js';
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
    const reg = await SplRegistration.findById(id);
    if (!reg) return res.status(404).json({ message: 'Registration not found' });

    // 1. Delete all Attendance linked to this SPL Registration
    await Attendance.deleteMany({ studentId: reg._id });

    // 2. Find associated User account via email
    if (reg.email) {
      const user = await User.findOne({ email: reg.email.trim().toLowerCase() });
      if (user) {
        // 3. Delete Tasks linked to User
        await Task.deleteMany({ studentId: user._id });
        // 4. Delete Daily Activities linked to User
        await DailyActivity.deleteMany({ studentId: user._id });
        // 5. Delete the User account
        await User.findByIdAndDelete(user._id);
      }
    }

    // 6. Delete the SPL Registration itself
    await SplRegistration.findByIdAndDelete(id);

    res.json({ message: 'Registration deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Delete failed', error: err.message });
  }
};
