import mongoose from 'mongoose';

const mockInterviewSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['HR', 'Technical', 'Project', 'Managerial', 'Company-Specific'] },
  scheduledAt: { type: Date },
  status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'], default: 'Scheduled' },
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
