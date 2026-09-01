import mongoose from 'mongoose';

const mistakeCorrectionSchema = new mongoose.Schema({
  originalText: { type: String, required: true },
  improvedVersion: { type: String, required: true },
  category: {
    type: String,
    enum: ['Grammar', 'Tense', 'Vocabulary', 'Sentence Structure', 'Professional Tone', 'Clarity', 'Filler Words'],
    default: 'Grammar'
  },
  explanation: { type: String, required: true }
});

const communicationSessionSchema = new mongoose.Schema({
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
  topic: { type: String, required: true, index: true },
  category: { type: String, default: 'General' },
  durationSeconds: { type: Number, default: 0 },
  audioBase64OrUrl: { type: String, default: '' },
  transcript: { type: String, required: true },
  overallScore: { type: Number, required: true },
  scores: {
    grammar: { type: Number, default: 70 },
    fluency: { type: Number, default: 70 },
    vocabulary: { type: Number, default: 70 },
    clarity: { type: Number, default: 70 },
    professionalTone: { type: Number, default: 70 },
    technicalCommunication: { type: Number, default: 70 }
  },
  fillerWordCount: { type: Number, default: 0 },
  fillerWordsUsed: [{ type: String }],
  mistakes: [mistakeCorrectionSchema],
  positiveFeedback: [{ type: String }],
  areasOfImprovement: [{ type: String }],
  idealAnswerOrExample: { type: String, default: '' },
  coachingDrillRecommendation: { type: String, default: '' }
}, { timestamps: true });

communicationSessionSchema.index({ studentId: 1, createdAt: -1 });

export default mongoose.model('CommunicationSession', communicationSessionSchema);
