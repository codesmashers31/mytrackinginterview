import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import Student from './models/Student.js';
import SplRegistration from './models/SplRegistration.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  if (!MONGO_URI) {
    console.error('Error: MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Load all students and SPL registrations
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

  // Filter Regular students (exclude Frontend, include Regular)
  const regularStudents = allRecords.filter(s => 
    !s.isFrontend && 
    (s.studentType === 'Regular' || (s.enrollments && s.enrollments.includes('Regular')))
  );

  console.log(`Total Regular Students Found: ${regularStudents.length}`);

  // 1. Build Summary Pivot Data Grouped by Degree & Year
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
        'Degree': degree,
        'Graduation Year': yr,
        'Total Students': 0,
        'Placed Students': 0,
        'Onboarded Students': 0
      };
    }

    degreeYearMap[key]['Total Students'] += 1;
    if (isPlaced) degreeYearMap[key]['Placed Students'] += 1;
    if (isOnboard) degreeYearMap[key]['Onboarded Students'] += 1;
  });

  const pivotRows = Object.values(degreeYearMap).sort((a, b) => {
    const degCompare = a['Degree'].localeCompare(b['Degree']);
    if (degCompare !== 0) return degCompare;
    
    if (a['Graduation Year'] === 'Not Specified') return 1;
    if (b['Graduation Year'] === 'Not Specified') return -1;
    return b['Graduation Year'].localeCompare(a['Graduation Year']);
  });

  // Format Pivot Rows
  const excelRows = pivotRows.map(row => {
    const total = row['Total Students'];
    const placed = row['Placed Students'];
    const rate = total > 0 ? Math.round((placed / total) * 100) + '%' : '0%';
    
    return {
      'Degree': row['Degree'],
      'Graduation Year': row['Graduation Year'],
      'Total Students': total,
      'Placed Students': placed,
      'Onboarded Students': row['Onboarded Students'],
      'Placement Rate': rate
    };
  });

  // Calculate Overall Totals
  const totals = {
    'Degree': 'Total (Overall)',
    'Graduation Year': '',
    'Total Students': 0,
    'Placed Students': 0,
    'Onboarded Students': 0,
    'Placement Rate': ''
  };

  excelRows.forEach(row => {
    totals['Total Students'] += row['Total Students'];
    totals['Placed Students'] += row['Placed Students'];
    totals['Onboarded Students'] += row['Onboarded Students'];
  });

  totals['Placement Rate'] = totals['Total Students'] > 0 
    ? Math.round((totals['Placed Students'] / totals['Total Students']) * 100) + '%'
    : '0%';

  const pivotSheetData = [...excelRows, {}, totals];

  // 2. Build Detailed List Sheet Data
  const detailedSheetData = regularStudents.map(s => {
    return {
      'Candidate Name': s.name || '',
      'Email ID': s.email || '',
      'Mobile Number': s.mobile || '',
      'Graduation Year / Batch': getNormalizedYear(s),
      'Degree': s.degree || 'Not Provided',
      'Placement Status': s.currentStatus || s.status || 'Needs Update',
      'Placed Company': s.companyName || '-',
      'Package (LPA)': s.packageLpa || '-',
      'Job Channel / Mode': s.jobGetMode || '-',
      'City / Region': s.city || '-',
      'Technical Skills': s.skills || '-'
    };
  });

  // Create Workbook
  const wb = XLSX.utils.book_new();

  // Create Worksheets
  const wsPivot = XLSX.utils.json_to_sheet(pivotSheetData);
  const wsDetailed = XLSX.utils.json_to_sheet(detailedSheetData);

  // Set column widths for Pivot Sheet
  const pivotWidths = [
    { wch: 25 }, // Degree
    { wch: 20 }, // Graduation Year
    { wch: 15 }, // Total Students
    { wch: 15 }, // Placed Students
    { wch: 18 }, // Onboarded Students
    { wch: 18 }  // Placement Rate
  ];
  wsPivot['!cols'] = pivotWidths;

  // Set column widths for Detailed Sheet
  const detailedWidths = [
    { wch: 22 }, // Candidate Name
    { wch: 25 }, // Email ID
    { wch: 15 }, // Mobile Number
    { wch: 22 }, // Graduation Year / Batch
    { wch: 25 }, // Degree
    { wch: 18 }, // Placement Status
    { wch: 20 }, // Placed Company
    { wch: 15 }, // Package (LPA)
    { wch: 20 }, // Job Channel / Mode
    { wch: 15 }, // City / Region
    { wch: 30 }  // Technical Skills
  ];
  wsDetailed['!cols'] = detailedWidths;

  // Append worksheets to workbook
  XLSX.utils.book_append_sheet(wb, wsPivot, 'Regular Analytics Summary');
  XLSX.utils.book_append_sheet(wb, wsDetailed, 'Regular Candidates Detail');

  // Define target path in the workspace root
  const targetPath = path.resolve(__dirname, '../Regular_Students_Onboarding_Analytics.xlsx');
  try {
    XLSX.writeFile(wb, targetPath);
    console.log(`Excel report successfully generated at: ${targetPath}`);
  } catch (err) {
    if (err.code === 'EBUSY') {
      const altPath = path.resolve(__dirname, '../Regular_Students_Onboarding_Analytics_Grouped.xlsx');
      console.log(`Original file is busy/locked by another application. Writing to: ${altPath}`);
      XLSX.writeFile(wb, altPath);
      console.log(`Excel report successfully generated at: ${altPath}`);
    } else {
      throw err;
    }
  }

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Error running script:', err);
  await mongoose.disconnect();
});
