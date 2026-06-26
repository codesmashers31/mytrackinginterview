import * as XLSX from 'xlsx';

/**
 * Generates an Excel report containing:
 * 1. A summary Pivot sheet grouping students by year & grade.
 * 2. A detailed sheet listing all candidate attributes.
 * 
 * @param {Array} filteredStudents - The student records matching the active dashboard filters.
 */
export const exportToExcel = (filteredStudents) => {
  if (!filteredStudents || filteredStudents.length === 0) {
    return;
  }

  // 1. Build Summary Pivot Data
  const yearsMap = {};

  filteredStudents.forEach(s => {
    let yr = s.passedOutYear;
    const lowerYr = yr ? String(yr).trim().toLowerCase() : '';
    if (!yr || lowerYr === 'need to filled' || lowerYr === 'need to filled  ' || lowerYr === 'undefined') {
      yr = s.batch;
    }
    yr = (yr && typeof yr === 'string') ? yr.trim() : '';
    if (!yr || yr === 'undefined' || yr === '') {
      yr = 'Not Specified';
    }

    // Normalize Grade
    let grade = s.grade ? s.grade.trim().toUpperCase() : 'No Grade';
    if (!grade || grade === 'UNDEFINED' || grade === '') {
      grade = 'No Grade';
    }

    // Check status
    const isPlaced = (s.currentStatus && s.currentStatus.toLowerCase() === 'placed') || 
                     (s.status && s.status.toLowerCase() === 'placed');

    // Check if SPL candidate
    const isSpl = s.studentType === 'SPL' || (s.enrollments && s.enrollments.includes('SPL'));

    if (!yearsMap[yr]) {
      yearsMap[yr] = {
        'Graduation Year': yr,
        'Grade A': 0,
        'Grade B': 0,
        'Grade C': 0,
        'Grade Other/None': 0,
        'Total Students': 0,
        'Placed Students': 0,
        'SPL Class Students': 0
      };
    }

    yearsMap[yr]['Total Students'] += 1;
    if (grade === 'A') yearsMap[yr]['Grade A'] += 1;
    else if (grade === 'B') yearsMap[yr]['Grade B'] += 1;
    else if (grade === 'C') yearsMap[yr]['Grade C'] += 1;
    else yearsMap[yr]['Grade Other/None'] += 1;

    if (isPlaced) yearsMap[yr]['Placed Students'] += 1;
    if (isSpl) yearsMap[yr]['SPL Class Students'] += 1;
  });

  const pivotRows = Object.values(yearsMap).sort((a, b) => {
    if (a['Graduation Year'] === 'Not Specified') return 1;
    if (b['Graduation Year'] === 'Not Specified') return -1;
    return b['Graduation Year'].localeCompare(a['Graduation Year']);
  });

  // Calculate overall totals
  const totals = {
    'Graduation Year': 'Total (Overall)',
    'Grade A': 0,
    'Grade B': 0,
    'Grade C': 0,
    'Grade Other/None': 0,
    'Total Students': 0,
    'Placed Students': 0,
    'SPL Class Students': 0
  };

  pivotRows.forEach(row => {
    totals['Grade A'] += row['Grade A'];
    totals['Grade B'] += row['Grade B'];
    totals['Grade C'] += row['Grade C'];
    totals['Grade Other/None'] += row['Grade Other/None'];
    totals['Total Students'] += row['Total Students'];
    totals['Placed Students'] += row['Placed Students'];
    totals['SPL Class Students'] += row['SPL Class Students'];
  });

  // Add Placement Rate column to each row
  const addCalculatedFields = (row) => {
    const total = row['Total Students'];
    const placed = row['Placed Students'];
    row['Placement Rate (%)'] = total > 0 ? Math.round((placed / total) * 100) + '%' : '0%';
    return row;
  };

  const formattedPivotRows = pivotRows.map(row => addCalculatedFields({ ...row }));
  const formattedTotals = addCalculatedFields({ ...totals });

  // Combine rows and totals with an empty separator row
  const pivotSheetData = [...formattedPivotRows, {}, formattedTotals];

  // 2. Build Detailed List Sheet Data
  const detailedSheetData = filteredStudents.map(s => {
    const isSpl = s.studentType === 'SPL' || (s.enrollments && s.enrollments.includes('SPL'));
    return {
      'Candidate Name': s.name || '',
      'Email ID': s.email || '',
      'Mobile Number': s.mobile || '',
      'Student Type': s.studentType || (s.isFrontend ? 'Frontend' : 'Regular'),
      'Graduation Year': s.passedOutYear || 'Not Specified',
      'Batch Name': s.batch || 'N/A',
      'Grade Earned': s.grade || 'N/A',
      'Placement Status': s.currentStatus || s.status || 'Needs Update',
      'Placed Company': s.companyName || '-',
      'Package (LPA)': s.packageLpa || '-',
      'Job Channel / Mode': s.jobGetMode || '-',
      'City / Region': s.city || '-',
      'Technical Skills': s.skills || '',
      'SPL Willingness': isSpl ? (s.willingCompanyProcess ? 'Yes' : 'No') : 'N/A',
      'SPL Tech Stack': s.stack || '-'
    };
  });

  // Create Excel workbook and append worksheets
  const wb = XLSX.utils.book_new();

  // Create worksheets from JSON data
  const wsPivot = XLSX.utils.json_to_sheet(pivotSheetData);
  const wsDetailed = XLSX.utils.json_to_sheet(detailedSheetData);

  // Set column widths for Pivot Sheet
  const pivotWidths = [
    { wch: 20 }, // Graduation Year
    { wch: 12 }, // Grade A
    { wch: 12 }, // Grade B
    { wch: 12 }, // Grade C
    { wch: 18 }, // Grade Other/None
    { wch: 15 }, // Total Students
    { wch: 15 }, // Placed Students
    { wch: 18 }, // SPL Class Students
    { wch: 18 }  // Placement Rate
  ];
  wsPivot['!cols'] = pivotWidths;

  // Set column widths for Detailed Sheet
  const detailedWidths = [
    { wch: 22 }, // Candidate Name
    { wch: 25 }, // Email ID
    { wch: 15 }, // Mobile Number
    { wch: 15 }, // Student Type
    { wch: 18 }, // Graduation Year
    { wch: 15 }, // Batch Name
    { wch: 12 }, // Grade Earned
    { wch: 18 }, // Placement Status
    { wch: 20 }, // Placed Company
    { wch: 15 }, // Package (LPA)
    { wch: 20 }, // Job Channel / Mode
    { wch: 15 }, // City / Region
    { wch: 30 }, // Technical Skills
    { wch: 18 }, // SPL Willingness
    { wch: 20 }  // SPL Tech Stack
  ];
  wsDetailed['!cols'] = detailedWidths;

  // Append worksheets to workbook
  XLSX.utils.book_append_sheet(wb, wsPivot, 'Summary & Pivot Matrix');
  XLSX.utils.book_append_sheet(wb, wsDetailed, 'Detailed Candidate Roster');

  // Trigger Excel file download
  XLSX.writeFile(wb, 'Student_Placements_Pivot_Report.xlsx');
};

export const exportRegularAnalyticsToExcel = (allStudents) => {
  if (!allStudents || allStudents.length === 0) {
    return;
  }

  // Filter regular students (exclude Frontend)
  const regularStudents = allStudents.filter(s => 
    !s.isFrontend && 
    (s.studentType === 'Regular' || s.enrollments?.includes('Regular'))
  );

  const yearsMap = {};

  regularStudents.forEach(s => {
    // Determine Graduation Year safely
    let yr = s.passedOutYear;
    const lowerYr = yr ? String(yr).trim().toLowerCase() : '';
    if (!yr || lowerYr === 'need to filled' || lowerYr === 'need to filled  ' || lowerYr === 'undefined') {
      yr = s.batch;
    }
    yr = (yr && typeof yr === 'string') ? yr.trim() : '';
    if (!yr || yr === 'undefined' || yr === '') {
      yr = 'Not Specified';
    }

    const degree = s.degree ? s.degree.trim() : 'Not Specified';

    const isPlaced = (s.currentStatus && s.currentStatus.toLowerCase() === 'placed') || 
                     (s.status && s.status.toLowerCase() === 'placed');
    
    const isOnboard = (s.currentStatus && s.currentStatus.toLowerCase() === 'onboard') || 
                      (s.status && s.status.toLowerCase() === 'onboard');

    if (!yearsMap[yr]) {
      yearsMap[yr] = {
        'Graduation Year': yr,
        'Total Students': 0,
        'Placed Students': 0,
        'Onboarded Students': 0,
        degrees: {}
      };
    }

    yearsMap[yr]['Total Students'] += 1;
    if (isPlaced) yearsMap[yr]['Placed Students'] += 1;
    if (isOnboard) yearsMap[yr]['Onboarded Students'] += 1;

    yearsMap[yr].degrees[degree] = (yearsMap[yr].degrees[degree] || 0) + 1;
  });

  const pivotRows = Object.values(yearsMap).sort((a, b) => {
    if (a['Graduation Year'] === 'Not Specified') return 1;
    if (b['Graduation Year'] === 'Not Specified') return -1;
    return b['Graduation Year'].localeCompare(a['Graduation Year']);
  });

  // Create formatted rows
  const excelRows = pivotRows.map(row => {
    const total = row['Total Students'];
    const placed = row['Placed Students'];
    const rate = total > 0 ? Math.round((placed / total) * 100) + '%' : '0%';
    
    // Degree breakdown string
    const degreeBreakdownStr = Object.entries(row.degrees)
      .map(([deg, cnt]) => `${deg}: ${cnt}`)
      .join(', ');

    return {
      'Graduation Year': row['Graduation Year'],
      'Total Students': total,
      'Placed Students': placed,
      'Onboarded Students': row['Onboarded Students'],
      'Placement Rate': rate,
      'Degree-wise Breakdown': degreeBreakdownStr
    };
  });

  // Calculate Overall Totals
  const totals = {
    'Graduation Year': 'Total (Overall)',
    'Total Students': 0,
    'Placed Students': 0,
    'Onboarded Students': 0,
    'Placement Rate': '',
    'Degree-wise Breakdown': ''
  };

  excelRows.forEach(row => {
    totals['Total Students'] += row['Total Students'];
    totals['Placed Students'] += row['Placed Students'];
    totals['Onboarded Students'] += row['Onboarded Students'];
  });

  totals['Placement Rate'] = totals['Total Students'] > 0 
    ? Math.round((totals['Placed Students'] / totals['Total Students']) * 100) + '%'
    : '0%';

  const finalSheetData = [...excelRows, {}, totals];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(finalSheetData);

  // Set column widths
  const colWidths = [
    { wch: 20 }, // Graduation Year
    { wch: 15 }, // Total Students
    { wch: 15 }, // Placed Students
    { wch: 18 }, // Onboarded Students
    { wch: 18 }, // Placement Rate
    { wch: 50 }  // Degree Breakdown
  ];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Regular Analytics Summary');
  XLSX.writeFile(wb, 'Regular_Students_Onboarding_Analytics.xlsx');
};
