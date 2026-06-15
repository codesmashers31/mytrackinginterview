import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, default: '' },
    degree: { type: String, default: '' },
    isFrontend: { type: Boolean, default: false },
    city: { type: String, default: '' },
    passedOutYear: { type: String, default: 'Need to filled' },
    batch: { type: String, default: '' },
    grade: { type: String, enum: ['A', 'B', 'C', ''], default: '' },
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
    resumeData: { type: Object, default: {} }
}, { timestamps: true });

export default mongoose.model('Student', studentSchema);
