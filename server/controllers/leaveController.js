import LeaveRequest from '../models/LeaveRequest.js';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import SplRegistration from '../models/SplRegistration.js';
import { createNotification, notifyAdmins } from '../utils/notifications.js';

// Apply for a Leave or Permission (Student only)
export const applyLeaveRequest = async (req, res) => {
  try {
    const { type, startDate, endDate, date, startTime, endTime, reason, modeTransition } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Reason is required' });
    }

    const newRequestData = {
      studentId: userId,
      studentName: user.name,
      studentEmail: user.email,
      type,
      reason: reason.trim()
    };

    if (type === 'Leave') {
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start Date and End Date are required for Leaves.' });
      }
      newRequestData.startDate = new Date(startDate);
      newRequestData.endDate = new Date(endDate);
      
      if (newRequestData.endDate < newRequestData.startDate) {
        return res.status(400).json({ message: 'End Date cannot be before Start Date.' });
      }
    } else if (type === 'Permission') {
      if (!date || !startTime || !endTime) {
        return res.status(400).json({ message: 'Date, Start Time, and End Time are required for Permissions.' });
      }
      newRequestData.date = new Date(date);
      newRequestData.startTime = startTime;
      newRequestData.endTime = endTime;
      newRequestData.modeTransition = modeTransition || 'None';
    } else {
      return res.status(400).json({ message: 'Invalid request type. Must be Leave or Permission.' });
    }

    const leaveRequest = new LeaveRequest(newRequestData);
    await leaveRequest.save();

    // Notify admins about the new request
    const dateDetail = type === 'Leave' 
      ? `from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`
      : `on ${new Date(date).toLocaleDateString()} (${startTime} to ${endTime})`;

    await notifyAdmins(
      `New ${type} Request`,
      `${user.name} has submitted a ${type} request ${dateDetail}. Reason: ${reason.trim()}`,
      'attendance'
    );

    res.status(201).json(leaveRequest);
  } catch (error) {
    console.error('Error applying for leave/permission:', error);
    res.status(500).json({ message: 'Failed to submit request', error: error.message });
  }
};

// Retrieve student's personal requests (Student only)
export const getMyLeaveRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await LeaveRequest.find({ studentId: userId }).sort({ createdAt: -1 }).lean();
    res.json(requests);
  } catch (error) {
    console.error('Error fetching student leave requests:', error);
    res.status(500).json({ message: 'Failed to fetch your requests', error: error.message });
  }
};

// Retrieve all requests (Admin & Coordinator only)
export const getAllLeaveRequests = async (req, res) => {
  try {
    const requests = await LeaveRequest.find().sort({ createdAt: -1 }).lean();

    const emails = [...new Set(
      requests.map(r => r.studentEmail && r.studentEmail.trim().toLowerCase()).filter(Boolean)
    )];

    const [students, splRegs] = await Promise.all([
      Student.find({ email: { $in: emails } }, 'email batch passedOutYear').lean(),
      SplRegistration.find({ email: { $in: emails } }, 'email batch passedOutYear').lean()
    ]);

    const studentMap = new Map(students.map(s => [s.email.trim().toLowerCase(), s]));
    const splMap = new Map(splRegs.map(s => [s.email.trim().toLowerCase(), s]));

    const enrichedRequests = requests.map((item) => {
      let studentBatch = '';
      let studentYear = '';

      if (item.studentEmail) {
        const email = item.studentEmail.trim().toLowerCase();
        const student = studentMap.get(email);
        if (student) {
          studentBatch = student.batch || '';
          studentYear = student.passedOutYear || '';
        } else {
          const splReg = splMap.get(email);
          if (splReg) {
            studentBatch = splReg.batch || '';
            studentYear = splReg.passedOutYear || '';
          }
        }
      }

      return {
        ...item,
        studentBatch,
        studentYear
      };
    });

    res.json(enrichedRequests);
  } catch (error) {
    console.error('Error fetching all leave requests:', error);
    res.status(500).json({ message: 'Failed to fetch leave requests', error: error.message });
  }
};

// Approve or Reject a Leave/Permission request (Admin & Coordinator only)
export const reviewLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewerRemarks } = req.body;
    const reviewerId = req.user.id;
    const reviewerName = req.user.name || 'Administrator';

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Approved or Rejected.' });
    }

    const leaveRequest = await LeaveRequest.findById(id);
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave/Permission request not found.' });
    }

    if (leaveRequest.status !== 'Pending') {
      return res.status(400).json({ message: 'This request has already been reviewed.' });
    }

    leaveRequest.status = status;
    leaveRequest.reviewedBy = reviewerId;
    leaveRequest.reviewerName = reviewerName;
    leaveRequest.reviewerRemarks = reviewerRemarks ? reviewerRemarks.trim() : '';
    await leaveRequest.save();

    // Notify the student about the status update
    await createNotification(
      leaveRequest.studentId,
      `${leaveRequest.type} Request ${status}`,
      `Your request for ${leaveRequest.type} has been ${status.toLowerCase()}.${reviewerRemarks ? ` Remarks: ${reviewerRemarks}` : ''}`,
      status === 'Approved' ? 'success' : 'danger'
    );

    // Integrate with Attendance if approved and type is Leave
    if (status === 'Approved' && leaveRequest.type === 'Leave') {
      const start = new Date(leaveRequest.startDate);
      const end = new Date(leaveRequest.endDate);

      // Create UTC dates to loop reliably
      let current = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
      const finalEnd = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

      // Resolve student profile in Student to fetch the correct studentId
      const student = await Student.findOne({ email: leaveRequest.studentEmail.toLowerCase() });
      const splStudentId = student ? student._id : leaveRequest.studentId;

      const bulkOps = [];
      while (current <= finalEnd) {
        const attendanceDate = new Date(current);
        bulkOps.push({
          updateOne: {
            filter: {
              studentId: splStudentId,
              date: attendanceDate
            },
            update: {
              $set: {
                studentId: splStudentId,
                studentName: leaveRequest.studentName,
                studentEmail: leaveRequest.studentEmail.toLowerCase(),
                status: 'Leave',
                remarks: `Leave Approved: ${leaveRequest.reason}`,
                markedBy: reviewerName
              }
            },
            upsert: true
          }
        });

        // Increment day
        current.setUTCDate(current.getUTCDate() + 1);
      }

      if (bulkOps.length > 0) {
        await Attendance.bulkWrite(bulkOps);
      }
    }

    res.json(leaveRequest);
  } catch (error) {
    console.error('Error reviewing leave/permission request:', error);
    res.status(500).json({ message: 'Failed to review request', error: error.message });
  }
};
