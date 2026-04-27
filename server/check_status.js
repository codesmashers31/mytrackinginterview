import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';

dotenv.config();

const checkAndDisplay = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        const allStudents = await Student.find().sort({ createdAt: -1 });
        console.log(`📊 Total Students: ${allStudents.length}\n`);
        
        // Group by status
        const statusGroups = {};
        allStudents.forEach(student => {
            const status = student.currentStatus || 'Unknown';
            if (!statusGroups[status]) {
                statusGroups[status] = [];
            }
            statusGroups[status].push(student);
        });

        console.log('='.repeat(100));
        console.log('CURRENT STATUS BREAKDOWN:');
        console.log('='.repeat(100));
        
        Object.entries(statusGroups).sort().forEach(([status, students]) => {
            console.log(`\n✓ ${status}: ${students.length} students`);
            students.slice(0, 2).forEach(s => {
                console.log(`   - ${s.name} (${s.mobile})`);
            });
            if (students.length > 2) {
                console.log(`   ... and ${students.length - 2} more`);
            }
        });

        // Check for "Inactive - Not Responded"
        const inactiveCount = statusGroups['Inactive - Not Responded'] ? statusGroups['Inactive - Not Responded'].length : 0;
        console.log(`\n🔴 "Inactive - Not Responded": ${inactiveCount} students`);

        if (inactiveCount === 0) {
            console.log('\n⚠️  No students with "Inactive - Not Responded" status yet!');
            console.log('\n💡 To fix this, run:');
            console.log('   node update_students_to_inactive.js\n');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

checkAndDisplay();
