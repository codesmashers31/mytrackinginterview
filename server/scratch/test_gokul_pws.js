import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const passwordsToTest = [
  '6379142995',
  '7305512262',
  'gokul',
  'gokulnath',
  'gokulparamesh6@gmail.com',
  'admin123',
  'PlaceX@123',
  'Student@123',
  'welcome',
  'password',
  '123456',
  '12345678',
  'Gokul@123',
  'Gokulnath@123'
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const gokulnath = await User.findOne({ email: '6379142995' });
  if (gokulnath) {
    console.log("\n--- Testing passwords for Gokulnath R (6379142995) ---");
    for (const pw of passwordsToTest) {
      const match = await gokulnath.comparePassword(pw);
      if (match) console.log(`  MATCH FOUND: "${pw}"`);
    }
  }

  const gokulp = await User.findOne({ email: 'gokulparamesh6@gmail.com' });
  if (gokulp) {
    console.log("\n--- Testing passwords for Gokul P (gokulparamesh6@gmail.com) ---");
    for (const pw of passwordsToTest) {
      const match = await gokulp.comparePassword(pw);
      if (match) console.log(`  MATCH FOUND: "${pw}"`);
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
