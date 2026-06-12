import mongoose from 'mongoose';

const dailyActivitySchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  date: { 
    type: Date, 
    required: true,
    default: Date.now
  },
  module: { type: String, required: true },
  topicCovered: { type: String, required: true },
  trainer: { type: String, default: '' },
  timingDuration: { type: String, default: '' },
  remarks: { type: String, default: '' }
}, { timestamps: true });

// Optimize search by student & date
dailyActivitySchema.index({ studentId: 1, date: -1 });
dailyActivitySchema.index({ date: -1 });

export default mongoose.model('DailyActivity', dailyActivitySchema);
