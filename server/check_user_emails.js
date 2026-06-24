import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const studentUsers = await User.find({ role: 'student' }).lean();
  
  let numberEmails = 0;
  let textEmails = 0;
  
  studentUsers.forEach(u => {
    if (/^\d+$/.test(u.email)) {
      numberEmails++;
    } else {
      textEmails++;
    }
  });

  console.log('--- Student Users (Accounts) ---');
  console.log('Total student accounts:', studentUsers.length);
  console.log('Accounts with mobile as email:', numberEmails);
  console.log('Accounts with actual email:', textEmails);

  if (numberEmails > 0) {
    console.log('\nSample accounts with mobile as email:');
    studentUsers.filter(u => /^\d+$/.test(u.email)).slice(0, 10).forEach(u => {
      console.log(`- ID: ${u._id}, Name: ${s(u.name)}, Email (Mobile): ${u.email}`);
    });
  }

  await mongoose.disconnect();
}

function s(str) {
  return str || 'No name';
}

run().catch(console.error);
