import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import SplRegistration from './models/SplRegistration.js';
import { runStudentMigration } from './utils/migration.js';

dotenv.config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        console.log('--- Running Student Migration ---');
        await runStudentMigration();

        const totalStudents = await Student.countDocuments();
        const regularCount = await Student.countDocuments({ enrollments: 'Regular' });
        const splInStudentCount = await Student.countDocuments({ enrollments: 'SPL' });
        const bothCount = await Student.countDocuments({ enrollments: { $all: ['Regular', 'SPL'] } });

        const splRegistrationCount = await SplRegistration.countDocuments();

        console.log('\n📊 COLLECTION STATS:');
        console.log(`- Total Students: ${totalStudents}`);
        console.log(`- Regular Students: ${regularCount}`);
        console.log(`- SPL Students in Student collection (merged): ${splInStudentCount}`);
        console.log(`- Both Regular + SPL: ${bothCount}`);
        console.log(`- Standalone SPL registrations: ${splRegistrationCount}`);

        // Verify if any SplRegistration record has a corresponding regular student in Batch 1-9
        const spls = await SplRegistration.find().lean();
        let duplicatesCount = 0;
        for (const s of spls) {
            const hasReg = await Student.findOne({
                $or: [
                    { email: s.email },
                    { mobile: s.mobile }
                ]
            });
            if (hasReg && /Batch\s*[1-9]\b/i.test((hasReg.batch || '').trim())) {
                console.log(`⚠️ Duplicate found: SPL registration "${s.name}" also has Student record "${hasReg.name}" (Batch: ${hasReg.batch})`);
                duplicatesCount++;
            }
        }

        if (duplicatesCount === 0) {
            console.log('\n✓ Clean database! No duplicate records between Student and SplRegistration collections for regular Batch 1-9 students.');
        } else {
            console.log(`\n❌ Found ${duplicatesCount} duplicates!`);
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

check();
