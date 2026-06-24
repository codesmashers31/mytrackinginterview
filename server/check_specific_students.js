import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const names = ['Suresh R', 'Saritha N', 'Nithyasri k', 'Kalpitaa M G', 'Aswitha', 'Swathi N'];
  for (const name of names) {
    const student = await Student.findOne({ name: new RegExp(name, 'i') });
    if (student) {
      console.log(`Student: ${student.name}`);
      console.log(`  Email: "${student.email}"`);
      console.log(`  Mobile: "${student.mobile}"`);
      console.log(`  Enrollments:`, student.enrollments);
      console.log(`  StudentType: "${student.studentType}"`);
    } else {
      console.log(`Student not found: ${name}`);
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
