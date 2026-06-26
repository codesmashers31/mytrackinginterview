import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import Team from './models/Team.js';
import SplRegistration from './models/SplRegistration.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const students = await Student.find().lean();
  const spls = await SplRegistration.find().lean();

  const allStudents = [
    ...students,
    ...spls.map(s => ({
      ...s,
      studentType: 'SPL',
      enrollments: ['SPL']
    }))
  ];

  const teams = await Team.find().lean();

  // Find assigned member IDs
  const assignedIds = new Set();
  teams.forEach(t => {
    t.members.forEach(mId => assignedIds.add(String(mId)));
  });

  console.log(`Total students in DB: ${allStudents.length}`);
  console.log(`Total assigned to teams: ${assignedIds.size}`);

  const unassigned = allStudents.filter(s => !assignedIds.has(String(s._id)));
  console.log(`Total unassigned: ${unassigned.length}`);

  // Let's inspect unassigned students by type
  const unassignedByType = {};
  unassigned.forEach(s => {
    const type = s.isFrontend ? 'Frontend' : (s.studentType || 'Regular');
    unassignedByType[type] = (unassignedByType[type] || 0) + 1;
  });
  console.log('Unassigned by type:', unassignedByType);

  // Print some unassigned students
  console.log('\nSample unassigned students:');
  unassigned.slice(0, 10).forEach(s => {
    console.log(`- ${s.name} (${s.email || s.mobile}) [Type: ${s.studentType || 'Regular'}, Batch: ${s.batch || 'N/A'}]`);
  });

  await mongoose.disconnect();
}

run().catch(console.error);
