import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import User from './models/User.js';

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const students = await Student.find().lean();
    const users = await User.find().lean();

    console.log("=== Checking Duplicate Mobiles in Students ===");
    const mobileGroups = {};
    students.forEach(s => {
      if (s.mobile) {
        mobileGroups[s.mobile] = mobileGroups[s.mobile] || [];
        mobileGroups[s.mobile].push(s);
      }
    });
    Object.entries(mobileGroups).forEach(([mob, list]) => {
      if (list.length > 1) {
        console.log(`Mobile ${mob} is shared by:`);
        list.forEach(s => console.log(`  - Student ID: ${s._id}, Name: ${s.name}, Type: ${s.studentType}, Email: ${s.email}`));
      }
    });

    console.log("\n=== Checking Duplicate Emails in Students ===");
    const emailGroups = {};
    students.forEach(s => {
      const email = String(s.email || '').trim().toLowerCase();
      if (email) {
        emailGroups[email] = emailGroups[email] || [];
        emailGroups[email].push(s);
      }
    });
    Object.entries(emailGroups).forEach(([email, list]) => {
      if (list.length > 1) {
        console.log(`Email ${email} is shared by:`);
        list.forEach(s => console.log(`  - Student ID: ${s._id}, Name: ${s.name}, Type: ${s.studentType}, Mobile: ${s.mobile}`));
      }
    });

    console.log("\n=== Checking Duplicate Emails/Usernames in Users ===");
    const userEmailGroups = {};
    users.forEach(u => {
      const email = String(u.email || '').trim().toLowerCase();
      if (email) {
        userEmailGroups[email] = userEmailGroups[email] || [];
        userEmailGroups[email].push(u);
      }
    });
    Object.entries(userEmailGroups).forEach(([email, list]) => {
      if (list.length > 1) {
        console.log(`User email username ${email} is shared by:`);
        list.forEach(u => console.log(`  - User ID: ${u._id}, Name: ${u.name}, Role: ${u.role}, StudentID: ${u.studentId}`));
      }
    });

    console.log("\n=== Mapping Users to Student Types ===");
    for (const u of users) {
      if (u.studentId) {
        const student = await Student.findById(u.studentId);
        if (student) {
          console.log(`User ${u.name} (Role: ${u.role}, Username: ${u.email}) -> Student Name: ${student.name}, Type: ${student.studentType}, Mobile: ${student.mobile}, StudentEmail: ${student.email}`);
        } else {
          console.log(`User ${u.name} (Role: ${u.role}, Username: ${u.email}) -> Student record NOT FOUND for ID: ${u.studentId}`);
        }
      }
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

run();
