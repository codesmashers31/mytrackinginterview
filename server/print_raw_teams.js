import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const rawTeams = await db.collection('teams').find().toArray();

  console.log(`Raw teams count: ${rawTeams.length}`);
  rawTeams.forEach(t => {
    console.log(JSON.stringify(t, null, 2));
  });

  await mongoose.disconnect();
}

run().catch(console.error);
