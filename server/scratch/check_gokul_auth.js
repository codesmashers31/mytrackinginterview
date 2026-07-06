import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const user = await User.findOne({ email: '6379142995' });
  if (user) {
    console.log("Found Gokulnath User Record:", user.email);
    const matchesMobile = await user.comparePassword('6379142995');
    console.log("Does password '6379142995' match?", matchesMobile);
  } else {
    console.log("Gokulnath R user not found.");
  }
  
  await mongoose.disconnect();
}

run().catch(console.error);
