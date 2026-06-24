import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const user = await User.findOne({ email: '7358841336' });
  if (user) {
    console.log('Found user:', user.name, 'with email', user.email);
    user.email = 'ragul131121@gmail.com';
    try {
      await user.save();
      console.log('Successfully saved!');
    } catch (err) {
      console.error('Error saving user:', err);
    }
  } else {
    console.log('User not found');
  }

  await mongoose.disconnect();
}

run().catch(console.error);
