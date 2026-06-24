import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import User from './models/User.js';

dotenv.config();

const getPrimaryStudent = async (student) => {
  if (student.studentType === 'SPL') {
    const emailVal = student.email ? student.email.trim().toLowerCase() : '';
    const mobileVal = student.mobile ? student.mobile.trim() : '';
    const query = [];
    if (emailVal) query.push({ email: emailVal });
    if (mobileVal) query.push({ mobile: mobileVal });
    if (query.length === 0) return student;

    const primary = await Student.findOne({
      $or: query,
      studentType: { $ne: 'SPL' }
    });
    if (primary) {
      return primary;
    }
  }
  return student;
};

const ensureStudentAccount = async (emailOrMobile) => {
  if (!emailOrMobile) return;
  const normalized = emailOrMobile.trim().toLowerCase();

  const student = await Student.findOne({
    $or: [
      ...(normalized ? [{ email: normalized }] : []),
      { mobile: emailOrMobile.trim() }
    ]
  });

  if (student) {
    const primaryStudent = await getPrimaryStudent(student);
    if (!primaryStudent) {
      console.log(`  [Sync] No primary student found for ${student.name}`);
      return;
    }

    const email = primaryStudent.email ? primaryStudent.email.trim().toLowerCase() : '';
    const mobile = primaryStudent.mobile ? primaryStudent.mobile.trim() : '';
    const expectedUserEmail = email ? email : mobile;

    if (expectedUserEmail) {
      const studentQuery = [];
      if (primaryStudent.mobile) studentQuery.push({ mobile: primaryStudent.mobile.trim() });
      if (primaryStudent.email) studentQuery.push({ email: primaryStudent.email.trim().toLowerCase() });
      const allStudentsForPerson = await Student.find({ $or: studentQuery });
      const studentIds = allStudentsForPerson.map(s => s._id);

      let user = await User.findOne({
        $or: [
          { studentId: { $in: studentIds } },
          { email: expectedUserEmail }
        ]
      });

      if (user) {
        let modified = false;
        if (!user.studentId || user.studentId.toString() !== primaryStudent._id.toString()) {
          user.studentId = primaryStudent._id;
          modified = true;
        }
        if (user.email !== expectedUserEmail) {
          console.log(`  [Sync] Updating user email for ${primaryStudent.name}: ${user.email} -> ${expectedUserEmail}`);
          user.email = expectedUserEmail;
          modified = true;
        }
        if (modified) {
          try {
            await user.save();
            console.log(`  [Sync] Saved user ${primaryStudent.name}`);
          } catch (saveErr) {
            console.error(`  [Sync] Error saving user ${primaryStudent.name}:`, saveErr.message);
          }
        }
      } else {
        const password = mobile || email;
        try {
          user = new User({
            name: primaryStudent.name || 'Student',
            email: expectedUserEmail,
            password,
            role: 'student',
            studentId: primaryStudent._id
          });
          await user.save();
          console.log(`  [Sync] Created new user ${primaryStudent.name} with email ${expectedUserEmail}`);
        } catch (saveErr) {
          if (saveErr.code !== 11000) {
            console.error(`  [Sync] Error creating user ${primaryStudent.name}:`, saveErr.message);
          }
        }
      }
    }
  }
};

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('Starting verbose student accounts sync...');
  const students = await Student.find();
  console.log(`Found ${students.length} students in collection.`);
  
  for (const student of students) {
    const val = student.mobile || student.email;
    if (val) {
      await ensureStudentAccount(val);
    }
  }
  
  console.log('Sync complete.');
  await mongoose.disconnect();
}

run().catch(console.error);
