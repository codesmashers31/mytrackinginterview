import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TeamTask from './models/TeamTask.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const tasks = await TeamTask.find().lean();
  console.log(`Found ${tasks.length} team tasks:`);
  tasks.forEach(t => {
    console.log(JSON.stringify(t, null, 2));
  });

  await mongoose.disconnect();
}

run().catch(console.error);
