import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const students = await Student.find().lean();
  const matching = students.filter(s => {
    const sStr = JSON.stringify(s).toLowerCase();
    return sStr.includes('clan') || sStr.includes('orient');
  });

  console.log(`Found ${matching.length} matching students:`);
  matching.forEach((s, idx) => {
    console.log(`\n[${idx + 1}] Name: "${s.name}" (ID: ${s._id})`);
    // Find where the match is
    Object.entries(s).forEach(([k, v]) => {
      const vStr = JSON.stringify(v).toLowerCase();
      if (k.toLowerCase().includes('clan') || k.toLowerCase().includes('orient') || vStr.includes('clan') || vStr.includes('orient')) {
        console.log(`  - ${k}: ${JSON.stringify(v).slice(0, 150)}`);
      }
    });
  });

  await mongoose.disconnect();
}

run().catch(console.error);
