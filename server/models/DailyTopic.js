import mongoose from 'mongoose';

const dailyTopicSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dayNumber: { type: Number, required: true },
  weekNumber: { type: Number, required: true },
  topicName: { type: String, required: true },
  estimatedDuration: { type: String, default: '5 Hours' },
  
  readingTopic: {
    title: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: String, default: '30 minutes' }
  },
  commPractice: {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, default: 'Speaking' }, // Reading, Speaking, GD, Email
    duration: { type: String, default: '20 minutes' }
  },
  techTopic: {
    title: { type: String, required: true },
    explanation: { type: String, required: true },
    syntax: { type: String },
    examples: [{ code: String, output: String, explanation: String }],
    revisionNotes: { type: String },
    commonMistakes: [{ mistake: String, fix: String }],
    duration: { type: String, default: '60 minutes' }
  },
  codingTask: {
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
    duration: { type: String, default: '60 minutes' }
  },
  logicalTask: {
    title: { type: String, required: true },
    description: { type: String, required: true },
    inputOutput: { type: String },
    duration: { type: String, default: '30 minutes' }
  },
  assignment: {
    title: { type: String, required: true },
    description: { type: String, required: true },
    objectives: [String],
    expectedOutput: { type: String },
    duration: { type: String, default: '90 minutes' }
  },
  interviewQuestions: [{
    question: { type: String, required: true },
    category: { type: String },
    hint: { type: String }
  }]
}, { timestamps: true });

export default mongoose.model('DailyTopic', dailyTopicSchema);
