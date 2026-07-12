import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  score: { type: Number, default: null },
  strengths: { type: String, default: '' },
  improvements: { type: String, default: '' },
  remarks: { type: String, default: '' },
  status: { type: String, default: 'Pending' }
}, { _id: false });

const mockInterviewSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, default: '' },
  studentEmail: { type: String, default: '' },
  date: { type: String, default: '' },
  startTime: { type: String, default: '' },
  endTime: { type: String, default: '' },
  duration: { type: Number, default: 15 },
  status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'], default: 'Scheduled' },
  feedback: { type: feedbackSchema, default: () => ({}) },
  type: { type: String, enum: ['HR', 'Technical', 'Project', 'Managerial', 'Company-Specific'] },
  scheduledAt: { type: Date },
  questions: [{
    question: { type: String },
    score: { type: Number, default: 0 }
  }],
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  overallScore: { type: Number, default: 0 },
  overallFeedback: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('MockInterview', mockInterviewSchema);
