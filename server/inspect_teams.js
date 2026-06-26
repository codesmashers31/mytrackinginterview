import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import Team from './models/Team.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Get all teams
  const teams = await Team.find().populate('members');
  console.log(`\nFound ${teams.length} Teams in database:`);
  for (const t of teams) {
    console.log(`Team: "${t.name}" | Track: "${t.track}" | Batch: "${t.batch}" | Members Count: ${t.members.length}`);
    for (const m of t.members) {
      console.log(`  - Member: ${m.name} (isFrontend: ${m.isFrontend}, track: ${m.studentType || m.enrollments})`);
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
