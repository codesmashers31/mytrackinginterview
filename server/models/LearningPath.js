import mongoose from 'mongoose';

const learningPathSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
  stages: [{
    title: { type: String, required: true },
    description: { type: String },
    weeks: [{
      weekNumber: { type: Number, required: true },
      title: { type: String, required: true },
      topics: [{ type: String }] // Topics for each day (typically Day 1 to Day 5)
    }]
  }],
  currentWeek: { type: Number, default: 1 },
  currentDay: { type: Number, default: 1 }, // Dynamic Day index (e.g. 1, 2, 3, etc.)
  dailyStreak: { type: Number, default: 0 },
  weeklyStreak: { type: Number, default: 0 },
  lastActiveDate: { type: Date },
  overallProgress: { type: Number, default: 0 } // Percentage: 0 to 100
}, { timestamps: true });

export default mongoose.model('LearningPath', learningPathSchema);
