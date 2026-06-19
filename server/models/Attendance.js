import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student',
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
    enum: ['Present', 'Absent', 'Late', 'Leave', 'In Progress'],
    required: true 
  },
  checkInTime: { type: Date },
  checkOutTime: { type: Date },
  checkInLocation: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String }
  },
  checkOutLocation: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String }
  },
  totalHours: { type: Number, default: 0 },
  remarks: { type: String, default: '' },
  markedBy: { type: String, default: 'Admin' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Compound unique index to prevent duplicate attendance for the same student on the same date
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ studentId: 1, date: -1 });
attendanceSchema.index({ date: -1, studentId: 1 });

export default mongoose.model('Attendance', attendanceSchema);
