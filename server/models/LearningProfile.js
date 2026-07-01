import mongoose from 'mongoose';

const learningProfileSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true },
  degree: { type: String, required: true },
  department: { type: String, default: '' },
  passedOutYear: { type: String, required: true },
  experience: { type: String, default: 'Fresher' },
  currentStatus: { type: String, default: 'Job Seeker' },
  language: { type: String, default: 'English' },
  techTrack: { 
    type: String, 
    enum: ['MERN Stack', 'Java Full Stack', 'Python Full Stack', 'Testing', 'Data Analytics', 'UI/UX'], 
    required: true 
  },
  
  // Knowledge & Experience Assessment Fields
  cgpa: { type: String, default: '' },
  codingProjectsExperience: { 
    type: String, 
    enum: ['None', '1-2 Small Projects', '3+ Structured Projects'], 
    default: 'None' 
  },
  familiarDatabases: [{ type: String }],
  problemSolvingExperience: { 
    type: String, 
    enum: ['Never practiced', 'Solved basic puzzles', 'LeetCode/HackerRank regular'], 
    default: 'Never practiced' 
  },
  certifications: { type: String, default: '' },

  skillLevel: { type: Object, default: {} }, // HTML, CSS, JavaScript, React, Node.js, MongoDB, SQL, Git ratings (1-5)
  commLevel: {
    speaking: { type: Number, min: 1, max: 5, default: 3 },
    listening: { type: Number, min: 1, max: 5, default: 3 },
    reading: { type: Number, min: 1, max: 5, default: 3 },
    writing: { type: Number, min: 1, max: 5, default: 3 }
  },
  aptitudeLevel: {
    logical: { type: Number, min: 1, max: 5, default: 3 },
    quantitative: { type: Number, min: 1, max: 5, default: 3 },
    verbal: { type: Number, min: 1, max: 5, default: 3 }
  },
  dailyAvailability: { type: String, required: true },
  targetRole: { type: String, required: true },
  targetPackage: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('LearningProfile', learningProfileSchema);
