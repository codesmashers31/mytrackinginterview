import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import SplRegistration from './models/SplRegistration.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const names = ['Asitha A', 'RAGUL T', 'BalaMugunthan'];
  for (const name of names) {
    console.log(`\nChecking name: "${name}"`);
    const student = await Student.findOne({ name: new RegExp(name, 'i') }).lean();
    if (student) {
      console.log(`  Found in Student:`);
      console.log(`    Email: "${student.email}"`);
      console.log(`    Mobile: "${student.mobile}"`);
      console.log(`    StudentType: "${student.studentType}"`);
      console.log(`    Enrollments:`, student.enrollments);
    } else {
      console.log(`  Not found in Student`);
    }

    const spl = await SplRegistration.findOne({ name: new RegExp(name, 'i') }).lean();
    if (spl) {
      console.log(`  Found in SplRegistration:`);
      console.log(`    Email: "${spl.email}"`);
      console.log(`    Mobile: "${spl.mobile}"`);
      console.log(`    Status: "${spl.status}"`);
    } else {
      console.log(`  Not found in SplRegistration`);
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
