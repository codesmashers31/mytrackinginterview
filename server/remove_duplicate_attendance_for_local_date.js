import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Attendance from './models/Attendance.js';

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set');
  process.exit(1);
}

const targetDateArg = process.argv[2];
if (!targetDateArg) {
  console.error('Usage: node remove_duplicate_attendance_for_local_date.js YYYY-MM-DD');
  process.exit(1);
}

const targetDate = new Date(targetDateArg);
if (Number.isNaN(targetDate.getTime())) {
  console.error('Invalid date:', targetDateArg);
  process.exit(1);
}

const formatLocalDate = (date) => {
  return date.toLocaleDateString('en-CA');
};

const run = async () => {
  await mongoose.connect(uri);

  const allRecords = await Attendance.find().sort({ studentId: 1, createdAt: 1 });
  const groups = new Map();

  for (const record of allRecords) {
    const localDate = formatLocalDate(record.date);
    if (localDate !== targetDateArg) continue;

    const key = `${record.studentId}-${localDate}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(record);
  }

  const duplicates = [];
  for (const [key, records] of groups) {
    if (records.length > 1) {
      duplicates.push(records);
    }
  }

  if (duplicates.length === 0) {
    console.log(`No duplicate attendance records found for ${targetDateArg}.`);
    await mongoose.disconnect();
    return;
  }

  let removedCount = 0;
  for (const records of duplicates) {
    // Keep the oldest record by createdAt and remove the rest
    const sorted = records.slice().sort((a, b) => a.createdAt - b.createdAt);
    const [keep, ...remove] = sorted;
    const removeIds = remove.map(r => r._id);
    const result = await Attendance.deleteMany({ _id: { $in: removeIds } });
    removedCount += result.deletedCount || 0;
    console.log(`Keeping ${keep._id} and removing duplicates ${removeIds.join(', ')} for student ${keep.studentId}`);
  }

  console.log(`Removed ${removedCount} duplicate attendance records for ${targetDateArg}.`);

  await mongoose.disconnect();
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});