import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SplRegistration from './models/SplRegistration.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const spls = await SplRegistration.find().lean();
  console.log(`Found ${spls.length} SPL registrations:`);
  spls.forEach(s => {
    console.log(`- ${s.name} (${s.email}) [ID: ${s._id}]`);
  });

  await mongoose.disconnect();
}

run().catch(console.error);
