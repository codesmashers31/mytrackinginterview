import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import SplRegistration from './models/SplRegistration.js';

dotenv.config();

const run = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');
        
        const distinctStudentYears = await Student.distinct('passedOutYear');
        const distinctStudentBatches = await Student.distinct('batch');
        const distinctSplYears = await SplRegistration.distinct('passedOutYear');
        const distinctSplBatches = await SplRegistration.distinct('batch');

        console.log('--- Student passedOutYear values ---');
        console.log(distinctStudentYears);
        console.log('\n--- Student batch values ---');
        console.log(distinctStudentBatches);
        console.log('\n--- SplRegistration passedOutYear values ---');
        console.log(distinctSplYears);
        console.log('\n--- SplRegistration batch values ---');
        console.log(distinctSplBatches);

        // Find students with batch containing 'Batch 9' or similar
        const queryBatch9 = await Student.find({
            $or: [
                { passedOutYear: /batch/i },
                { batch: /batch/i }
            ]
        }).limit(10).lean();
        console.log('\n--- Example students with Batch in passedOutYear or batch ---');
        queryBatch9.forEach(s => {
            console.log(`Name: ${s.name} | passedOutYear: "${s.passedOutYear}" | batch: "${s.batch}" | studentType: "${s.studentType}"`);
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
