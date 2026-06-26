import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from './models/Task.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const tasks = await Task.find().lean();
  console.log(`Found ${tasks.length} individual tasks:`);
  tasks.slice(0, 10).forEach(t => {
    console.log(`- Title: "${t.title}", OverallStatus: "${t.overallStatus}"`);
  });

  await mongoose.disconnect();
}

run().catch(console.error);
