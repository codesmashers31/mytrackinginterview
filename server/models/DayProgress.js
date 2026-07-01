import mongoose from 'mongoose';

const dayProgressSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dayNumber: { type: Number, required: true },
  weekNumber: { type: Number, required: true },
  tasks: {
    reading: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
    comm: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
    tech: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
    coding: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
    logical: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
    assignment: { 
      type: String, 
      enum: ['Pending', 'In Progress', 'Submitted', 'Reviewed', 'Rejected', 'Completed'], 
      default: 'Pending' 
    }
  },
  submissionLink: { type: String, default: '' },
  mentorFeedback: { type: String, default: '' },
  grade: { type: String, default: '' },
  completedAt: { type: Date }
}, { timestamps: true });

dayProgressSchema.index({ studentId: 1, dayNumber: 1 }, { unique: true });

export default mongoose.model('DayProgress', dayProgressSchema);
