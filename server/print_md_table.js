import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import SplRegistration from './models/SplRegistration.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

function getNormalizedYear(student) {
  let yr = student.passedOutYear;
  const lowerYr = yr ? String(yr).trim().toLowerCase() : '';
  if (!yr || lowerYr === 'need to filled' || lowerYr === 'need to filled  ' || lowerYr === 'undefined' || lowerYr === '') {
    yr = student.batch;
  }
  yr = (yr && typeof yr === 'string') ? yr.trim() : '';
  return yr || 'Not Specified';
}

async function run() {
  await mongoose.connect(MONGO_URI);

  const students = await Student.find().lean();
  const splRegs = await SplRegistration.find().lean();

  const allRecords = [
    ...students.map(s => ({ ...s, source: 'Student' })),
    ...splRegs.map(r => ({
      ...r,
      source: 'SplRegistration',
      studentType: 'SPL',
      enrollments: ['SPL'],
      currentStatus: r.status,
      passedOutYear: r.batch
    }))
  ];

  const regularStudents = allRecords.filter(s => 
    !s.isFrontend && 
    (s.studentType === 'Regular' || (s.enrollments && s.enrollments.includes('Regular')))
  );

  const degreeYearMap = {};
  regularStudents.forEach(s => {
    const yr = getNormalizedYear(s);
    const degree = s.degree ? s.degree.trim() : 'Not Specified';
    const key = `${degree} | ${yr}`;

    const isPlaced = (s.currentStatus && s.currentStatus.toLowerCase() === 'placed') || 
                     (s.status && s.status.toLowerCase() === 'placed');
    
    const isOnboard = (s.currentStatus && s.currentStatus.toLowerCase() === 'onboard') || 
                      (s.status && s.status.toLowerCase() === 'onboard');

    if (!degreeYearMap[key]) {
      degreeYearMap[key] = {
        degree,
        year: yr,
        total: 0,
        placed: 0,
        onboard: 0
      };
    }

    degreeYearMap[key].total += 1;
    if (isPlaced) degreeYearMap[key].placed += 1;
    if (isOnboard) degreeYearMap[key].onboard += 1;
  });

  const sortedRows = Object.values(degreeYearMap).sort((a, b) => {
    const degCompare = a.degree.localeCompare(b.degree);
    if (degCompare !== 0) return degCompare;
    if (a.year === 'Not Specified') return 1;
    if (b.year === 'Not Specified') return -1;
    return b.year.localeCompare(a.year);
  });

  console.log('| Degree | Graduation Year | Total Students | Placed | Onboarded | Placement Rate |');
  console.log('| :--- | :--- | :---: | :---: | :---: | :---: |');
  sortedRows.forEach(row => {
    const rate = row.total > 0 ? Math.round((row.placed / row.total) * 100) + '%' : '0%';
    console.log(`| ${row.degree} | ${row.year} | ${row.total} | ${row.placed} | ${row.onboard} | ${rate} |`);
  });

  await mongoose.disconnect();
}

run().catch(console.error);
