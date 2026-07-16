import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import SplRegistration from '../models/SplRegistration.js';
import User from '../models/User.js';
import { createNotification, notifyAdmins } from '../utils/notifications.js';


const parseUTCDate = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD');
  }
  return new Date(Date.UTC(year, month - 1, day));
};

// Mark attendance for a single student
export const markAttendance = async (req, res) => {
  try {
    const { studentId, date, status, remarks } = req.body;

    if (!studentId || !date || !status) {
      return res.status(400).json({ message: 'Student ID, date, and status are required' });
    }

    // Verify student exists
    let student = await Student.findById(studentId);
    if (!student) {
      student = await SplRegistration.findById(studentId);
    }
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Parse date to a UTC midnight date to avoid timezone duplicates
    const attendanceDate = parseUTCDate(date);

    // Check if attendance already exists for this date
    let attendance = await Attendance.findOne({
      studentId,
      date: attendanceDate
    });

    if (attendance) {
      // Update existing record
      attendance.status = status;
      attendance.remarks = remarks || attendance.remarks;
      attendance.updatedAt = new Date();
      await attendance.save();
    } else {
      // Create new record
      attendance = new Attendance({
        studentId,
        studentName: student.name,
        studentEmail: student.email,
        date: attendanceDate,
        status,
        remarks: remarks || '',
        markedBy: 'Admin'
      });
      await attendance.save();
    }

    res.status(201).json(attendance);
  } catch (err) {
    res.status(400).json({ message: 'Failed to mark attendance', error: err.message });
  }
};

// Mark attendance for multiple students at once (bulk)
export const markBulkAttendance = async (req, res) => {
  try {
    const { attendanceRecords } = req.body;

    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return res.status(400).json({ message: 'Attendance records array is required' });
    }

    const results = [];

    for (const record of attendanceRecords) {
      const { studentId, date, status, remarks } = record;

      if (!studentId || !date || !status) {
        results.push({
          studentId,
          error: 'Student ID, date, and status are required'
        });
        continue;
      }

      try {
        let student = await Student.findById(studentId);
        if (!student) {
          student = await SplRegistration.findById(studentId);
        }
        if (!student) {
          results.push({
            studentId,
            error: 'Student not found'
          });
          continue;
        }

        const attendanceDate = parseUTCDate(date);

        let attendance = await Attendance.findOne({
          studentId,
          date: attendanceDate
        });

        if (attendance) {
          attendance.status = status;
          attendance.remarks = remarks || attendance.remarks;
          attendance.updatedAt = new Date();
          await attendance.save();
        } else {
          attendance = new Attendance({
            studentId,
            studentName: student.name,
            studentEmail: student.email,
            date: attendanceDate,
            status,
            remarks: remarks || '',
            markedBy: 'Admin'
          });
          await attendance.save();
        }

        results.push({
          studentId,
          success: true,
          data: attendance
        });
      } catch (err) {
        results.push({
          studentId,
          error: err.message
        });
      }
    }

    res.json({ message: 'Bulk attendance marking completed', results });
  } catch (err) {
    res.status(400).json({ message: 'Bulk attendance failed', error: err.message });
  }
};

// Get attendance for a specific student
export const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    let query = {};
    let student = await Student.findById(studentId).catch(() => null);
    if (!student) {
      student = await SplRegistration.findById(studentId).catch(() => null);
    }
    if (!student) {
      const user = await User.findById(studentId).catch(() => null);
      if (user) {
        if (user.studentId) {
          student = await Student.findById(user.studentId).catch(() => null);
          if (!student) {
            student = await SplRegistration.findById(user.studentId).catch(() => null);
          }
        }
        if (!student) {
          student = await Student.findOne({
            $or: [
              { email: user.email.toLowerCase() },
              { mobile: user.email }
            ]
          });
          if (!student) {
            student = await SplRegistration.findOne({
              $or: [
                { email: user.email.toLowerCase() },
                { mobile: user.email }
              ]
            });
          }
        }
      }
    }

    if (student) {
      query.studentId = student._id;
    } else {
      query.studentId = studentId;
    }

    if (startDate && endDate) {
      const start = parseUTCDate(startDate);
      const end = parseUTCDate(endDate);
      end.setUTCHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const attendance = await Attendance.find(query).sort({ date: -1 }).lean();
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch attendance', error: err.message });
  }
};

// Get attendance for a specific date (all students)
export const getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.params;

    const targetDate = parseUTCDate(date);
    const nextDate = new Date(targetDate);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);

    const attendance = await Attendance.find({
      date: {
        $gte: targetDate,
        $lt: nextDate
      }
    }).sort({ studentName: 1 }).lean();

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch attendance', error: err.message });
  }
};

// Get attendance summary for date range
export const getAttendanceSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const start = parseUTCDate(startDate);
    const end = parseUTCDate(endDate);
    end.setUTCHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      date: { $gte: start, $lte: end }
    }).lean();

    // Calculate summary
    const summary = {
      totalRecords: attendance.length,
      byStatus: {
        Present: attendance.filter(a => a.status === 'Present').length,
        Absent: attendance.filter(a => a.status === 'Absent').length,
        Late: attendance.filter(a => a.status === 'Late').length,
        Leave: attendance.filter(a => a.status === 'Leave').length
      },
      byStudent: {}
    };

    // Group by student
    attendance.forEach(record => {
      if (!summary.byStudent[record.studentId]) {
        summary.byStudent[record.studentId] = {
          name: record.studentName,
          email: record.studentEmail,
          Present: 0,
          Absent: 0,
          Late: 0,
          Leave: 0,
          total: 0
        };
      }
      summary.byStudent[record.studentId][record.status]++;
      summary.byStudent[record.studentId].total++;
    });

    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch summary', error: err.message });
  }
};

// Get all attendance with filters
export const listAttendance = async (req, res) => {
  try {
    const { startDate, endDate, status, studentId } = req.query;
    const query = {};

    if (startDate && endDate) {
      const start = parseUTCDate(startDate);
      const end = parseUTCDate(endDate);
      end.setUTCHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    if (status) {
      query.status = status;
    }

    if (studentId) {
      query.studentId = studentId;
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .populate('studentId', 'name email')
      .lean();

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list attendance', error: err.message });
  }
};

// Update attendance record
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const attendance = await Attendance.findByIdAndUpdate(
      id,
      { status, remarks: remarks || '', updatedAt: new Date() },
      { returnDocument: 'after' }
    );

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    res.json(attendance);
  } catch (err) {
    res.status(400).json({ message: 'Update failed', error: err.message });
  }
};

// Delete attendance record
export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const attendance = await Attendance.findByIdAndDelete(id);

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    res.json({ message: 'Attendance record deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Delete failed', error: err.message });
  }
};

// Get students not marked for a specific date
export const getUnmarkedStudents = async (req, res) => {
  try {
    const { date } = req.params;

    const targetDate = parseUTCDate(date);
    const nextDate = new Date(targetDate);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);

    // Get all active students (not inactive)
    const allStudents = await Student.find({ currentStatus: { $not: /^inactive/i } }).lean();
    const splRegs = await SplRegistration.find({ status: { $not: /^inactive/i } }).lean();
    const mappedSpls = splRegs.map(r => ({
      ...r,
      currentStatus: r.status
    }));
    const combinedStudents = [...allStudents, ...mappedSpls];

    // Get marked attendance for this date
    const markedAttendance = await Attendance.find({
      date: {
        $gte: targetDate,
        $lt: nextDate
      }
    }).lean();

    const markedStudentIds = markedAttendance.map(a => a.studentId.toString());

    // Find unmarked students
    const unmarkedStudents = combinedStudents.filter(
      student => !markedStudentIds.includes(student._id.toString())
    );

    res.json(unmarkedStudents);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch unmarked students', error: err.message });
  }
};

// Geolocation-Based Student Methods

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// K.K. Nagar Office Approx Coordinates
const TARGET_LAT = 13.0382;
const TARGET_LNG = 80.1983;
const MAX_RADIUS_METERS = 1000;

export const studentCheckIn = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const userId = req.user.id;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'Location coordinates are required' });
    }

    // Fetch user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let student = null;
    if (user.studentId) {
      student = await Student.findById(user.studentId);
      if (!student) {
        student = await SplRegistration.findById(user.studentId);
      }
    }
    if (!student) {
      student = await Student.findOne({
        $or: [
          { email: user.email.toLowerCase() },
          { mobile: user.email }
        ]
      });
      if (!student) {
        student = await SplRegistration.findOne({
          $or: [
            { email: user.email.toLowerCase() },
            { mobile: user.email }
          ]
        });
      }
    }

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found. Please contact administration.' });
    }

    const splStudentId = student._id;
    const studentName = student.name;
    const studentEmail = student.email || user.email;

    const today = parseUTCDate(new Date().toISOString().split('T')[0]);

    let attendance = await Attendance.findOne({ studentId: splStudentId, date: today });
    if (attendance) {
      if (attendance.checkInTime) {
        return res.status(400).json({ message: 'You have already checked in today.' });
      }
    }

    if (!attendance) {
      attendance = new Attendance({
        studentId: splStudentId,
        studentName,
        studentEmail,
        date: today,
        status: 'In Progress',
        checkInTime: new Date(),
        checkInLocation: { lat, lng, address: 'Office' },
        markedBy: 'Student'
      });
      await attendance.save();
    }

    // Send in-app notifications
    const checkInTimeString = new Date(attendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    await createNotification(
      userId,
      'Check-in Successful',
      `You checked in successfully at ${checkInTimeString}. Remember to check out at the end of your shift.`,
      'attendance'
    );
    await notifyAdmins(
      'Student Checked In',
      `${studentName} has checked in today at ${checkInTimeString}.`,
      'attendance'
    );

    res.status(201).json(attendance);
  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ message: 'Check-in failed', error: err.message });
  }
};

export const studentCheckOut = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const userId = req.user.id;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'Location coordinates are required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let student = null;
    if (user.studentId) {
      student = await Student.findById(user.studentId);
      if (!student) {
        student = await SplRegistration.findById(user.studentId);
      }
    }
    if (!student) {
      student = await Student.findOne({
        $or: [
          { email: user.email.toLowerCase() },
          { mobile: user.email }
        ]
      });
      if (!student) {
        student = await SplRegistration.findOne({
          $or: [
            { email: user.email.toLowerCase() },
            { mobile: user.email }
          ]
        });
      }
    }

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    const today = parseUTCDate(new Date().toISOString().split('T')[0]);

    // Look up by studentId instead of user email
    let attendance = await Attendance.findOne({ studentId: student._id, date: today });
    if (!attendance) {
      return res.status(404).json({ message: 'No check-in record found for today. Please check in first.' });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({ message: 'You have already checked out for today.' });
    }

    attendance.checkOutTime = new Date();
    attendance.checkOutLocation = { lat, lng, address: 'Office' };

    const diffMs = attendance.checkOutTime - attendance.checkInTime;
    const totalHours = diffMs / (1000 * 60 * 60);
    attendance.totalHours = parseFloat(totalHours.toFixed(2));

    // Mark present if 6+ hours, otherwise half-day
    if (attendance.totalHours >= 6) {
      attendance.status = 'Present';
    } else if (attendance.totalHours >= 3) {
      attendance.status = 'Late';
    } else {
      attendance.status = 'Absent';
    }

    await attendance.save();

    // Send in-app notifications
    const checkOutTimeString = new Date(attendance.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    await createNotification(
      userId,
      'Check-out Successful',
      `You checked out successfully at ${checkOutTimeString}. Total Hours: ${attendance.totalHours} hrs.`,
      'attendance'
    );
    await notifyAdmins(
      'Student Checked Out',
      `${student.name} has checked out today at ${checkOutTimeString}. Total Hours: ${attendance.totalHours} hrs.`,
      'attendance'
    );

    res.json(attendance);
  } catch (err) {
    console.error('Check-out error:', err);
    res.status(500).json({ message: 'Check-out failed', error: err.message });
  }
};

export const getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let student = null;
    if (user.studentId) {
      student = await Student.findById(user.studentId);
      if (!student) {
        student = await SplRegistration.findById(user.studentId);
      }
    }
    if (!student) {
      student = await Student.findOne({
        $or: [
          { email: user.email.toLowerCase() },
          { mobile: user.email }
        ]
      });
      if (!student) {
        student = await SplRegistration.findOne({
          $or: [
            { email: user.email.toLowerCase() },
            { mobile: user.email }
          ]
        });
      }
    }

    if (!student) {
      return res.json({ attendance: null });
    }

    const today = parseUTCDate(new Date().toISOString().split('T')[0]);

    // Search by studentId
    const attendance = await Attendance.findOne({ studentId: student._id, date: today });
    res.json({ attendance: attendance || null });
  } catch (err) {
    console.error('getTodayAttendance error:', err);
    res.status(500).json({ message: 'Failed to fetch attendance', error: err.message });
  }
};
