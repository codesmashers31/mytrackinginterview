import mongoose from 'mongoose';

const mockAvailabilitySchema = new mongoose.Schema({
  date: { type: String, required: true }, // format: YYYY-MM-DD
  startTime: { type: String, required: true }, // format: HH:MM (24-hour)
  endTime: { type: String, required: true }, // format: HH:MM (24-hour)
  addedBy: { type: String, default: 'Admin' }
}, { timestamps: true });

mockAvailabilitySchema.index({ date: 1 });

export default mongoose.model('MockAvailability', mockAvailabilitySchema);
