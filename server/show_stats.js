import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';

dotenv.config();

const checkStats = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        const total = await Student.countDocuments();
        const jobSeekers = await Student.countDocuments({ currentStatus: { $regex: /^job seeker$/i } });
        const placed = await Student.countDocuments({ currentStatus: { $regex: /^placed$/i } });
        const needToFilled = await Student.countDocuments({ currentStatus: { $regex: /^need to filled$/i } });
        const inactiveUsers = await Student.countDocuments({ currentStatus: { $regex: /^inactive - not responded$/i } });
        const interviewProcess = await Student.countDocuments({ currentStatus: { $regex: /^interview process$/i } });

        console.log('📊 CURRENT DATABASE STATS:');
        console.log('='.repeat(60));
        console.log(`  Total Students: ${total}`);
        console.log(`  Job Seekers: ${jobSeekers}`);
        console.log(`  Placed: ${placed}`);
        console.log(`  Need to filled: ${needToFilled}`);
        console.log(`  Inactive Users: ${inactiveUsers}`);
        console.log(`  Interview Process: ${interviewProcess}`);
        console.log('='.repeat(60));
        console.log('\n✅ This is what shows on your dashboard!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

checkStats();
