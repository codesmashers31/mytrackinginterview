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
const targetDate = targetDateArg ? new Date(targetDateArg) : null;
if (targetDateArg && Number.isNaN(targetDate.getTime())) {
  console.error('Invalid target date:', targetDateArg);
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(uri);

  if (targetDate) {
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const records = await Attendance.find({
      date: { $gte: targetDate, $lt: nextDate }
    }).sort({ studentId: 1, date: 1 });

    console.log(`Records for ${targetDateArg} (${records.length}):`);
    console.log(JSON.stringify(records.map(r => ({
      id: r._id,
      studentId: r.studentId,
      studentName: r.studentName,
      studentEmail: r.studentEmail,
      date: r.date,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    })), null, 2));

    const duplicateGroups = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: targetDate, $lt: nextDate }
        }
      },
      {
        $group: {
          _id: {
            studentId: '$studentId',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
          },
          count: { $sum: 1 },
          records: { $push: { id: '$_id', date: '$date', status: '$status', updatedAt: '$updatedAt' } }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    console.log('duplicateGroups:', duplicateGroups.length);
    if (duplicateGroups.length > 0) {
      console.log(JSON.stringify(duplicateGroups, null, 2));
    }

    await mongoose.disconnect();
    return;
  }

  const duplicates = await Attendance.aggregate([
    {
      $group: {
        _id: {
          studentId: '$studentId',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
        },
        count: { $sum: 1 },
        records: { $push: { id: '$_id', studentName: '$studentName', date: '$date', status: '$status', updatedAt: '$updatedAt' } }
      }
    },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } }
  ]);

  console.log('duplicateGroups:', duplicates.length);
  if (duplicates.length > 0) {
    console.log(JSON.stringify(duplicates.slice(0, 20), null, 2));
  }

  const total = await Attendance.countDocuments();
  console.log('total attendance docs:', total);

  await mongoose.disconnect();
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});