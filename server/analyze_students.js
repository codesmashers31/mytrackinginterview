import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';

dotenv.config();

const updateInactiveRecords = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Find students with incomplete data (marked as "Need to filled")
        const inactiveStudents = await Student.find({ 
            currentStatus: { $regex: /^need to filled$/i } 
        });

        console.log(`📊 Found ${inactiveStudents.length} students with "Need to filled" status\n`);
        
        if (inactiveStudents.length > 0) {
            console.log('Inactive Students (Need to filled):');
            console.log('='.repeat(80));
            
            inactiveStudents.forEach((student, idx) => {
                console.log(`${idx + 1}. ${student.name} - ${student.mobile}`);
                console.log(`   Degree: ${student.degree}`);
                console.log(`   Batch: ${student.batch || student.passedOutYear || 'Missing'}`);
                console.log(`   Status: ${student.currentStatus}`);
                console.log('---');
            });
        }

        // Find all students with statuses
        const allStudents = await Student.find().select('name mobile degree currentStatus createdAt');
        
        console.log('\n📈 ALL STUDENT STATUSES:');
        console.log('='.repeat(80));
        
        const statusGroups = {};
        allStudents.forEach(student => {
            const status = student.currentStatus || 'Unknown';
            if (!statusGroups[status]) statusGroups[status] = [];
            statusGroups[status].push(student);
        });

        Object.entries(statusGroups).sort().forEach(([status, students]) => {
            console.log(`\n${status}: ${students.length} students`);
            students.slice(0, 3).forEach(s => console.log(`  - ${s.name} (${s.mobile})`));
            if (students.length > 3) console.log(`  ... and ${students.length - 3} more`);
        });

        console.log('\n✓ Analysis complete\n');
        console.log('To update inactive students, provide the details:');
        console.log('- What should "inactive" mean? (e.g., No batch info, No company info)');
        console.log('- What status should they be marked as?');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

updateInactiveRecords();
