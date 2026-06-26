import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Let's get all keys across all student documents
  const students = await Student.find().lean();
  console.log(`Total students: ${students.length}`);

  const allKeys = new Set();
  students.forEach(s => {
    Object.keys(s).forEach(k => allKeys.add(k));
  });

  console.log('All student document fields in DB:', Array.from(allKeys));

  // Let's see if any student has a field with "team" or "clan" or "oriented" or value that matches
  const matchingStudents = students.filter(s => {
    return Object.entries(s).some(([key, val]) => {
      const valStr = String(val).toLowerCase();
      return key.toLowerCase().includes('team') || 
             key.toLowerCase().includes('clan') || 
             key.toLowerCase().includes('orient') ||
             valStr.includes('team') ||
             valStr.includes('clan') ||
             valStr.includes('orient');
    });
  });

  console.log(`\nFound ${matchingStudents.length} students with team/clan/oriented in their fields/values:`);
  matchingStudents.slice(0, 10).forEach(s => {
    console.log(`- Student: ${s.name}`);
    Object.entries(s).forEach(([key, val]) => {
      const valStr = String(val).toLowerCase();
      if (key.toLowerCase().includes('team') || 
          key.toLowerCase().includes('clan') || 
          key.toLowerCase().includes('orient') ||
          valStr.includes('team') ||
          valStr.includes('clan') ||
          valStr.includes('orient')) {
        console.log(`  * ${key}: ${JSON.stringify(val)}`);
      }
    });
  });

  await mongoose.disconnect();
}

run().catch(console.error);
