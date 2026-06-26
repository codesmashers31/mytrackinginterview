import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';

dotenv.config();

const runMigration = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        // Query definition for Regular students
        const regularQuery = {
            $or: [
                { studentType: 'Regular' },
                { enrollments: 'Regular' }
            ],
            studentType: { $ne: 'SPL' },
            isFrontend: { $ne: true }
        };

        // 1. Inspect before update
        const totalRegular = await Student.countDocuments(regularQuery);
        console.log(`\nFound ${totalRegular} regular students in database.`);

        const alreadyMern = await Student.countDocuments({
            ...regularQuery,
            stack: 'MERN Stack'
        });
        console.log(`- Already have stack set to "MERN Stack": ${alreadyMern}`);

        const otherStack = await Student.find({
            ...regularQuery,
            stack: { $ne: '', $exists: true, $ne: 'MERN Stack' }
        }).lean();
        console.log(`- Have other stacks: ${otherStack.length}`);
        if (otherStack.length > 0) {
            console.log('Other stacks found:');
            otherStack.forEach(s => {
                console.log(`  * ${s.name}: "${s.stack}"`);
            });
        }

        const emptyStack = await Student.countDocuments({
            ...regularQuery,
            $or: [
                { stack: '' },
                { stack: { $exists: false } }
            ]
        });
        console.log(`- Have empty or missing stack field: ${emptyStack}`);

        // 2. Perform the update
        console.log('\nUpdating stack to "MERN Stack" for all regular students...');
        // We use $set to only add/update the stack field without affecting or deleting any other field.
        const updateResult = await Student.updateMany(
            regularQuery,
            { $set: { stack: 'MERN Stack' } }
        );

        console.log(`✓ Migration complete!`);
        console.log(`- Matched documents: ${updateResult.matchedCount}`);
        console.log(`- Modified documents: ${updateResult.modifiedCount}`);

        // Double check status after update
        const postMern = await Student.countDocuments({
            ...regularQuery,
            stack: 'MERN Stack'
        });
        console.log(`\nVerification: Regular students with "MERN Stack" now: ${postMern} of ${totalRegular}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error during update:', error.message);
        process.exit(1);
    }
};

runMigration();
