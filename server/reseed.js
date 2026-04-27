import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';

dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Clear all students
        await Student.deleteMany({});
        console.log('✓ Cleared all students\n');

        // Seed with mixed statuses including some inactive
        const students = [
            { name: 'Sundara Selvam.S', mobile: '7708278760', degree: 'B.E(CSE)', passedOutYear: 2021, currentStatus: 'Job Seeker' },
            { name: 'Saradha S', mobile: '7845203108', degree: 'MCA', passedOutYear: 2023, currentStatus: 'Job Seeker' },
            { name: 'Karthick.T', mobile: '7695814876', degree: 'DME', passedOutYear: 2022, currentStatus: 'Inactive - Not Responded' },
            { name: 'MANIKANDAN.T', mobile: '9344308872', degree: 'B.E(Mechanical)', passedOutYear: null, currentStatus: 'Inactive - Not Responded' },
            { name: 'Sanjai I', mobile: '6374501507', degree: 'B.Tech', passedOutYear: null, currentStatus: 'Job Seeker' },
            { name: 'Dhanasekaran.R', mobile: '6385404182', degree: 'MCA', passedOutYear: null, currentStatus: 'Inactive - Not Responded' },
            { name: 'sanjay kumar G', mobile: '8015541941', degree: 'B.E(Mechanical)', passedOutYear: null, currentStatus: 'Placed', companyName: 'Cognitive mobiles', packageLpa: 2, jobGetMode: 'SLA' },
            { name: 'Rohith Graham Staines K', mobile: '8056340710', degree: 'B.Tech ECE', passedOutYear: null, currentStatus: 'Job Seeker' },
            { name: 'Ranjith.k', mobile: '7305874272', degree: 'Bcom', passedOutYear: null, currentStatus: 'Job Seeker' },
            { name: 'Dhamodharan A', mobile: '6381917528', degree: 'Bcom(CA)', passedOutYear: null, currentStatus: 'Inactive - Not Responded' },
            { name: 'Sivakumar S M', mobile: '9080089287', degree: 'B.A(History)', passedOutYear: 2020, currentStatus: 'Interview Process' },
            { name: 'Surya Prakash M', mobile: '9003219299', degree: 'Msc.IT', passedOutYear: 2024, currentStatus: 'Job Seeker' },
            { name: 'J LOHITH', mobile: '8248204933', degree: 'MCA', passedOutYear: 2025, currentStatus: 'Placed', companyName: 'Cognitive mobiles', packageLpa: 2.5, jobGetMode: 'SLA' }
        ];

        await Student.insertMany(students);
        console.log(`✓ Seeded ${students.length} students\n`);

        // Show stats
        const total = await Student.countDocuments();
        const jobSeekers = await Student.countDocuments({ currentStatus: { $regex: /^job seeker$/i } });
        const placed = await Student.countDocuments({ currentStatus: { $regex: /^placed$/i } });
        const inactive = await Student.countDocuments({ currentStatus: { $regex: /^inactive - not responded$/i } });
        const interview = await Student.countDocuments({ currentStatus: { $regex: /^interview process$/i } });

        console.log('📊 Database Status:');
        console.log('='.repeat(50));
        console.log(`  Total Students: ${total}`);
        console.log(`  Job Seekers: ${jobSeekers}`);
        console.log(`  Placed: ${placed}`);
        console.log(`  Inactive - Not Responded: ${inactive}`);
        console.log(`  Interview Process: ${interview}`);
        console.log('='.repeat(50));
        console.log('\n✅ Seed completed! Refresh your dashboard now.\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

seed();
