import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';

dotenv.config();

const checkStudents = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        const students = await Student.find().sort({ createdAt: -1 });
        
        console.log(`📊 Total Students: ${students.length}\n`);
        console.log('='.repeat(120));
        console.log('All Student Records:');
        console.log('='.repeat(120));
        
        students.forEach((student, index) => {
            console.log(`\n${index + 1}. ${student.name}`);
            console.log(`   Mobile: ${student.mobile}`);
            console.log(`   Degree: ${student.degree}`);
            console.log(`   Batch: ${student.batch || student.passedOutYear || 'Not added'}`);
            console.log(`   Status: ${student.currentStatus}`);
            console.log(`   Company: ${student.companyName || 'N/A'}`);
            console.log(`   Package: ${student.packageLpa || 'N/A'}`);
            console.log(`   Created: ${student.createdAt.toLocaleDateString()}`);
        });

        // Summary by Status
        console.log('\n' + '='.repeat(120));
        console.log('📈 Summary by Status:');
        console.log('='.repeat(120));
        
        const statusCount = {};
        students.forEach(student => {
            const status = student.currentStatus || 'No Status';
            statusCount[status] = (statusCount[status] || 0) + 1;
        });

        Object.entries(statusCount).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
            console.log(`  ${status}: ${count}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

checkStudents();
