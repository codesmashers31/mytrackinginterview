import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import User from './models/User.js';
import DailyActivity from './models/DailyActivity.js';
import LeaveRequest from './models/LeaveRequest.js';
import MockInterview from './models/MockInterview.js';
import Notification from './models/Notification.js';
import Task from './models/Task.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected to MongoDB');

  // 1. Group users by studentId
  const allUsers = await User.find({ role: 'student', studentId: { $exists: true, $ne: null } }).lean();
  
  const userGroups = {};
  allUsers.forEach(user => {
    const key = user.studentId.toString();
    if (!userGroups[key]) {
      userGroups[key] = [];
    }
    userGroups[key].push(user);
  });

  console.log(`Analyzing duplicate user accounts for ${Object.keys(userGroups).length} students...`);

  for (const studentIdStr of Object.keys(userGroups)) {
    const group = userGroups[studentIdStr];
    if (group.length <= 1) continue;

    console.log(`\nFound duplicate accounts for Student ID ${studentIdStr}:`);
    group.forEach(u => {
      console.log(`  - User ID: ${u._id}, Name: ${u.name}, Email: ${u.email}`);
    });

    // Determine the primary account (prefer actual email over mobile)
    let primaryUser = null;
    let secondaryUsers = [];

    // Filter to see if any has actual email
    const emailUsers = group.filter(u => !/^\d+$/.test(u.email));
    if (emailUsers.length > 0) {
      // If there are actual email users, pick the first one as primary
      primaryUser = emailUsers[0];
      secondaryUsers = group.filter(u => u._id.toString() !== primaryUser._id.toString());
    } else {
      // If all are mobile-based, pick the first one as primary
      primaryUser = group[0];
      secondaryUsers = group.slice(1);
    }

    console.log(`  => Keeping Primary User: ${primaryUser._id} (${primaryUser.email})`);
    
    for (const secUser of secondaryUsers) {
      console.log(`  => Migrating and deleting Secondary User: ${secUser._id} (${secUser.email})`);
      
      const oldId = secUser._id;
      const newId = primaryUser._id;

      // Migrate references
      const dailyRes = await DailyActivity.updateMany({ userId: oldId }, { $set: { userId: newId } });
      const leaveRes1 = await LeaveRequest.updateMany({ userId: oldId }, { $set: { userId: newId } });
      const leaveRes2 = await LeaveRequest.updateMany({ handledBy: oldId }, { $set: { handledBy: newId } });
      const mockRes = await MockInterview.updateMany({ studentId: oldId }, { $set: { studentId: newId } });
      const notifRes = await Notification.updateMany({ userId: oldId }, { $set: { userId: newId } });
      const taskRes = await Task.updateMany({ studentId: oldId }, { $set: { studentId: newId } });

      console.log(`     Migrated: ${dailyRes.modifiedCount} daily activities, ${leaveRes1.modifiedCount + leaveRes2.modifiedCount} leaves, ${mockRes.modifiedCount} mock interviews, ${notifRes.modifiedCount} notifications, ${taskRes.modifiedCount} tasks.`);
      
      // Delete the secondary User
      await User.deleteOne({ _id: oldId });
      console.log(`     Deleted duplicate User account.`);
    }
  }

  // 2. Resolve case where User email is mobile, but student has email AND that email is used by a User account with no studentId
  console.log('\nChecking for mobile-email overlap accounts...');
  const mobileUsers = await User.find({ role: 'student', email: /^\d+$/ }).lean();
  for (const user of mobileUsers) {
    if (!user.studentId) continue;
    const student = await Student.findById(user.studentId).lean();
    if (student && student.email) {
      const cleanEmail = student.email.trim().toLowerCase();
      // Look if there is another User account with this email
      const otherUser = await User.findOne({ email: cleanEmail });
      if (otherUser) {
        console.log(`\nFound matching email account for ${student.name} (${cleanEmail}) but it had no/wrong studentId:`);
        console.log(`  - Mobile User Account: ${user._id} (${user.email})`);
        console.log(`  - Email User Account: ${otherUser._id} (${otherUser.email})`);
        
        // Let's merge them: update email account to point to this student, migrate mobile account references, and delete mobile account
        otherUser.studentId = student._id;
        await otherUser.save();
        console.log(`  => Linked email account ${otherUser._id} to Student ${student._id}`);

        const oldId = user._id;
        const newId = otherUser._id;

        // Migrate references
        const dailyRes = await DailyActivity.updateMany({ userId: oldId }, { $set: { userId: newId } });
        const leaveRes1 = await LeaveRequest.updateMany({ userId: oldId }, { $set: { userId: newId } });
        const leaveRes2 = await LeaveRequest.updateMany({ handledBy: oldId }, { $set: { handledBy: newId } });
        const mockRes = await MockInterview.updateMany({ studentId: oldId }, { $set: { studentId: newId } });
        const notifRes = await Notification.updateMany({ userId: oldId }, { $set: { userId: newId } });
        const taskRes = await Task.updateMany({ studentId: oldId }, { $set: { studentId: newId } });

        console.log(`     Migrated: ${dailyRes.modifiedCount} daily activities, ${leaveRes1.modifiedCount + leaveRes2.modifiedCount} leaves, ${mockRes.modifiedCount} mock interviews, ${notifRes.modifiedCount} notifications, ${taskRes.modifiedCount} tasks.`);
        
        await User.deleteOne({ _id: oldId });
        console.log(`     Deleted duplicate Mobile User account.`);
      }
    }
  }

  console.log('\nDuplicate resolution complete.');
  await mongoose.disconnect();
}

run().catch(console.error);
