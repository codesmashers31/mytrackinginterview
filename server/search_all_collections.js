import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  console.log(`Found ${collections.length} collections.`);

  for (const colInfo of collections) {
    const colName = colInfo.name;
    const collection = db.collection(colName);
    const documents = await collection.find().toArray();

    // Check if any document contains the search terms
    const matchingDocs = documents.filter(doc => {
      const docStr = JSON.stringify(doc).toLowerCase();
      return docStr.includes('clan') || docStr.includes('orient');
    });

    if (matchingDocs.length > 0) {
      console.log(`\nCollection "${colName}" has ${matchingDocs.length} matching documents:`);
      matchingDocs.forEach((doc, idx) => {
        console.log(`[Doc ${idx + 1}] ID: ${doc._id || 'N/A'}`);
        console.log(JSON.stringify(doc, null, 2));
      });
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
