import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import User from './models/User.js';

dotenv.config();

function normalizeName(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected to MongoDB');

  const unlinkedUsers = await User.find({ 
    role: 'student', 
    $or: [{ studentId: null }, { studentId: { $exists: false } }] 
  });

  console.log(`Processing ${unlinkedUsers.length} unlinked user accounts...`);

  const allStudents = await Student.find().lean();

  for (const user of unlinkedUsers) {
    const userNorm = normalizeName(user.name);
    if (!userNorm) continue;

    // Find matches by normalized name
    const matches = allStudents.filter(s => {
      const studentNorm = normalizeName(s.name);
      return studentNorm === userNorm || studentNorm.includes(userNorm) || userNorm.includes(studentNorm);
    });

    if (matches.length === 1) {
      const matchedStudent = matches[0];
      console.log(`  [Match] User: "${user.name}" (${user.email}) matches Student: "${matchedStudent.name}" (${matchedStudent.mobile})`);
      
      // Update Student record with the actual email address
      await Student.updateOne({ _id: matchedStudent._id }, { $set: { email: user.email.trim().toLowerCase() } });
      
      // Link the User account to the Student
      await User.updateOne({ _id: user._id }, { $set: { studentId: matchedStudent._id } });
      console.log(`          Linked and updated email.`);
    } else if (matches.length > 1) {
      // If multiple matches, check for exact normalized match
      const exactMatches = matches.filter(s => normalizeName(s.name) === userNorm);
      if (exactMatches.length === 1) {
        const matchedStudent = exactMatches[0];
        console.log(`  [Exact Match] User: "${user.name}" (${user.email}) matches Student: "${matchedStudent.name}" (${matchedStudent.mobile})`);
        
        await Student.updateOne({ _id: matchedStudent._id }, { $set: { email: user.email.trim().toLowerCase() } });
        await User.updateOne({ _id: user._id }, { $set: { studentId: matchedStudent._id } });
        console.log(`          Linked and updated email.`);
      } else {
        console.log(`  [Ambiguous] User: "${user.name}" (${user.email}) matches multiple students:`, matches.map(s => s.name));
      }
    } else {
      console.log(`  [No Match] User: "${user.name}" (${user.email}) has no student profile matches.`);
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
