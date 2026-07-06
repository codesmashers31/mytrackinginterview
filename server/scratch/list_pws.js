import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const users = await User.find({ role: 'student' }).limit(10).lean();
  for (const u of users) {
    console.log(`User: ${u.name}, Email: ${u.email}, Password Hash: ${u.password}`);
  }
  
  await mongoose.disconnect();
}

run().catch(console.error);
