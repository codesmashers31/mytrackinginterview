import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Attendance from './models/Attendance.js';

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set in .env');
  process.exit(1);
}

const cleanupDuplicates = async () => {
  await mongoose.connect(uri);

  try {
    const duplicateGroups = await Attendance.aggregate([
      {
        $group: {
          _id: {
            studentId: '$studentId',
            date: { $dateTrunc: { date: '$date', unit: 'day' } }
          },
          count: { $sum: 1 },
          records: { $push: { id: '$_id', updatedAt: '$updatedAt', createdAt: '$createdAt' } }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (duplicateGroups.length === 0) {
      console.log('No duplicate attendance records found.');
      return;
    }

    let totalRemoved = 0;
    for (const group of duplicateGroups) {
      const records = group.records.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      const [keep, ...remove] = records;
      const removeIds = remove.map(r => r.id);

      const result = await Attendance.deleteMany({ _id: { $in: removeIds } });
      totalRemoved += result.deletedCount || 0;
      console.log(`Deduped student ${group._id.studentId} for date ${group._id.date.toISOString().slice(0, 10)}: kept ${keep.id}, removed ${removeIds.length}`);
    }

    console.log(`Duplicate cleanup finished. Total records removed: ${totalRemoved}`);
  } catch (err) {
    console.error('Failed to cleanup duplicate attendance records:', err);
  } finally {
    await mongoose.disconnect();
  }
};

cleanupDuplicates();
