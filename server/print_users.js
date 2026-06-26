import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const users = await User.find().lean();
  console.log(`Found ${users.length} users:`);
  users.forEach(u => {
    console.log(`- Name: "${u.name}", Email: "${u.email}", Role: "${u.role}", StudentId: ${u.studentId}`);
  });

  await mongoose.disconnect();
}

run().catch(console.error);
