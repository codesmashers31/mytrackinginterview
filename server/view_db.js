import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';

dotenv.config();

const updateStudentStatuses = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Show all current students
        const allStudents = await Student.find().sort({ createdAt: -1 });
        
        console.log(`📊 Total Students in DB: ${allStudents.length}\n`);
        console.log('='.repeat(100));
        console.log('Current Database Records:');
        console.log('='.repeat(100));
        
        allStudents.forEach((student, idx) => {
            console.log(`\n[${idx + 1}] ${student.name}`);
            console.log(`    Mobile: ${student.mobile}`);
            console.log(`    Degree: ${student.degree}`);
            console.log(`    Batch: ${student.batch || student.passedOutYear || 'NOT PROVIDED'}`);
            console.log(`    Current Status: ${student.currentStatus}`);
            console.log(`    Company: ${student.companyName || 'N/A'}`);
            console.log(`    Last Updated: ${student.updatedAt.toLocaleDateString()}`);
        });

        // Count by current status
        console.log('\n' + '='.repeat(100));
        console.log('📈 Status Summary:');
        console.log('='.repeat(100));
        
        const statusCounts = {};
        allStudents.forEach(s => {
            const status = s.currentStatus || 'Not Set';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`  ✓ ${status}: ${count}`);
        });

        console.log('\n' + '='.repeat(100));
        console.log('💡 Available Status Options:');
        console.log('='.repeat(100));
        console.log('  1. Job Seeker');
        console.log('  2. Placed');
        console.log('  3. Need to filled');
        console.log('  4. Interview Process');
        console.log('  5. Inactive - Not Responded');
        console.log('  6. Got Job');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

updateStudentStatuses();
