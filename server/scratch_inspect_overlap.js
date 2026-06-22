import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import SplRegistration from './models/SplRegistration.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error("MONGODB_URI not found!");
    process.exit(1);
}

async function inspectOverlap() {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    const students = await Student.find().lean();
    const spls = await SplRegistration.find().lean();

    const splEmails = new Set(spls.map(s => s.email.toLowerCase().trim()).filter(Boolean));
    const splMobiles = new Set(spls.map(s => s.mobile.trim()).filter(Boolean));

    let overlapEmailCount = 0;
    let overlapMobileCount = 0;
    let overlapBothCount = 0;
    
    const overlappingStudents = [];

    for (const student of students) {
        const studentEmail = (student.email || '').toLowerCase().trim();
        const studentMobile = (student.mobile || '').trim();
        
        const emailMatch = studentEmail && splEmails.has(studentEmail);
        const mobileMatch = studentMobile && splMobiles.has(studentMobile);
        
        if (emailMatch || mobileMatch) {
            overlappingStudents.push({
                name: student.name,
                email: student.email,
                mobile: student.mobile,
                isFrontend: student.isFrontend,
                currentStatus: student.currentStatus,
                emailMatch,
                mobileMatch
            });
            if (emailMatch && mobileMatch) overlapBothCount++;
            else if (emailMatch) overlapEmailCount++;
            else if (mobileMatch) overlapMobileCount++;
        }
    }

    console.log(`Total students in Student collection: ${students.length}`);
    console.log(`Total SPL registrations: ${spls.length}`);
    console.log(`Overlapping students (by email/mobile): ${overlappingStudents.length}`);
    console.log(` - Match by both email and mobile: ${overlapBothCount}`);
    console.log(` - Match by email only: ${overlapEmailCount}`);
    console.log(` - Match by mobile only: ${overlapMobileCount}`);

    console.log("\nSample Overlapping Students:");
    console.log(overlappingStudents.slice(0, 10));

    await mongoose.disconnect();
}

inspectOverlap().catch(err => {
    console.error(err);
    process.exit(1);
});
