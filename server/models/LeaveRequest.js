import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  studentEmail: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Leave', 'Permission'],
    required: true
  },
  // For Leave type
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  // For Permission type
  date: {
    type: Date
  },
  startTime: {
    type: String
  },
  endTime: {
    type: String
  },
  modeTransition: {
    type: String,
    enum: ['None', 'Offline to Online', 'Online to Offline'],
    default: 'None'
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewerName: {
    type: String
  },
  reviewerRemarks: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Indexing for faster queries
leaveRequestSchema.index({ studentId: 1, createdAt: -1 });
leaveRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('LeaveRequest', leaveRequestSchema);
