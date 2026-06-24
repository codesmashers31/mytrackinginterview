import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, default: '' },
    degree: { type: String, default: '' },
    studentType: { 
        type: String, 
        enum: ['Regular', 'Frontend', 'SPL'], 
        default: 'Regular' 
    },
    enrollments: {
        type: [String],
        enum: ['Regular', 'SPL'],
        default: ['Regular']
    },
    isFrontend: { type: Boolean, default: false },
    city: { type: String, default: '' },
    passedOutYear: { type: String, default: 'Need to filled' },
    batch: { type: String, default: '' },
    grade: { type: String, default: '' },
    currentStatus: { 
        type: String, 
        default: 'Need to filled'
    },
    statusReason: { type: String, default: '' },
    others: { type: String, default: '' },
    skills: { type: String, default: '' },
    companyName: { type: String, default: '' },
    packageLpa: { type: String, default: '' },
    jobGetMode: { type: String, default: '' },
    
    // SPL class specific fields
    stack: { type: String, default: '' },
    willingCompanyProcess: { type: Boolean, default: false },
    willing30Days: { type: String, default: '' },
    acceptOffer: { type: String, default: '' },
    fullEffort: { type: String, default: '' },
    issues: { type: String, default: '' },
    needMost: { type: String, default: '' },
    status: { type: String, default: 'New' },

    resumeData: { type: Object, default: {} }
}, { timestamps: true });

// Indexing for faster lookups
studentSchema.index({ email: 1 });
studentSchema.index({ mobile: 1 });
studentSchema.index({ studentType: 1 });
studentSchema.index({ isFrontend: 1, studentType: 1, currentStatus: 1 });
studentSchema.index({ currentStatus: 1 });

export default mongoose.model('Student', studentSchema);
