import InterviewExperience from '../models/InterviewExperience.js';
import Student from '../models/Student.js';

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

// Create an interview experience (Student only)
export const createInterviewExperience = async (req, res) => {
  try {
    const {
      companyName,
      role,
      interviewDate,
      interviewMode,
      overallStatus,
      aptitudeRound,
      communicationRound,
      technicalRound,
      hrRound,
      overallExperience,
      tipsAndLearnings
    } = req.body;

    if (!companyName || !companyName.trim()) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    const studentId = req.user.id;
    const studentName = req.user.name || 'Student';
    const studentEmail = req.user.email;

    // Fetch batch from student profile if available
    let batch = '';
    if (req.user.studentId) {
      const studentDoc = await Student.findById(req.user.studentId).select('batch').lean();
      if (studentDoc && studentDoc.batch) {
        batch = studentDoc.batch;
      }
    }

    const newExperience = new InterviewExperience({
      studentId,
      studentName,
      studentEmail,
      batch,
      companyName: companyName.trim(),
      role: role ? role.trim() : '',
      interviewDate: interviewDate ? new Date(interviewDate) : new Date(),
      interviewMode: interviewMode || 'Online',
      overallStatus: overallStatus || 'Attended / In Progress',
      aptitudeRound: aptitudeRound || {},
      communicationRound: communicationRound || {},
      technicalRound: technicalRound || {},
      hrRound: hrRound || {},
      overallExperience: overallExperience ? overallExperience.trim() : '',
      tipsAndLearnings: tipsAndLearnings ? tipsAndLearnings.trim() : ''
    });

    await newExperience.save();
    res.status(201).json(newExperience);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save interview experience', error: error.message });
  }
};

// Get personal interview experiences (Student only)
export const getMyInterviewExperiences = async (req, res) => {
  try {
    const studentId = req.user.id;
    const experiences = await InterviewExperience.find({ studentId })
      .sort({ interviewDate: -1, createdAt: -1 })
      .lean();
    res.json(experiences);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve interview experiences', error: error.message });
  }
};

// Update an interview experience (Student or Admin)
export const updateInterviewExperience = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    const query = req.user.role === 'admin' || req.user.role === 'coordinator' 
      ? { _id: id } 
      : { _id: id, studentId: req.user.id };

    const experience = await InterviewExperience.findOneAndUpdate(
      query,
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!experience) {
      return res.status(404).json({ message: 'Interview record not found or unauthorized' });
    }

    res.json(experience);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update interview experience', error: error.message });
  }
};

// Delete an interview experience (Student or Admin)
export const deleteInterviewExperience = async (req, res) => {
  try {
    const { id } = req.params;
    const query = req.user.role === 'admin' || req.user.role === 'coordinator' 
      ? { _id: id } 
      : { _id: id, studentId: req.user.id };

    const deleted = await InterviewExperience.findOneAndDelete(query);
    if (!deleted) {
      return res.status(404).json({ message: 'Interview record not found or unauthorized' });
    }

    res.json({ message: 'Interview record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete interview record', error: error.message });
  }
};

// Get all interview experiences with filters (Admin & Coordinator)
export const getAllInterviewExperiences = async (req, res) => {
  try {
    const { studentId, batch, status, search, startDate, endDate } = req.query;
    const query = {};

    if (studentId && studentId !== 'All') {
      query.studentId = studentId;
    }

    if (batch && batch !== 'All') {
      query.batch = batch;
    }

    if (status && status !== 'All') {
      query.overallStatus = status;
    }

    if (startDate || endDate) {
      const { start, end } = parseDateRange(startDate, endDate);
      query.interviewDate = {};
      if (start) query.interviewDate.$gte = start;
      if (end) query.interviewDate.$lte = end;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { companyName: regex },
        { role: regex },
        { studentName: regex },
        { studentEmail: regex },
        { overallExperience: regex },
        { tipsAndLearnings: regex },
        { 'technicalRound.topicsCovered': regex },
        { 'technicalRound.questionsAsked': regex },
        { 'aptitudeRound.topicsCovered': regex },
        { 'communicationRound.questionsAsked': regex }
      ];
    }

    const experiences = await InterviewExperience.find(query)
      .sort({ interviewDate: -1, createdAt: -1 })
      .lean();

    res.json(experiences);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve interview experiences', error: error.message });
  }
};
