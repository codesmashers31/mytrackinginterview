import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import User from './models/User.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const names = ['Asitha A', 'RAGUL T', 'BalaMugunthan'];
  for (const name of names) {
    console.log(`\nChecking name: "${name}"`);
    const student = await Student.findOne({ name: new RegExp(name, 'i') }).lean();
    if (student) {
      console.log(`  Student ID: ${student._id}`);
      
      const usersByStudentId = await User.find({ studentId: student._id }).lean();
      console.log(`  Users matching studentId:`, usersByStudentId.map(u => ({ _id: u._id, email: u.email, name: u.name, studentId: u.studentId })));
      
      const usersByMobile = await User.find({ email: student.mobile }).lean();
      console.log(`  Users matching mobile as email:`, usersByMobile.map(u => ({ _id: u._id, email: u.email, name: u.name, studentId: u.studentId })));
      
      const usersByEmail = await User.find({ email: student.email }).lean();
      console.log(`  Users matching actual email:`, usersByEmail.map(u => ({ _id: u._id, email: u.email, name: u.name, studentId: u.studentId })));
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
