import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';
import Student from './models/Student.js';

dotenv.config();

const students = [
  { name: 'Sundara Selvam.S', mobile: '7708278760', degree: 'B.E(CSE)', passedOutYear: 2021, currentStatus: 'Job Seeker' },
  { name: 'Saradha S', mobile: '7845203108', degree: 'MCA', passedOutYear: 2023, currentStatus: 'Job Seeker' },
  { name: 'Karthick.T', mobile: '7695814876', degree: 'DME', passedOutYear: 2022, currentStatus: 'Job Seeker' },
  { name: 'MANIKANDAN.T', mobile: '9344308872', degree: 'B.E(Mechanical)', passedOutYear: null, currentStatus: 'Job Seeker' },
  { name: 'Sanjai I', mobile: '6374501507', degree: 'B.Tech', passedOutYear: null, currentStatus: 'Job Seeker' },
  { name: 'Dhanasekaran.R', mobile: '6385404182', degree: 'MCA', passedOutYear: null, currentStatus: 'Job Seeker' },
  { name: 'sanjay kumar G', mobile: '8015541941', degree: 'B.E(Mechanical)', passedOutYear: null, currentStatus: 'Got Job', companyName: 'Cognitive mobiles', packageLpa: 2, jobGetMode: 'SLA' },
  { name: 'Rohith Graham Staines K', mobile: '8056340710', degree: 'B.Tech ECE', passedOutYear: null, currentStatus: 'Job Seeker' },
  { name: 'Ranjith.k', mobile: '7305874272', degree: 'Bcom', passedOutYear: null, currentStatus: 'Job Seeker' },
  { name: 'Dhamodharan A', mobile: '6381917528', degree: 'Bcom(CA)', passedOutYear: null, currentStatus: 'Job Seeker' },
  { name: 'Sivakumar S M', mobile: '9080089287', degree: 'B.A(History)', passedOutYear: 2020, currentStatus: 'Interview Process' },
  { name: 'Surya Prakash M', mobile: '9003219299', degree: 'Msc.IT', passedOutYear: 2024, currentStatus: 'Job Seeker' },
  { name: 'J LOHITH', mobile: '8248204933', degree: 'MCA', passedOutYear: 2025, currentStatus: 'Got Job', companyName: 'Cognitive mobiles', packageLpa: 2.5, jobGetMode: 'SLA' }
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Seed Terminal: Linked to MongoDB');

        // Seed Admin if missing
        const adminExists = await Admin.findOne({ email: 'admin@placetrack.com' });
        if (!adminExists) {
            const admin = new Admin({
                email: 'admin@placetrack.com',
                password: 'adminpassword123',
                name: 'PlaceTrack Root'
            });
            await admin.save();
            console.log('Seed: Root Admin Created (Email: admin@placetrack.com, PW: adminpassword123)');
        }

        // Seed Students
        await Student.deleteMany({}); // Clear existing records for a fresh "PlaceTrack" start
        await Student.insertMany(students);
        console.log(`Seed: ${students.length} nodes injected into ledger`);

        process.exit(0);
    } catch (error) {
        console.error('Seed Error:', error);
        process.exit(1);
    }
};

seed();
