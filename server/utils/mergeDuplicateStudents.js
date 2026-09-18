// server/utils/mergeDuplicateStudents.js
import mongoose from 'mongoose';
import Student from '../models/Student.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Task from '../models/Task.js';
import DailyActivity from '../models/DailyActivity.js';
import JobApplication from '../models/JobApplication.js';
import InterviewExperience from '../models/InterviewExperience.js';
import Timetable from '../models/Timetable.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Team from '../models/Team.js';
import { normalizePhone } from './phoneUtils.js';

/**
 * Combines multiple batch names into a clean, comma-separated batch string without duplicates.
 * e.g. ['Batch 10', 'Frontend Batch 1'] -> 'Batch 10, Frontend Batch 1'
 */
export const combineBatches = (...batchStrings) => {
  const set = new Set();
  batchStrings.forEach(str => {
    if (!str) return;
    String(str)
      .split(',')
      .map(s => s.trim())
      .filter(s => s && s.toLowerCase() !== 'need to filled' && s.toLowerCase() !== 'not specified')
      .forEach(s => set.add(s));
  });
  return Array.from(set).join(', ');
};

/**
 * Runs the student deduplication and multi-batch consolidation migration.
 */
export const runDuplicateMergeMigration = async () => {
  console.log('[Migration] Checking for duplicate students across phone number variants...');
  try {
    const students = await Student.find().lean();
    const phoneGroups = {};

    students.forEach(s => {
      const norm = normalizePhone(s.mobile);
      if (norm) {
        phoneGroups[norm] = phoneGroups[norm] || [];
        phoneGroups[norm].push(s);
      }
    });

    const duplicates = Object.entries(phoneGroups).filter(([_, list]) => list.length > 1);

    if (duplicates.length === 0) {
      console.log('[Migration] No duplicate student records found. All profiles are clean.');
      return { mergedCount: 0 };
    }

    console.log(`[Migration] Found ${duplicates.length} duplicate student phone groups to consolidate.`);

    let totalMerged = 0;

    for (const [normPhone, list] of duplicates) {
      // 1. Choose master record:
      // Prefer record with existing attendance/tasks, rich degree, or non-default values
      let master = list[0];
      for (const s of list) {
        const hasGoodDegree = s.degree && s.degree !== 'Not Provided' && s.degree !== 'Frontend';
        const hasGoodYear = s.passedOutYear && !s.passedOutYear.toLowerCase().includes('need to filled');
        const isFrontend = s.isFrontend || s.studentType === 'Frontend';
        
        // If master has placeholder and current candidate has real details, choose current candidate
        if ((!master.degree || master.degree === 'Not Provided' || master.degree === 'Frontend') && hasGoodDegree) {
          master = s;
        } else if ((!master.passedOutYear || master.passedOutYear.toLowerCase().includes('need to filled')) && hasGoodYear) {
          master = s;
        } else if (isFrontend && !master.isFrontend) {
          master = s;
        }
      }

      const duplicateRecords = list.filter(s => s._id.toString() !== master._id.toString());
      const duplicateIds = duplicateRecords.map(s => s._id);

      // 2. Merge field attributes
      const allBatches = combineBatches(...list.map(s => s.batch));
      const hasFrontend = list.some(s => s.isFrontend || s.studentType === 'Frontend' || (s.batch && /frontend/i.test(s.batch)));
      const hasRegular = list.some(s => s.studentType === 'Regular' || (s.enrollments && s.enrollments.includes('Regular')) || (s.batch && /batch/i.test(s.batch) && !/frontend/i.test(s.batch)));
      
      const bestDegree = list.find(s => s.degree && s.degree !== 'Not Provided' && s.degree !== 'Frontend')?.degree || master.degree || 'Not Provided';
      const bestYear = list.find(s => s.passedOutYear && !s.passedOutYear.toLowerCase().includes('need to filled'))?.passedOutYear || master.passedOutYear || 'Need to filled';
      const bestStatus = list.find(s => s.currentStatus && s.currentStatus !== 'Need to filled')?.currentStatus || master.currentStatus || 'Need to filled';
      const bestCity = list.find(s => s.city && s.city.trim() !== '')?.city || master.city || '';
      const bestSkills = list.find(s => s.skills && s.skills.trim() !== '')?.skills || master.skills || '';
      const bestEmail = list.find(s => s.email && s.email.includes('@'))?.email || master.email || '';
      const bestName = list.find(s => s.name && s.name.trim().length > 2)?.name || master.name;

      const enrollments = Array.from(new Set([
        ...(master.enrollments || []),
        ...list.flatMap(s => s.enrollments || []),
        'Regular'
      ]));

      // 3. Update master record in DB
      await Student.updateOne(
        { _id: master._id },
        {
          $set: {
            name: bestName,
            mobile: normPhone, // Clean 10-digit number
            email: bestEmail,
            degree: bestDegree,
            passedOutYear: bestYear,
            batch: allBatches || master.batch,
            isFrontend: hasFrontend,
            studentType: hasFrontend ? 'Frontend' : (hasRegular ? 'Regular' : master.studentType),
            enrollments,
            currentStatus: bestStatus,
            city: bestCity,
            skills: bestSkills
          }
        }
      );

      // 4. Re-link related collections from duplicate IDs to master ID
      for (const dupId of duplicateIds) {
        await Attendance.updateMany({ studentId: dupId }, { $set: { studentId: master._id, mobile: normPhone } });
        await Task.updateMany({ studentId: dupId }, { $set: { studentId: master._id } });
        await DailyActivity.updateMany({ studentId: dupId }, { $set: { studentId: master._id } });
        await JobApplication.updateMany({ studentId: dupId }, { $set: { studentId: master._id } });
        await InterviewExperience.updateMany({ studentId: dupId }, { $set: { studentId: master._id } });
        await Timetable.updateMany({ studentId: dupId }, { $set: { studentId: master._id } });
        await LeaveRequest.updateMany({ studentId: dupId }, { $set: { studentId: master._id } });
        await Team.updateMany({ 'members.studentId': dupId }, { $set: { 'members.$.studentId': master._id } });

        // Update or consolidate User login accounts
        const dupUser = await User.findOne({ studentId: dupId });
        const masterUser = await User.findOne({ studentId: master._id });

        if (dupUser && !masterUser) {
          dupUser.studentId = master._id;
          dupUser.name = bestName;
          if (bestEmail) dupUser.email = bestEmail.toLowerCase();
          await dupUser.save();
        } else if (dupUser && masterUser) {
          // If master already has user account, delete duplicate user account
          await User.deleteOne({ _id: dupUser._id });
        }

        // 5. Delete redundant duplicate student record
        await Student.deleteOne({ _id: dupId });
      }

      totalMerged += duplicateIds.length;
      console.log(`[Migration] Merged ${duplicateIds.length} duplicate record(s) for ${bestName} (${normPhone}) -> Master Batch: "${allBatches}" (isFrontend: ${hasFrontend})`);
    }

    console.log(`[Migration] Deduplication completed. Merged and cleaned up ${totalMerged} redundant student records.`);
    return { mergedCount: totalMerged };
  } catch (err) {
    console.error('[Migration] Failed to run student deduplication migration:', err);
    throw err;
  }
};

// If run directly via `node mergeDuplicateStudents.js`
if (process.argv[1] && process.argv[1].endsWith('mergeDuplicateStudents.js')) {
  import('dotenv').then(async (dotenv) => {
    dotenv.default.config({ path: 'e:/Zuka/mytrackinginterview/server/.env' });
    dotenv.default.config();
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');
    await runDuplicateMergeMigration();
    await mongoose.disconnect();
    process.exit(0);
  });
}
