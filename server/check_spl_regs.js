import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SplRegistration from './models/SplRegistration.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const regs = await SplRegistration.find().lean();
        console.log(`SplRegistration count: ${regs.length}`);
        regs.forEach((r, idx) => {
            console.log(`[${idx + 1}] Name: "${r.name}" | Email: "${r.email}" | Mobile: "${r.mobile}" | Batch: "${r.batch}" | Status: "${r.status}"`);
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
