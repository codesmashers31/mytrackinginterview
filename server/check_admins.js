import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const admins = await User.find({ role: { $in: ['admin', 'coordinator', 'placement'] } }).lean();
  console.log(`Found ${admins.length} administrative users:`);
  admins.forEach(u => {
    console.log(`- ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
  });

  await mongoose.disconnect();
}

run().catch(console.error);
