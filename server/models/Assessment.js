import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weekNumber: { type: Number, required: true },
  score: { type: Number, default: 0 },
  status: { type: String, enum: ['Pending', 'Passed', 'Failed'], default: 'Pending' },
  questions: [{
    question: { type: String },
    category: { type: String },
    score: { type: Number }
  }],
  improvementFeedback: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Assessment', assessmentSchema);
