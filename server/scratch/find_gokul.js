import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from '../models/Student.js';
import SplRegistration from '../models/SplRegistration.js';
import User from '../models/User.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const studentMatches = await Student.find({ name: /Gokul/i }).lean();
  console.log("Student Collection Matches:", JSON.stringify(studentMatches, null, 2));

  const splMatches = await SplRegistration.find({ name: /Gokul/i }).lean();
  console.log("SplRegistration Matches:", JSON.stringify(splMatches, null, 2));

  const userMatches = await User.find({ name: /Gokul/i }).lean();
  console.log("User Matches:", JSON.stringify(userMatches, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
