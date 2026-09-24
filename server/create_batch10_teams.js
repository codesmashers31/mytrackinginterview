import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Student from './models/Student.js';
import Team from './models/Team.js';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const teamData = [
  {
    teamName: 'Batch 10 - Team 1',
    members: [
      'N.Dinesh',
      'Gokul P',
      'Bharath Raj M',
      'divya',
      'Pradhiksha.R'
    ]
  },
  {
    teamName: 'Batch 10 - Team 2',
    members: [
      'Vasanthkumar E',
      'Harish Chezhiyan N',
      'ASWIN KARTHIKEYAN B',
      'RESHMIKA',
      'Prajan Gowtham S'
    ]
  },
  {
    teamName: 'Batch 10 - Team 3',
    members: [
      'Jaya Ganesh R',
      'Karpaga Vinayagam R V K',
      'V.Subashini',
      'Lallisree',
      'DHARANKUMAR'
    ]
  },
  {
    teamName: 'Batch 10 - Team 4',
    members: [
      'Bala Prakash S',
      'Faitha begam N',
      'Logeswari J',
      'Lokesh J',
      'Harshavardhan'
    ]
  },
  {
    teamName: 'Batch 10 - Team 5',
    members: [
      'Amirtham.K',
      'Boomika R',
      'Pavithra C',
      'Deffina Emmimal S',
      'S.Esakkiammal Jothi santhiya'
    ]
  }
];

const cleanStr = (str) => {
  if (!str) return '';
  return String(str).toLowerCase().replace(/[^a-z0-9]/g, '').trim();
};

function matchStudentByName(name, allStudents) {
  const targetClean = cleanStr(name);
  if (!targetClean) return null;

  // Filter valid students only
  const validStudents = allStudents.filter(s => s && s.name && typeof s.name === 'string' && s.name.trim().length > 0);

  // 1. Exact clean match
  let matched = validStudents.find(s => cleanStr(s.name) === targetClean);
  if (matched) return matched;

  // 2. Token match: all major letters/words in target exist in student name
  const targetTokens = name.toLowerCase().split(/[\s.]+/).filter(t => t.length >= 2);
  if (targetTokens.length > 0) {
    matched = validStudents.find(s => {
      const sLower = s.name.toLowerCase();
      return targetTokens.every(t => sLower.includes(t));
    });
    if (matched) return matched;
  }

  // 3. Substring match
  matched = validStudents.find(s => {
    const sClean = cleanStr(s.name);
    return sClean.length > 3 && (sClean.includes(targetClean) || targetClean.includes(sClean));
  });
  if (matched) return matched;

  return null;
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const allStudents = await Student.find().lean();
    console.log(`Loaded ${allStudents.length} students from database.\n`);

    console.log('--- Matching and Creating Batch 10 Teams ---');

    for (let i = 0; i < teamData.length; i++) {
      const team = teamData[i];
      console.log(`\nProcessing ${team.teamName}:`);
      const matchedMemberIds = [];

      for (const memberName of team.members) {
        let student = matchStudentByName(memberName, allStudents);
        if (student) {
          console.log(`  ✓ Matched "${memberName}" -> [${student._id}] "${student.name}" (Mobile: ${student.mobile}, Batch: "${student.batch}")`);
          
          // Ensure student has Batch 10 in batch field
          if (!student.batch || !student.batch.toLowerCase().includes('batch 10')) {
            const updatedBatch = student.batch ? `${student.batch}, Batch 10` : 'Batch 10';
            await Student.updateOne({ _id: student._id }, { $set: { batch: updatedBatch } });
          }
          matchedMemberIds.push(student._id);
        } else {
          console.log(`  ✗ NOT FOUND: "${memberName}"`);
        }
      }

      // Update or create team
      let existingTeam = await Team.findOne({ name: team.teamName });

      if (existingTeam) {
        existingTeam.members = matchedMemberIds;
        existingTeam.batch = 'Batch 10';
        existingTeam.track = 'Regular';
        existingTeam.status = 'Active';
        await existingTeam.save();
        console.log(`  => Updated existing team: "${existingTeam.name}" with ${matchedMemberIds.length} members`);
      } else {
        const newTeam = new Team({
          name: team.teamName,
          members: matchedMemberIds,
          batch: 'Batch 10',
          track: 'Regular',
          status: 'Active'
        });
        await newTeam.save();
        console.log(`  => Created new team: "${newTeam.name}" with ${matchedMemberIds.length} members`);
      }
    }

    console.log('\n--- Administrative Users ---');
    const admins = await User.find({ role: { $in: ['admin', 'coordinator', 'placement'] } }).lean();
    admins.forEach(u => {
      console.log(`Role: ${u.role} | Name: ${u.name} | Email: ${u.email}`);
    });

    console.log('\nAll Batch 10 teams processed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error creating teams:', err);
    process.exit(1);
  }
}

run();
