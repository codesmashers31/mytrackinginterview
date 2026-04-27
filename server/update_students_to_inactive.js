import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';

dotenv.config();

const updateToInactive = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Get all students that are not "Placed" or "Got Job"
        const studentsToUpdate = await Student.find({
            currentStatus: {
                $nin: [
                    /^placed$/i,
                    /^got job$/i,
                    /^inactive - not responded$/i
                ]
            }
        }).limit(3);

        console.log(`📋 Found ${studentsToUpdate.length} students to mark as inactive\n`);

        if (studentsToUpdate.length === 0) {
            console.log('No students available to update.');
            process.exit(0);
        }

        console.log('Updating these students to "Inactive - Not Responded":');
        console.log('='.repeat(80));

        let updated = 0;
        for (const student of studentsToUpdate) {
            const result = await Student.updateOne(
                { _id: student._id },
                { currentStatus: 'Inactive - Not Responded' }
            );
            
            if (result.modifiedCount > 0) {
                console.log(`✓ ${student.name} (${student.mobile})`);
                updated++;
            }
        }

        console.log('='.repeat(80));
        console.log(`\n✅ Successfully updated ${updated} students to "Inactive - Not Responded"\n`);
        console.log('Now refresh your dashboard to see the count!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

updateToInactive();
