import SplRegistration from '../models/SplRegistration.js';

export const createRegistration = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      ip: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || ''
    };

    const reg = new SplRegistration(payload);
    await reg.save();
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
