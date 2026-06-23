import Student from '../models/Student.js';
import SplRegistration from '../models/SplRegistration.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import DailyActivity from '../models/DailyActivity.js';
import Attendance from '../models/Attendance.js';
import { sendRegistrationConfirmation } from '../utils/mailer.js';

export const createRegistration = async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const mobile = (req.body.mobile || '').trim();
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if a regular student already exists in the system (either by email or mobile)
    let regularStudent = null;
    if (mobile) {
      regularStudent = await Student.findOne({ mobile, enrollments: 'Regular' });
    }
    if (!regularStudent && email) {
      regularStudent = await Student.findOne({ email, enrollments: 'Regular' });
    }

    const payload = {
      ...req.body,
      email,
      ip: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || ''
    };

    let resultRecord = null;
    let isMerged = false;

    // Check if student belongs to regular directory (making them a duplicate merge candidate)
    if (regularStudent) {
      isMerged = true;
      // Upgrade regular student to SPL without duplicating records
      if (!regularStudent.enrollments.includes('SPL')) {
        regularStudent.enrollments.push('SPL');
      }
      
      // Update SPL specific fields
      regularStudent.stack = payload.stack || regularStudent.stack;
      regularStudent.willingCompanyProcess = payload.willingCompanyProcess !== undefined ? payload.willingCompanyProcess : regularStudent.willingCompanyProcess;
      regularStudent.willing30Days = payload.willing30Days || regularStudent.willing30Days;
      regularStudent.acceptOffer = payload.acceptOffer || regularStudent.acceptOffer;
      regularStudent.fullEffort = payload.fullEffort || regularStudent.fullEffort;
      regularStudent.issues = payload.issues || regularStudent.issues;
      regularStudent.needMost = payload.needMost || regularStudent.needMost;
      regularStudent.status = payload.status || regularStudent.status || 'New';
      regularStudent.statusReason = payload.statusReason || regularStudent.statusReason || '';
      
      regularStudent.studentType = regularStudent.isFrontend ? 'Frontend' : 'Regular';

      await regularStudent.save();
      resultRecord = regularStudent;
      
      // Clean up from SplRegistration if they existed there
      await SplRegistration.deleteMany({
        $or: [
          { email },
          ...(mobile ? [{ mobile }] : [])
        ]
      });
    } else {
      // Create or update in SplRegistration collection
      let splReg = await SplRegistration.findOne({
        $or: [
          { email },
          ...(mobile ? [{ mobile }] : [])
        ]
      });

      if (splReg) {
        Object.assign(splReg, payload);
        await splReg.save();
        resultRecord = splReg;
      } else {
        splReg = new SplRegistration(payload);
        await splReg.save();
        resultRecord = splReg;
      }
    }

    // Ensure User login account maps correctly
    const expectedUserEmail = payload.email || payload.mobile;
    if (expectedUserEmail) {
      let user = await User.findOne({ email: expectedUserEmail.toLowerCase().trim() });
      if (user) {
        user.studentId = resultRecord._id;
        await user.save();
      } else {
        const password = payload.mobile || payload.email;
        user = new User({
          name: payload.name || 'SPL Student',
          email: expectedUserEmail.toLowerCase().trim(),
          password,
          role: 'student',
          studentId: resultRecord._id
        });
        await user.save();
      }
    }

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await sendRegistrationConfirmation(resultRecord);
      } catch (emailError) {
        console.error('Failed to send registration email:', emailError);
      }
    }

    res.status(isMerged ? 200 : 201).json(resultRecord);
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

    const isSpl = await SplRegistration.exists({ _id: id });
    if (isSpl && updates.passedOutYear !== undefined) {
      updates.batch = updates.passedOutYear;
    }
    
    // Try to find and update in SplRegistration
    let reg = await SplRegistration.findOneAndUpdate(
      { _id: id }, 
      updates, 
      { returnDocument: 'after' }
    );
    
    if (!reg) {
      // If not found in SplRegistration, update in Student
      reg = await Student.findOneAndUpdate(
        { _id: id },
        updates,
        { returnDocument: 'after' }
      );
    }

    if (!reg) return res.status(404).json({ message: 'Registration not found' });
    res.json(reg);
  } catch (err) {
    res.status(400).json({ message: 'Update failed', error: err.message });
  }
};

export const deleteRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check in SplRegistration collection
    const splReg = await SplRegistration.findOne({ _id: id });
    if (splReg) {
      // Delete associated attendance, tasks, daily activities, and login
      await Attendance.deleteMany({ studentId: splReg._id });
      
      const userQuery = [];
      if (splReg.email) userQuery.push({ email: splReg.email.trim().toLowerCase() });
      if (splReg.mobile) userQuery.push({ email: splReg.mobile.trim() });

      if (userQuery.length > 0) {
        const user = await User.findOne({ $or: userQuery });
        if (user) {
          await Task.deleteMany({ studentId: user._id });
          await DailyActivity.deleteMany({ studentId: user._id });
          await User.findByIdAndDelete(user._id);
        }
      }

      await SplRegistration.findByIdAndDelete(id);
      return res.json({ message: 'SPL registration and login account deleted successfully' });
    }

    // Check in Student collection
    const regularStudent = await Student.findOne({ _id: id });
    if (regularStudent) {
      // If student is enrolled in BOTH Regular and SPL, only remove the SPL enrollment and SPL fields.
      if (regularStudent.enrollments.includes('Regular') && regularStudent.enrollments.includes('SPL')) {
        regularStudent.enrollments = regularStudent.enrollments.filter(e => e !== 'SPL');
        regularStudent.stack = '';
        regularStudent.willingCompanyProcess = false;
        regularStudent.willing30Days = '';
        regularStudent.acceptOffer = '';
        regularStudent.fullEffort = '';
        regularStudent.issues = '';
        regularStudent.needMost = '';
        
        regularStudent.studentType = regularStudent.isFrontend ? 'Frontend' : 'Regular';
        await regularStudent.save();
        
        return res.json({ message: 'SPL enrollment removed, regular record preserved.' });
      }
    }

    return res.status(404).json({ message: 'Registration not found' });
  } catch (err) {
    res.status(400).json({ message: 'Delete failed', error: err.message });
  }
};

