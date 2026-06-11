import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import SplRegistration from '../models/SplRegistration.js';
import authMiddleware from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';

const router = express.Router();

const signJwt = (payload) => jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

const ensureStudentAccountsFromSpl = async () => {
  const registrations = await SplRegistration.find();
  const students = [];

  for (const reg of registrations) {
    if (!reg.email) continue;
    const email = reg.email.trim().toLowerCase();
    let user = await User.findOne({ email });

    if (!user) {
      const password = reg.mobile && reg.mobile.trim() ? reg.mobile.trim() : email;
      user = new User({
        name: reg.name || email,
        email,
        password,
        role: 'student'
      });
      await user.save();
    }

    students.push({
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: reg.mobile || '',
      grade: reg.grade || '',
      status: reg.status || '',
      registrationId: reg._id
    });
  }

  return students;
};

router.get('/spl-students', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const students = await ensureStudentAccountsFromSpl();
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load SPL student accounts', error: error.message });
  }
});

// Register a Coordination user (admin only)
router.post('/register-coordinator', authMiddleware, requireRole('admin'), async (req, res) => {
  console.log('Register coordinator payload:', req.body);
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  try {
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    const user = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: 'coordinator'
    });
    await user.save();
    res.status(201).json({ message: 'Coordinator account created' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create coordinator', error: error.message });
  }
});

// Register a Placement Support user (admin only)
router.post('/register-placement', authMiddleware, requireRole('admin'), async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  try {
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    const user = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: 'placement'
    });
    await user.save();
    res.status(201).json({ message: 'Placement Support account created' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create placement support account', error: error.message });
  }
});

// Get all coordinators (admin only)
router.get('/coordinators', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const coordinators = await User.find({ role: 'coordinator' }).select('name email createdAt');
    res.json(coordinators);
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch coordinators', error: error.message });
  }
});

// Get all placement support accounts (admin only)
router.get('/placements', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const placements = await User.find({ role: 'placement' }).select('name email createdAt');
    res.json(placements);
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch placement support accounts', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    await ensureStudentAccountsFromSpl();

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Access Denied: Invalid Credentials' });
    }

    const token = signJwt({ id: user._id, email: user.email, role: user.role, name: user.name });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Auth server error', error: error.message });
  }
});

router.post('/register-student', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  try {
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: 'student'
    });
    await user.save();
    res.status(201).json({ message: 'Student account created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

router.get('/students', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('name email createdAt');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch student accounts', error: error.message });
  }
});

router.post('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password verification failed' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Password update failed', error: error.message });
  }
});

export default router;
