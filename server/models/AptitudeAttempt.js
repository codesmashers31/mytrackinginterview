import mongoose from 'mongoose';

const questionAttemptSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{
    id: { type: String, required: true },
    text: { type: String, required: true }
  }],
  correctAnswer: { type: String, required: true },
  studentAnswer: { type: String, default: null },
  isCorrect: { type: Boolean, default: false },
  explanation: { type: String, default: '' },
  topic: { type: String, default: '' },
  difficulty: { type: String, default: 'Medium' },
  timeSpentSeconds: { type: Number, default: 0 }
});

const aptitudeAttemptSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  studentName: { type: String, default: '' },
  studentEmail: { type: String, default: '' },
  batch: { type: String, default: '' },
  track: { type: String, default: '' },
  topic: {
    type: String,
    required: true,
    index: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard', 'Mixed'],
    default: 'Medium'
  },
  questionCount: { type: Number, required: true },
  questions: [questionAttemptSchema],
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  timeTakenSeconds: { type: Number, default: 0 },
  answeredCount: { type: Number, default: 0 },
  unansweredCount: { type: Number, default: 0 },
  isTimed: { type: Boolean, default: false },
  aiAnalysis: {
    overallSummary: { type: String, default: '' },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    commonMistakes: [{ type: String }],
    recommendations: [{ type: String }]
  }
}, { timestamps: true });

aptitudeAttemptSchema.index({ studentId: 1, createdAt: -1 });
aptitudeAttemptSchema.index({ topic: 1, createdAt: -1 });

export default mongoose.model('AptitudeAttempt', aptitudeAttemptSchema);
