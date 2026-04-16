import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    degree: { type: String, required: true },
    passedOutYear: { type: String, default: 'Need to filled' },
    batch: { type: String, default: '' },
    currentStatus: { 
        type: String, 
        default: 'Need to filled'
    },
    companyName: { type: String, default: '' },
    packageLpa: { type: String, default: '' },
    jobGetMode: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Student', studentSchema);
