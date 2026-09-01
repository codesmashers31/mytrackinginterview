import JobApplication from '../models/JobApplication.js';
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

// Create a job application (Student only)
export const createJobApplication = async (req, res) => {
  try {
    const {
      companyName,
      jobRole,
      applyDate,
      applicationType,
      hrDetails,
      jobLink,
      status,
      notes,
      followUpDate
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

    const newApplication = new JobApplication({
      studentId,
      studentName,
      studentEmail,
      batch,
      companyName: companyName.trim(),
      jobRole: jobRole ? jobRole.trim() : '',
      applyDate: applyDate ? new Date(applyDate) : new Date(),
      applicationType: applicationType || 'Email Outreach',
      hrDetails: {
        name: hrDetails?.name ? hrDetails.name.trim() : '',
        email: hrDetails?.email ? hrDetails.email.trim() : '',
        phone: hrDetails?.phone ? hrDetails.phone.trim() : '',
        linkedin: hrDetails?.linkedin ? hrDetails.linkedin.trim() : ''
      },
      jobLink: jobLink ? jobLink.trim() : '',
      status: status || 'Applied',
      notes: notes ? notes.trim() : '',
      followUpDate: followUpDate ? new Date(followUpDate) : null
    });

    await newApplication.save();
    res.status(201).json(newApplication);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create job application', error: error.message });
  }
};

// Get personal job applications (Student only)
export const getMyJobApplications = async (req, res) => {
  try {
    const studentId = req.user.id;
    const applications = await JobApplication.find({ studentId })
      .sort({ applyDate: -1, createdAt: -1 })
      .lean();
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve applications', error: error.message });
  }
};

// Update a job application (Student or Admin)
export const updateJobApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // If student, ensure they own the record
    const query = req.user.role === 'admin' || req.user.role === 'coordinator' 
      ? { _id: id } 
      : { _id: id, studentId: req.user.id };

    const application = await JobApplication.findOneAndUpdate(
      query,
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!application) {
      return res.status(404).json({ message: 'Application record not found or unauthorized' });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update application', error: error.message });
  }
};

// Delete a job application (Student or Admin)
export const deleteJobApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const query = req.user.role === 'admin' || req.user.role === 'coordinator' 
      ? { _id: id } 
      : { _id: id, studentId: req.user.id };

    const deleted = await JobApplication.findOneAndDelete(query);
    if (!deleted) {
      return res.status(404).json({ message: 'Application record not found or unauthorized' });
    }

    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete application', error: error.message });
  }
};

// Get all job applications with filters (Admin & Coordinator)
export const getAllJobApplications = async (req, res) => {
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
      query.status = status;
    }

    if (startDate || endDate) {
      const { start, end } = parseDateRange(startDate, endDate);
      query.applyDate = {};
      if (start) query.applyDate.$gte = start;
      if (end) query.applyDate.$lte = end;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { companyName: regex },
        { jobRole: regex },
        { studentName: regex },
        { studentEmail: regex },
        { 'hrDetails.name': regex },
        { 'hrDetails.email': regex },
        { notes: regex }
      ];
    }

    const applications = await JobApplication.find(query)
      .sort({ applyDate: -1, createdAt: -1 })
      .lean();

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve applications', error: error.message });
  }
};
