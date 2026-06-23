import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const merged = await Student.find({ enrollments: 'SPL' }).lean();
        console.log(`Merged students count: ${merged.length}`);
        
        merged.forEach((s, idx) => {
            console.log(`[${idx + 1}] Name: "${s.name}" | Mobile: "${s.mobile}" | Email: "${s.email}" | Batch: "${s.batch}" | Type: "${s.studentType}" | Enrollments: ${JSON.stringify(s.enrollments)}`);
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
