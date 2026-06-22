import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import SplRegistration from './models/SplRegistration.js';
import Attendance from './models/Attendance.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error("MONGODB_URI not found!");
    process.exit(1);
}

async function deleteMatches() {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    const students = await Student.find({ isFrontend: { $ne: true } }).lean();
    const spls = await SplRegistration.find().lean();

    const splEmails = new Map(spls.map(s => [s.email.toLowerCase().trim(), s]));
    const splMobiles = new Map(spls.map(s => [s.mobile.trim(), s]));

    const matches = [];
    const matchedSplIds = new Set();

    for (const student of students) {
        const studentEmail = (student.email || '').toLowerCase().trim();
        const studentMobile = (student.mobile || '').trim();
        
        let matchedSpl = null;

        if (studentEmail && splEmails.has(studentEmail)) {
            matchedSpl = splEmails.get(studentEmail);
        } else if (studentMobile && splMobiles.has(studentMobile)) {
            matchedSpl = splMobiles.get(studentMobile);
        }

        if (matchedSpl && !matchedSplIds.has(matchedSpl._id.toString())) {
            matchedSplIds.add(matchedSpl._id.toString());
            matches.push(matchedSpl);
        }
    }

    console.log(`Starting deletion of ${matches.length} matching SPL registrations...`);

    let deletedSplCount = 0;
    let deletedAttendanceCount = 0;

    for (const spl of matches) {
        // 1. Delete associated Attendance
        const attRes = await Attendance.deleteMany({ studentId: spl._id });
        deletedAttendanceCount += attRes.deletedCount;

        // 2. Delete SplRegistration
        await SplRegistration.findByIdAndDelete(spl._id);
        deletedSplCount++;

        console.log(`Deleted SPL: "${spl.name}" (${spl.email || 'no email'}) and ${attRes.deletedCount} attendance records.`);
    }

    console.log(`\nDeletion completed successfully!`);
    console.log(`Total SPL registrations deleted: ${deletedSplCount}`);
    console.log(`Total Attendance records deleted: ${deletedAttendanceCount}`);

    await mongoose.disconnect();
}

deleteMatches().catch(err => {
    console.error(err);
    process.exit(1);
});
