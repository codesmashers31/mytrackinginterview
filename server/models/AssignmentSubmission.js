import mongoose from 'mongoose';

const assignmentSubmissionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyTopic', required: true },
  assignmentTitle: { type: String, required: true },
  submissionLink: { type: String, required: true },
  assignedTime: { type: Date, required: true },
  dueTime: { type: Date, required: true },
  submittedTime: { type: Date, default: Date.now },
  isLate: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Submitted', 'Reviewed', 'Rejected', 'Completed'], 
    default: 'Submitted' 
  },
  completionPercentage: { type: Number, default: 0 },
  grade: { type: String, enum: ['A', 'B', 'C', ''], default: '' },
  mentorFeedback: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
