import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';

dotenv.config();

/**
 * Script to update student statuses to "Inactive - Not Responded"
 * Usage: node update_inactive.js <student_ids_or_names>
 * 
 * Examples:
 * - Update by name: node update_inactive.js "Sundara Selvam.S"
 * - Update multiple: node update_inactive.js "Saradha S" "Karthick.T"
 */

const updateToInactive = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        const args = process.argv.slice(2);
        
        if (args.length === 0) {
            console.log('📝 Usage: node update_inactive.js "<student_name>" "<another_name>" ...\n');
            console.log('Example: node update_inactive.js "Sundara Selvam.S" "Saradha S"\n');
            
            // Show available students
            const students = await Student.find().select('name mobile degree currentStatus');
            console.log('Available Students:');
            console.log('='.repeat(80));
            students.forEach((s, idx) => {
                console.log(`${idx + 1}. ${s.name} (${s.mobile}) - Status: ${s.currentStatus}`);
            });
            process.exit(0);
        }

        // Update specified students
        let updated = 0;
        for (const nameOrId of args) {
            const result = await Student.updateOne(
                { 
                    $or: [
                        { name: { $regex: nameOrId, $options: 'i' } },
                        { _id: nameOrId }
                    ]
                },
                { currentStatus: 'Inactive - Not Responded' }
            );
            
            if (result.modifiedCount > 0) {
                console.log(`✓ Updated: ${nameOrId}`);
                updated++;
            } else {
                console.log(`✗ Not found: ${nameOrId}`);
            }
        }

        console.log(`\n✅ Updated ${updated} student(s) to "Inactive - Not Responded" status`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

updateToInactive();
