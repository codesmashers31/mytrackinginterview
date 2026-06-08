import Attendance from '../models/Attendance.js';
import SplRegistration from '../models/SplRegistration.js';

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
    const student = await SplRegistration.findById(studentId);
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
        const student = await SplRegistration.findById(studentId);
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

    const query = { studentId };

    if (startDate && endDate) {
      const start = parseUTCDate(startDate);
      const end = parseUTCDate(endDate);
      end.setUTCHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const attendance = await Attendance.find(query).sort({ date: -1 });
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
    }).sort({ studentName: 1 });

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
    });

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
      .populate('studentId', 'name email');

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

    // Get all SPL students
    const allStudents = await SplRegistration.find();

    // Get marked attendance for this date
    const markedAttendance = await Attendance.find({
      date: {
        $gte: targetDate,
        $lt: nextDate
      }
    });

    const markedStudentIds = markedAttendance.map(a => a.studentId.toString());

    // Find unmarked students
    const unmarkedStudents = allStudents.filter(
      student => !markedStudentIds.includes(student._id.toString())
    );

    res.json(unmarkedStudents);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch unmarked students', error: err.message });
  }
};
