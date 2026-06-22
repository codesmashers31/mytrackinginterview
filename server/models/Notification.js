import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['info', 'success', 'warning', 'error', 'task', 'attendance', 'mock'], 
    default: 'info' 
  },
  isRead: { type: Boolean, default: false, index: true }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
