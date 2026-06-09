import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Blocked', 'Review', 'Not Completed', 'Doubt'],
    default: 'Pending'
  },
  remarks: { type: String, default: '' }
}, { _id: false });

const taskSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  questions: { type: [questionSchema], default: [] },
  overallStatus: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Blocked', 'Review', 'Not Completed', 'Doubt'],
    default: 'Pending'
  },
  assignedBy: { type: String, default: '' },
  dueDate: { type: Date, default: null },
  assignedAt: { type: Date, default: Date.now }
}, { timestamps: true });

taskSchema.index({ studentId: 1, assignedAt: -1 });

export default mongoose.model('Task', taskSchema);
