import mongoose from 'mongoose';

const readinessScoreSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  learningScore: { type: Number, default: 0 },
  codingScore: { type: Number, default: 0 },
  assignmentScore: { type: Number, default: 0 },
  attendanceScore: { type: Number, default: 0 },
  communicationScore: { type: Number, default: 0 },
  mockScore: { type: Number, default: 0 },
  overallScore: { type: Number, default: 0 }, // 0 to 100
  status: { 
    type: String, 
    enum: ['Needs Improvement', 'Learning Stage', 'Interview Preparation Stage', 'Interview Ready', 'Placement Ready'], 
    default: 'Learning Stage' 
  }
}, { timestamps: true });

export default mongoose.model('ReadinessScore', readinessScoreSchema);
