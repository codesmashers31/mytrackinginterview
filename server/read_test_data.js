import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        const distinctYears = await Student.distinct('passedOutYear');
        console.log('Distinct passedOutYears in Student collection:');
        console.log(distinctYears);

        const distinctBatches = await Student.distinct('batch');
        console.log('\nDistinct batches in Student collection:');
        console.log(distinctBatches);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

run();
