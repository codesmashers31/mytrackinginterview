import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  category: { 
    type: String, 
    enum: [
      'Technical Practice', 
      'Technical Class', 
      'Aptitude Practice', 
      'Communication Practice', 
      'Theory & Concepts', 
      'Work / College', 
      'Sleep', 
      'Personal Routine', 
      'Break / Meals',
      'Other'
    ],
    default: 'Technical Practice'
  },
  subject: { type: String, default: '', trim: true },
  startTime: { type: String, required: true }, // e.g. "06:00"
  endTime: { type: String, required: true },   // e.g. "07:30"
  durationMinutes: { type: Number, default: 60 },
  targetDescription: { type: String, default: '' },
  daysActive: { 
    type: [String], 
    default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] 
  }
}, { _id: false });

const dailyChecklistSchema = new mongoose.Schema({
  date: { type: String, required: true }, // "YYYY-MM-DD"
  completedSlotIds: { type: [String], default: [] },
  totalCount: { type: Number, default: 0 },
  completedCount: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0 }, // Percentage
  notes: { type: String, default: '' }
}, { _id: false });

const timetableSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    unique: true 
  },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  batch: { type: String, default: '' },

  // 24-Hour Commitment Breakdown
  sleepHours: { type: Number, default: 7, min: 0, max: 24 },
  sleepStartTime: { type: String, default: '23:00' },
  sleepEndTime: { type: String, default: '06:00' },
  
  workOrJobHours: { type: Number, default: 0, min: 0, max: 24 },
  workDetails: { type: String, default: '' },
  
  personalRoutineHours: { type: Number, default: 2, min: 0, max: 24 }, // meals, exercise, travel
  
  technicalClassHours: { type: Number, default: 2, min: 0, max: 24 },
  communicationClassHours: { type: Number, default: 1, min: 0, max: 24 },
  aptitudeClassHours: { type: Number, default: 1, min: 0, max: 24 },

  availableSelfStudyHours: { type: Number, default: 11, min: 0, max: 24 },

  // Selected Target Skills
  selectedSubjects: { 
    type: [String], 
    default: ['HTML', 'CSS', 'JavaScript', 'React', 'SQL', 'Aptitude', 'Communication'] 
  },

  // Generated / Custom Time Slots
  slots: { 
    type: [slotSchema], 
    default: [] 
  },

  // Daily Checklists History
  dailyChecklists: { 
    type: [dailyChecklistSchema], 
    default: [] 
  },

  streak: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

timetableSchema.index({ studentId: 1 });
timetableSchema.index({ batch: 1 });

export default mongoose.model('Timetable', timetableSchema);
