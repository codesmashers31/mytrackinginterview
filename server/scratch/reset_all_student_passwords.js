import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Student from '../models/Student.js';
import SplRegistration from '../models/SplRegistration.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected to MongoDB');

  const studentUsers = await User.find({ role: 'student' });
  console.log(`Found ${studentUsers.length} student user accounts to verify.`);

  let updatedCount = 0;
  let skipCount = 0;

  for (const user of studentUsers) {
    let mobileNumber = '';
    
    // 1. Check linked student ID
    if (user.studentId) {
      const student = await Student.findById(user.studentId);
      if (student && student.mobile) {
        mobileNumber = student.mobile.trim();
      } else {
        const spl = await SplRegistration.findById(user.studentId);
        if (spl && spl.mobile) {
          mobileNumber = spl.mobile.trim();
        }
      }
    }

    // 2. Fallback: Query by email or name if no studentId was matched
    if (!mobileNumber) {
      const student = await Student.findOne({
        $or: [
          { email: user.email },
          { name: user.name }
        ]
      });
      if (student && student.mobile) {
        mobileNumber = student.mobile.trim();
      } else {
        const spl = await SplRegistration.findOne({
          $or: [
            { email: user.email },
            { name: user.name }
          ]
        });
        if (spl && spl.mobile) {
          mobileNumber = spl.mobile.trim();
        }
      }
    }

    if (mobileNumber) {
      // Reset the password field to the mobile number
      // Setting user.password and calling save() will trigger the bcrypt pre-save hook to hash it
      user.password = mobileNumber;
      await user.save();
      console.log(`  [Updated] Reset password for Student: "${user.name}" (Mobile/Password: ${mobileNumber})`);
      updatedCount++;
    } else {
      console.log(`  [Skipped] No mobile number found for Student: "${user.name}" (Email: ${user.email})`);
      skipCount++;
    }
  }

  console.log(`\nPassword Reset complete: Updated ${updatedCount} users, Skipped ${skipCount} users.`);
  await mongoose.disconnect();
}

run().catch(console.error);
