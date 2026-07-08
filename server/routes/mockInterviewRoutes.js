import express from 'express';
import MockAvailability from '../models/MockAvailability.js';
import MockInterview from '../models/MockInterview.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { createNotification, notifyAdmins } from '../utils/notifications.js';


const router = express.Router();

// Helper to convert time string (HH:MM) to minutes since midnight
const timeToMins = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// Helper to convert minutes since midnight back to HH:MM format
const minsToTime = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// --- AVAILABILITY ENDPOINTS (ADMIN ONLY) ---

// Get all availability blocks
router.get('/availability', authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    const filter = {};
    if (date) filter.date = date;
    const availabilities = await MockAvailability.find(filter).sort({ date: 1, startTime: 1 });
    res.json(availabilities);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving availability', error: error.message });
  }
});

// Add a new availability block
router.post('/availability', authMiddleware, async (req, res) => {
  try {
    if (!['admin', 'coordinator', 'placement'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Staff privileges required.' });
    }
    const { date, startTime, endTime } = req.body;
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ message: 'Date, start time, and end time are required' });
    }

    if (timeToMins(startTime) >= timeToMins(endTime)) {
      return res.status(400).json({ message: 'Start time must be before end time' });
    }

    const availability = new MockAvailability({
      date,
      startTime,
      endTime,
      addedBy: req.user.name || 'Admin'
    });
    await availability.save();
    res.status(201).json(availability);
  } catch (error) {
    res.status(500).json({ message: 'Error adding availability', error: error.message });
  }
});

// Delete an availability block
router.delete('/availability/:id', authMiddleware, async (req, res) => {
  try {
    if (!['admin', 'coordinator', 'placement'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Staff privileges required.' });
    }
    const availability = await MockAvailability.findByIdAndDelete(req.params.id);
    if (!availability) {
      return res.status(404).json({ message: 'Availability block not found' });
    }
    res.json({ message: 'Availability block deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting availability block', error: error.message });
  }
});

// Update an availability block
router.put('/availability/:id', authMiddleware, async (req, res) => {
  try {
    if (!['admin', 'coordinator', 'placement'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Staff privileges required.' });
    }
    const { date, startTime, endTime } = req.body;
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ message: 'Date, start time, and end time are required' });
    }

    if (timeToMins(startTime) >= timeToMins(endTime)) {
      return res.status(400).json({ message: 'Start time must be before end time' });
    }

    const availability = await MockAvailability.findById(req.params.id);
    if (!availability) {
      return res.status(404).json({ message: 'Availability block not found' });
    }

    availability.date = date;
    availability.startTime = startTime;
    availability.endTime = endTime;
    await availability.save();

    res.json(availability);
  } catch (error) {
    res.status(500).json({ message: 'Error updating availability', error: error.message });
  }
});



// --- BOOKING ENDPOINTS (ADMIN & STUDENT) ---

// Admin: Get all bookings (can filter by date day-wise)
router.get('/bookings', authMiddleware, async (req, res) => {
  try {
    if (!['admin', 'coordinator', 'placement'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Staff privileges required.' });
    }
    const { date } = req.query;
    const filter = {};
    if (date) filter.date = date;
    const bookings = await MockInterview.find(filter).sort({ date: 1, startTime: 1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving bookings', error: error.message });
  }
});

// Admin: Submit feedback for a booking (auto-completes the booking)
router.put('/bookings/:id/feedback', authMiddleware, async (req, res) => {
  try {
    if (!['admin', 'coordinator', 'placement'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Staff privileges required.' });
    }
    const { score, strengths, improvements, remarks, status } = req.body;
    const booking = await MockInterview.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = 'Completed';
    booking.feedback = {
      score: score !== undefined ? Number(score) : booking.feedback.score,
      strengths: strengths || booking.feedback.strengths,
      improvements: improvements || booking.feedback.improvements,
      remarks: remarks || booking.feedback.remarks,
      status: status || booking.feedback.status
    };

    await booking.save();

    // Send in-app notification to student
    await createNotification(
      booking.studentId,
      'Mock Interview Feedback Recorded',
      `Your mock interview feedback for ${booking.date} is ready. Score: ${booking.feedback.score}/10, Status: ${booking.feedback.status}.`,
      'mock'
    );

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error updating feedback', error: error.message });
  }
});

// Admin: Update general booking status (Scheduled, Cancelled, Completed)
router.put('/bookings/:id/status', authMiddleware, async (req, res) => {
  try {
    if (!['admin', 'coordinator', 'placement'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Staff privileges required.' });
    }
    const { status } = req.body;
    const booking = await MockInterview.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: 'after' }
    );
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error updating booking status', error: error.message });
  }
});

// Admin: Update general booking details (date, startTime, duration, status)
router.put('/bookings/:id', authMiddleware, async (req, res) => {
  try {
    if (!['admin', 'coordinator', 'placement'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Staff privileges required.' });
    }
    const { date, startTime, duration, status } = req.body;
    const booking = await MockInterview.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (date) booking.date = date;
    if (startTime) booking.startTime = startTime;
    if (duration !== undefined) {
      booking.duration = Number(duration);
    }
    if (startTime || duration !== undefined) {
      const startMin = timeToMins(booking.startTime);
      const endMin = startMin + booking.duration;
      booking.endTime = minsToTime(endMin);
    }
    if (status) booking.status = status;

    await booking.save();

    // Send in-app notification to student
    await createNotification(
      booking.studentId,
      'Mock Interview Updated',
      `Your mock interview details were updated by an instructor to ${booking.date} at ${booking.startTime} (${booking.duration} mins).`,
      'mock'
    );

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error updating booking', error: error.message });
  }
});

// Admin: Delete a booking completely
router.delete('/bookings/:id', authMiddleware, async (req, res) => {
  try {
    if (!['admin', 'coordinator', 'placement'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Staff privileges required.' });
    }
    const booking = await MockInterview.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Send in-app notification to student
    await createNotification(
      booking.studentId,
      'Mock Interview Deleted',
      `Your mock interview booking scheduled for ${booking.date} at ${booking.startTime} has been cancelled/deleted by the administrator.`,
      'mock'
    );

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting booking', error: error.message });
  }
});



// Student: Get dynamically generated available slots for booking on a specific date
router.get('/available-slots', authMiddleware, async (req, res) => {
  try {
    const { date, duration } = req.query; // date (YYYY-MM-DD), duration (15, 30, 45, or 60)
    if (!date || !duration) {
      return res.status(400).json({ message: 'Date and duration (15, 30, 45, 60) are required' });
    }

    const dur = Number(duration);
    if (![15, 30, 45, 60].includes(dur)) {
      return res.status(400).json({ message: 'Duration must be 15, 30, 45, or 60 minutes' });
    }

    // 1. Fetch all availability blocks on this date
    const availabilities = await MockAvailability.find({ date });
    // 2. Fetch all scheduled or completed bookings on this date (ignore cancelled ones)
    const bookings = await MockInterview.find({ date, status: { $in: ['Scheduled', 'Completed'] } });

    const availableSlots = [];

    // 3. For each availability block, generate potential slots and check overlaps
    for (const avail of availabilities) {
      const availStart = timeToMins(avail.startTime);
      const availEnd = timeToMins(avail.endTime);

      // We increment t by 15 minutes to generate slots
      for (let t = availStart; t + dur <= availEnd; t += 15) {
        const slotStart = t;
        const slotEnd = t + dur;

        // Check if slot overlaps with any active booking
        const isOverlapping = bookings.some(b => {
          const bStart = timeToMins(b.startTime);
          const bEnd = timeToMins(b.endTime);
          // Overlap condition: slotStart < bEnd AND bStart < slotEnd
          return slotStart < bEnd && bStart < slotEnd;
        });

        if (!isOverlapping) {
          availableSlots.push({
            startTime: minsToTime(slotStart),
            endTime: minsToTime(slotEnd),
            duration: dur
          });
        }
      }
    }

    // Sort slots by start time
    availableSlots.sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));

    res.json(availableSlots);
  } catch (error) {
    res.status(500).json({ message: 'Error calculating available slots', error: error.message });
  }
});

// Student: Book a mock interview slot
router.post('/bookings', authMiddleware, async (req, res) => {
  try {
    const { date, startTime, duration } = req.body;
    if (!date || !startTime || !duration) {
      return res.status(400).json({ message: 'Date, start time, and duration are required' });
    }

    const dur = Number(duration);
    if (![15, 30, 45, 60].includes(dur)) {
      return res.status(400).json({ message: 'Duration must be 15, 30, 45, or 60 minutes' });
    }

    const startMin = timeToMins(startTime);
    const endMin = startMin + dur;
    const endTime = minsToTime(endMin);

    // 1. Verify that the requested interval fits entirely within one of the admin's availability blocks
    const availabilities = await MockAvailability.find({ date });
    const fitsAvailability = availabilities.some(avail => {
      const availStart = timeToMins(avail.startTime);
      const availEnd = timeToMins(avail.endTime);
      return availStart <= startMin && endMin <= availEnd;
    });

    if (!fitsAvailability) {
      return res.status(400).json({ message: 'Requested slot is not within admin available hours' });
    }

    // 2. Verify that there is no overlap with any existing scheduled/completed bookings on this date
    const bookings = await MockInterview.find({ date, status: { $in: ['Scheduled', 'Completed'] } });
    const hasOverlap = bookings.some(b => {
      const bStart = timeToMins(b.startTime);
      const bEnd = timeToMins(b.endTime);
      return startMin < bEnd && bStart < endMin;
    });

    if (hasOverlap) {
      return res.status(400).json({ message: 'Requested slot overlaps with an existing booking' });
    }

    // 3. Prevent duplicate bookings for the same student on the same day (scheduled status)
    const existingStudentBooking = await MockInterview.findOne({
      studentId: req.user.id,
      date,
      status: 'Scheduled'
    });

    if (existingStudentBooking) {
      return res.status(400).json({ message: 'You already have a mock interview scheduled on this date' });
    }

    // Create the booking
    const booking = new MockInterview({
      studentId: req.user.id,
      studentName: req.user.name || 'Student',
      studentEmail: req.user.email,
      date,
      startTime,
      endTime,
      duration: dur,
      status: 'Scheduled',
      feedback: {
        score: null,
        strengths: '',
        improvements: '',
        remarks: '',
        status: 'Pending'
      }
    });

    await booking.save();

    // Send in-app notifications
    await createNotification(
      req.user.id,
      'Mock Interview Scheduled',
      `You scheduled a mock interview on ${date} at ${startTime} (${dur} mins).`,
      'mock'
    );
    await notifyAdmins(
      'New Mock Interview Booking',
      `Student ${booking.studentName} booked a mock interview for ${date} at ${startTime}.`,
      'mock'
    );

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create booking', error: error.message });
  }
});

// Student: Get bookings for the logged-in student
router.get('/my-bookings', authMiddleware, async (req, res) => {
  try {
    const bookings = await MockInterview.find({ studentId: req.user.id }).sort({ date: 1, startTime: 1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving student bookings', error: error.message });
  }
});

// Student: Cancel their own booking
router.put('/bookings/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const booking = await MockInterview.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify ownership
    if (booking.studentId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied. You do not own this booking.' });
    }

    if (booking.status !== 'Scheduled') {
      return res.status(400).json({ message: `Cannot cancel a booking that is already ${booking.status}` });
    }

    booking.status = 'Cancelled';
    await booking.save();

    // Send in-app notifications
    await createNotification(
      req.user.id,
      'Mock Interview Cancelled',
      `You cancelled your mock interview scheduled for ${booking.date} at ${booking.startTime}.`,
      'mock'
    );
    await notifyAdmins(
      'Mock Interview Cancelled by Student',
      `Student ${booking.studentName} has cancelled their mock interview scheduled for ${booking.date} at ${booking.startTime}.`,
      'mock'
    );

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling booking', error: error.message });
  }
});

export default router;
