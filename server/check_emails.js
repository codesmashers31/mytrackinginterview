import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import SplRegistration from './models/SplRegistration.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const totalStudents = await Student.countDocuments();
  const studentsWithEmail = await Student.countDocuments({ email: { $ne: '', $exists: true } });
  const studentsWithoutEmail = await Student.countDocuments({ $or: [{ email: '' }, { email: { $exists: false } }] });
  
  const totalSpl = await SplRegistration.countDocuments();
  const splWithEmail = await SplRegistration.countDocuments({ email: { $ne: '', $exists: true } });
  const splWithoutEmail = await SplRegistration.countDocuments({ $or: [{ email: '' }, { email: { $exists: false } }] });

  console.log('--- Student Collection ---');
  console.log('Total students:', totalStudents);
  console.log('Students with email:', studentsWithEmail);
  console.log('Students without email:', studentsWithoutEmail);

  console.log('\n--- SplRegistration Collection ---');
  console.log('Total SPL:', totalSpl);
  console.log('SPL with email:', splWithEmail);
  console.log('SPL without email:', splWithoutEmail);

  if (studentsWithoutEmail > 0) {
    console.log('\nSample students without email:');
    const samples = await Student.find({ $or: [{ email: '' }, { email: { $exists: false } }] }).limit(5);
    samples.forEach(s => {
      console.log(`- ID: ${s._id}, Name: ${s.name}, Mobile: ${s.mobile}, Batch: ${s.batch}`);
    });
  }

  await mongoose.disconnect();
}

run().catch(console.error);
