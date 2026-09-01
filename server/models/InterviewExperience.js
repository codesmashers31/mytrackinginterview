import mongoose from 'mongoose';

const roundDetailSchema = new mongoose.Schema({
  attended: { type: Boolean, default: false },
  platformOrMode: { type: String, default: '' }, // e.g. HackerRank, Google Meet, In-Person
  topicsCovered: { type: String, default: '' },   // e.g. React, DSA, Node.js, Logical Reasoning
  questionsAsked: { type: String, default: '' },   // Actual questions / coding challenges asked
  difficulty: { 
    type: String, 
    enum: ['Easy', 'Medium', 'Hard', 'N/A'], 
    default: 'Medium' 
  },
  result: { 
    type: String, 
    enum: ['Cleared', 'Not Cleared', 'Pending', 'N/A'], 
    default: 'Pending' 
  },
  notes: { type: String, default: '' }
}, { _id: false });

const interviewExperienceSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  batch: { type: String, default: '' },
  companyName: { type: String, required: true, trim: true },
  role: { type: String, default: '', trim: true },
  interviewDate: { type: Date, required: true, default: Date.now },
  interviewMode: { 
    type: String, 
    enum: ['Online', 'In-Person', 'Telephonic'], 
    default: 'Online' 
  },
  overallStatus: { 
    type: String, 
    enum: ['Scheduled', 'Attended / In Progress', 'Cleared / Next Round', 'Rejected', 'Selected / Offer'],
    default: 'Attended / In Progress' 
  },
  
  // Specific Rounds Breakdown
  aptitudeRound: { 
    type: roundDetailSchema, 
    default: () => ({ attended: false, platformOrMode: '', topicsCovered: '', questionsAsked: '', difficulty: 'Medium', result: 'N/A', notes: '' })
  },
  communicationRound: { 
    type: roundDetailSchema, 
    default: () => ({ attended: false, platformOrMode: '', topicsCovered: '', questionsAsked: '', difficulty: 'Medium', result: 'N/A', notes: '' })
  },
  technicalRound: { 
    type: roundDetailSchema, 
    default: () => ({ attended: false, platformOrMode: '', topicsCovered: '', questionsAsked: '', difficulty: 'Medium', result: 'N/A', notes: '' })
  },
  hrRound: { 
    type: roundDetailSchema, 
    default: () => ({ attended: false, platformOrMode: '', topicsCovered: '', questionsAsked: '', difficulty: 'Medium', result: 'N/A', notes: '' })
  },

  overallExperience: { type: String, default: '' },
  tipsAndLearnings: { type: String, default: '' }
}, { timestamps: true });

// Optimize search
interviewExperienceSchema.index({ studentId: 1, interviewDate: -1 });
interviewExperienceSchema.index({ interviewDate: -1 });
interviewExperienceSchema.index({ companyName: 1 });
interviewExperienceSchema.index({ overallStatus: 1 });

export default mongoose.model('InterviewExperience', interviewExperienceSchema);
