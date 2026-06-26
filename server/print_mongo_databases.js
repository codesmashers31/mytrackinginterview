import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const adminDb = mongoose.connection.db.admin();
  const dbs = await adminDb.listDatabases();
  console.log('All Databases:', dbs.databases.map(d => d.name));

  const db = mongoose.connection.db;
  console.log('Current Database Name:', db.databaseName);

  const collections = await db.listCollections().toArray();
  console.log('Collections in current DB:', collections.map(c => c.name));

  await mongoose.disconnect();
}

run().catch(console.error);
