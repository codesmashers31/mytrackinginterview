import mongoose from 'mongoose';

const topicMasterySchema = new mongoose.Schema({
  topicName: { type: String, required: true },
  testsTaken: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  correctQuestions: { type: Number, default: 0 },
  accuracyRate: { type: Number, default: 0 },
  lastTestedAt: { type: Date, default: Date.now }
});

const studentAIProgressSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  aptitude: {
    totalTestsTaken: { type: Number, default: 0 },
    totalQuestionsAttempted: { type: Number, default: 0 },
    totalQuestionsCorrect: { type: Number, default: 0 },
    averageAccuracy: { type: Number, default: 0 },
    strongestTopics: [{ type: String }],
    weakestTopics: [{ type: String }],
    topicMastery: [topicMasterySchema],
    streakDays: { type: Number, default: 0 },
    lastActiveDate: { type: String, default: '' }
  },
  communication: {
    totalSessions: { type: Number, default: 0 },
    averageOverallScore: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 },
    averageGrammarScore: { type: Number, default: 0 },
    averageFluencyScore: { type: Number, default: 0 },
    averageVocabularyScore: { type: Number, default: 0 },
    averageProfessionalScore: { type: Number, default: 0 },
    commonMistakeCategories: [{ type: String }],
    recentScoreTrend: [{
      date: { type: Date, default: Date.now },
      score: { type: Number, default: 0 },
      topic: { type: String, default: '' }
    }]
  }
}, { timestamps: true });

export default mongoose.model('StudentAIProgress', studentAIProgressSchema);
