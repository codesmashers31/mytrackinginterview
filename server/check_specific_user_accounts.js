import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import User from './models/User.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const names = [
    'Nagavalli N',
    'Jaji Anjethi Kmc',
    'Abdul sameer',
    'Gokulnath R',
    'sudharsan.J',
    'praveenkanth K',
    'Vasantha Kumar P',
    'Abishek R',
    'Senthilmurugan K'
  ];

  for (const name of names) {
    console.log(`\n--- ${name} ---`);
    const student = await Student.findOne({ name: new RegExp(name, 'i') }).lean();
    if (student) {
      console.log(`  Student Record: ID: ${student._id}, Email: "${student.email}", Mobile: "${student.mobile}"`);
      const user = await User.findOne({ studentId: student._id }).lean();
      if (user) {
        console.log(`  Linked User Account: ID: ${user._id}, Username (Email): "${user.email}"`);
      } else {
        console.log(`  No Linked User Account.`);
      }
    } else {
      console.log(`  Student Record not found.`);
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
