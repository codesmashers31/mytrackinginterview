import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Student from '../models/Student.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const email = '6379142995'; // Gokulnath's mobile/username
  const passwordInput = '6379142995'; // Gokulnath's password input (his mobile number)
  
  console.log(`Simulating login for username: "${email}" with password: "${passwordInput}"`);
  
  const inputVal = email.trim().toLowerCase();
  
  const student = await Student.findOne({
    $or: [
      { email: inputVal },
      { mobile: email.trim() }
    ]
  });
  
  let user = null;
  if (student) {
    console.log(`Found matching student record: "${student.name}"`);
    const studentQuery = [];
    if (student.mobile) studentQuery.push({ mobile: student.mobile.trim() });
    if (student.email) studentQuery.push({ email: student.email.trim().toLowerCase() });
    const allStudentsForPerson = await Student.find({ $or: studentQuery });
    const studentIds = allStudentsForPerson.map(s => s._id);

    user = await User.findOne({
      $or: [
        { studentId: { $in: studentIds } },
        { email: inputVal },
        ...(student.mobile ? [{ email: student.mobile.trim() }] : []),
        ...(student.email ? [{ email: student.email.trim().toLowerCase() }] : [])
      ]
    });
  } else {
    user = await User.findOne({ email: inputVal });
  }

  if (!user) {
    console.log("No user found.");
    await mongoose.disconnect();
    return;
  }
  
  console.log(`Found User account: "${user.name}" with registered email: "${user.email}"`);

  let passwordMatches = false;
  passwordMatches = await user.comparePassword(passwordInput);
  console.log(`Standard bcrypt check: ${passwordMatches}`);
  
  if (!passwordMatches) {
    console.log("Running email/mobile fallback checks...");
    const inputPw = passwordInput.trim().toLowerCase();
    if (student) {
      const studentEmail = student.email ? student.email.trim().toLowerCase() : '';
      const studentMobile = student.mobile ? student.mobile.trim() : '';
      console.log(`Comparing input "${inputPw}" with student email "${studentEmail}" and mobile "${studentMobile}"`);
      if (inputPw === studentEmail || passwordInput.trim() === studentMobile) {
        passwordMatches = true;
      }
    }
  }

  console.log(`Authentication result: ${passwordMatches ? 'SUCCESS' : 'FAILED'}`);
  
  await mongoose.disconnect();
}

run().catch(console.error);
