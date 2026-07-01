import mongoose from 'mongoose';

const aiSettingsSchema = new mongoose.Schema({
  aiGenerationEnabled: { type: Boolean, default: true },
  requireApproval: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('AISettings', aiSettingsSchema);
