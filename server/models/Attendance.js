import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'SplRegistration',
    required: true 
  },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  date: { 
    type: Date, 
    required: true,
    index: true
  },
  status: { 
    type: String, 
    enum: ['Present', 'Absent', 'Late', 'Leave'],
    required: true 
  },
  remarks: { type: String, default: '' },
  markedBy: { type: String, default: 'Admin' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Compound index for faster queries by student and date range
attendanceSchema.index({ studentId: 1, date: -1 });
attendanceSchema.index({ date: -1, studentId: 1 });

export default mongoose.model('Attendance', attendanceSchema);
