import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  batch: { type: String, default: '' },
  companyName: { type: String, required: true, trim: true },
  jobRole: { type: String, default: '', trim: true },
  applyDate: { type: Date, required: true, default: Date.now },
  applicationType: { 
    type: String, 
    enum: ['Job Portal', 'Email Outreach', 'LinkedIn', 'Referral', 'Career Site', 'Campus Drive', 'Other'],
    default: 'Email Outreach' 
  },
  hrDetails: {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    linkedin: { type: String, default: '' }
  },
  jobLink: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['Applied', 'Mail Sent', 'Under Review', 'In Process', 'Pending Feedback', 'On Hold', 'Shortlisted', 'Interview Scheduled', 'Rejected', 'Placed', 'Offer Received'],
    default: 'Applied' 
  },
  notes: { type: String, default: '' },
  followUpDate: { type: Date, default: null }
}, { timestamps: true });

// Optimize search by student, date, and status
jobApplicationSchema.index({ studentId: 1, applyDate: -1 });
jobApplicationSchema.index({ applyDate: -1 });
jobApplicationSchema.index({ status: 1 });
jobApplicationSchema.index({ companyName: 1 });

export default mongoose.model('JobApplication', jobApplicationSchema);
