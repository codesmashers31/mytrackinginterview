import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import User from './models/User.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const usersWithNoStudentId = await User.find({ role: 'student', $or: [{ studentId: null }, { studentId: { $exists: false } }] }).lean();
  console.log(`Found ${usersWithNoStudentId.length} student accounts with no studentId:`);
  
  for (const user of usersWithNoStudentId) {
    console.log(`\nUser: ${user.name} (${user.email})`);
    // Try to find a student in the Student collection by name
    const student = await Student.findOne({ name: new RegExp('^' + user.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }).lean();
    if (student) {
      console.log(`  Matches Student record: ID: ${student._id}, Mobile: ${student.mobile}, Current Email: "${student.email}"`);
    } else {
      console.log(`  No exact student match found by name.`);
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
