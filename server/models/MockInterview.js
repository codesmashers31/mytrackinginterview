import mongoose from 'mongoose';

const mockInterviewSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  date: { type: String, required: true }, // format: YYYY-MM-DD
  startTime: { type: String, required: true }, // format: HH:MM (24-hour)
  endTime: { type: String, required: true }, // format: HH:MM (24-hour)
  duration: { type: Number, required: true }, // 30 or 60 minutes
  status: { 
    type: String, 
    enum: ['Scheduled', 'Completed', 'Cancelled'], 
    default: 'Scheduled' 
  },
  feedback: {
    score: { type: Number, default: null }, // 1-10
    strengths: { type: String, default: '' },
    improvements: { type: String, default: '' },
    remarks: { type: String, default: '' },
    status: { type: String, enum: ['Passed', 'Failed', 'Needs Retake', 'Pending', ''], default: 'Pending' }
  }
}, { timestamps: true });

mockInterviewSchema.index({ date: 1 });
mockInterviewSchema.index({ studentId: 1 });

export default mongoose.model('MockInterview', mockInterviewSchema);
