import DailyActivity from '../models/DailyActivity.js';

// Helper to parse dates securely
const parseDateRange = (startDateStr, endDateStr) => {
  let start = null;
  let end = null;

  if (startDateStr) {
    start = new Date(startDateStr);
    start.setUTCHours(0, 0, 0, 0);
  }
  if (endDateStr) {
    end = new Date(endDateStr);
    end.setUTCHours(23, 59, 59, 999);
  }

  return { start, end };
};

// Create a daily activity log (Student only)
export const createActivityLog = async (req, res) => {
  try {
    const { module, topicCovered, trainer, timingDuration, remarks, date } = req.body;
    const studentId = req.user.id;
    const studentName = req.user.name || 'Student';
    const studentEmail = req.user.email;

    if (!module || !module.trim()) {
      return res.status(400).json({ message: 'Module is required' });
    }
    if (!topicCovered || !topicCovered.trim()) {
      return res.status(400).json({ message: 'Topic covered is required' });
    }

    const logDate = date ? new Date(date) : new Date();

    const newLog = new DailyActivity({
      studentId,
      studentName,
      studentEmail,
      date: logDate,
      module: module.trim(),
      topicCovered: topicCovered.trim(),
      trainer: trainer ? trainer.trim() : '',
      timingDuration: timingDuration ? timingDuration.trim() : '',
      remarks: remarks ? remarks.trim() : ''
    });

    await newLog.save();
    res.status(201).json(newLog);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save daily log', error: error.message });
  }
};

// Get personal daily logs (Student only)
export const getMyActivityLogs = async (req, res) => {
  try {
    const studentId = req.user.id;
    const logs = await DailyActivity.find({ studentId }).sort({ date: -1, createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve daily logs', error: error.message });
  }
};

// Get all daily logs with filters (Admin only)
export const getAllActivityLogs = async (req, res) => {
  try {
    const { studentId, startDate, endDate, search } = req.query;
    const query = {};

    if (studentId) {
      query.studentId = studentId;
    }

    // Filter by date range
    if (startDate || endDate) {
      const { start, end } = parseDateRange(startDate, endDate);
      query.date = {};
      if (start) query.date.$gte = start;
      if (end) query.date.$lte = end;
    }

    // Text search in new fields
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { module: regex },
        { topicCovered: regex },
        { trainer: regex },
        { remarks: regex },
        { studentName: regex },
        { studentEmail: regex }
      ];
    }

    const logs = await DailyActivity.find(query).sort({ date: -1, createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve daily logs', error: error.message });
  }
};
