import mongoose from 'mongoose';

const splRegistrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  mobile: { type: String, default: '' },
  degree: { type: String, default: '' },
  batch: { type: String, default: '' },
  willingCompanyProcess: { type: Boolean, default: false },
  willing30Days: { type: String, default: '' },
  acceptOffer: { type: String, default: '' },
  fullEffort: { type: String, default: '' },
  issues: { type: String, default: '' },
  needMost: { type: String, default: '' },
  status: { type: String, default: 'New' },
  statusReason: { type: String, default: '' },
  grade: { type: String, default: '' },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  resumeData: { type: Object, default: {} }
}, { timestamps: true });

export default mongoose.model('SplRegistration', splRegistrationSchema);
