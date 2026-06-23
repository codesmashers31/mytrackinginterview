import Student from '../models/Student.js';
import SplRegistration from '../models/SplRegistration.js';
import Attendance from '../models/Attendance.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import DailyActivity from '../models/DailyActivity.js';
import LeaveRequest from '../models/LeaveRequest.js';
import MockInterview from '../models/MockInterview.js';

const splMatches = [
  { splName: "KarthikaRajeswari ", splEmail: "rajeswarikarthiga143@gmail.com", splMobile: "7339672373" },
  { splName: "Ravivarman A", splEmail: "ravivarmancse31@gmail.com", splMobile: "7395884718" },
  { splName: "Jayakumar S", splEmail: "jayakumar1532003@gmail.com", splMobile: "9384492469" },
  { splName: "Gopiga K", splEmail: "gopigakannan@gmail.com", splMobile: "9786079117" },
  { splName: "Kalpitaa M G ", splEmail: "mgkalpitaa@gmail.com", splMobile: "9043013271" },
  { splName: "Prem Kumar M", splEmail: "m.premkumar2503@gmail.com", splMobile: "6383411026" },
  { splName: "Nithyasri k", splEmail: "nithyanithya3993@gmail.com", splMobile: "6369346836" },
  { splName: "Selladurai J", splEmail: "selladurai1904@gmail.com", splMobile: "9363223513" },
  { splName: "Rubini B ", splEmail: "rubinibalusamy@gmail.com", splMobile: "9965111393" },
  { splName: "GOWTHAMAN R", splEmail: "gowthammathu7@gmail.com", splMobile: "8015272190" },
  { splName: "Durga GB ", splEmail: "durgagb21@gmail.com", splMobile: "9994038535" },
  { splName: "THOLKAPPIYAN S", splEmail: "tkpandiyan2000@gmail.com", splMobile: "7806882827" },
  { splName: "Mohamed Kasim", splEmail: "kasim151000@gmail.com", splMobile: "9025897581" },
  { splName: "Dinesh K", splEmail: "kdineshuchb@gmail.com", splMobile: "9500851314" },
  { splName: "Priya Darshini", splEmail: "priyakeerthy0807@gmail.com", splMobile: "6363131752" },
  { splName: "Chandru s", splEmail: "chandrusuriya49@gmail.com", splMobile: "8220687692" },
  { splName: "Suresh R", splEmail: "ss9477157@gmail.com", splMobile: "6369722581" },
  { splName: "Saradha S", splEmail: "saradhasundharesan@gmail.com", splMobile: "7845203108" },
  { splName: "R. Rajbharath", splEmail: "rbharath552@gmail.com", splMobile: "8015985611" },
  { splName: "Subalakshmi K", splEmail: "subakannan1409@gmail.com", splMobile: "8438552690" },
  { splName: "Rajalakshmi S", splEmail: "rajselva65588@gmail.com", splMobile: "6383780501" },
  { splName: "Ramesh", splEmail: "rameshmanohar2001m@gmail.com", splMobile: "7010251221" },
  { splName: "Visvesvaran G", splEmail: "visvesvaran62@gmail.com", splMobile: "7708402766" },
  { splName: "Aswitha ", splEmail: "aswithavijayakumar1120@gmail.com", splMobile: "7305197294" },
  { splName: "Kavi Arasan", splEmail: "kaviarasan7778@gmail.com", splMobile: "6385538234" },
  { splName: "Brammanayagan S", splEmail: "sakthibrammanayagan@gmail.com", splMobile: "8428726958" },
  { splName: "Swathi N", splEmail: "swathi.pkn@gmail.com", splMobile: "7812875312" },
  { splName: "Shree Nithiya .k", splEmail: "nithiyashreek2004@gmail.com", splMobile: "8838844247" },
  { splName: "Raghuram Ravi", splEmail: "raghudae248@gmail.com", splMobile: "9080576226" },
  { splName: "Manikumar J", splEmail: "manikumarj6@gmail.com", splMobile: "" },
  { splName: "Thamizh Selvan R", splEmail: "thamizhselvan2803@gmail.com", splMobile: "" },
  { splName: "MALARAVAN P", splEmail: "malaravanofficial@gmail.com", splMobile: "" },
  { splName: "Jayasurya K", splEmail: "jai34563@gmail.com", splMobile: "" },
  { splName: "Dhanush ", splEmail: "dhanusharumugam245@gmail.com", splMobile: "" },
  { splName: "karthika", splEmail: "karthikakumar2026@gmail.com", splMobile: "" },
  { splName: "Arun A ", splEmail: "arunchris.postbox@gmail.com", splMobile: "" },
  { splName: "Asitha A", splEmail: "asithaa9613@gmail.com", splMobile: "" },
  { splName: "RAGUL T", splEmail: "ragul131121@gmail.com", splMobile: "" },
  { splName: "Saritha N", splEmail: "sarithasankari154@gmail.com", splMobile: "" },
  { splName: "Devanathan A", splEmail: "deva22ad@gmail.com", splMobile: "" },
  { splName: "BalaMugunthan", splEmail: "balasoftlogic12@gmail.com", splMobile: "" },
  { splName: "Ranjani Ram", splEmail: "ranjaniram81@gmail.com", splMobile: "" }
];

const isRegularBatch1to9 = (batch) => {
  if (!batch) return false;
  return /Batch\s*[1-9]\b/i.test(batch.trim());
};

export const runStudentMigration = async () => {
  console.log('[Migration] Starting PlaceX student record migration (Restoring SplRegistration)...');
  try {
    // 1. Force Suresh R to Batch 2 and Saritha N to Batch 1 in Student collection
    const suresh = await Student.findOne({
      $or: [
        { email: 'ss9477157@gmail.com' },
        { mobile: '6369722581' }
      ],
      studentType: { $ne: 'SPL' }
    });
    if (suresh) {
      suresh.batch = 'Batch 2';
      suresh.passedOutYear = '2025';
      if (!suresh.enrollments.includes('Regular')) suresh.enrollments.push('Regular');
      await suresh.save();
      console.log('[Migration] Suresh R set to Batch 2.');
    }

    const saritha = await Student.findOne({
      $or: [
        { email: 'sarithasankari154@gmail.com' },
        { mobile: '9361348040' }
      ],
      studentType: { $ne: 'SPL' }
    });
    if (saritha) {
      saritha.batch = 'Batch 1';
      saritha.passedOutYear = '2025';
      if (!saritha.enrollments.includes('Regular')) saritha.enrollments.push('Regular');
      await saritha.save();
      console.log('[Migration] Saritha N set to Batch 1.');
    }

    const nithyasri = await Student.findOne({
      $or: [
        { email: 'nithyanithya3993@gmail.com' },
        { mobile: '6369346836' }
      ],
      studentType: { $ne: 'SPL' }
    });
    if (nithyasri) {
      nithyasri.batch = 'Batch 8';
      nithyasri.passedOutYear = '2024';
      if (!nithyasri.enrollments.includes('Regular')) nithyasri.enrollments.push('Regular');
      await nithyasri.save();
      console.log('[Migration] Nithyasri k set to Batch 8.');
    }

    // 2. Loop through candidates and selectively restore or merge
    for (const match of splMatches) {
      const email = match.splEmail ? match.splEmail.trim().toLowerCase() : '';
      const mobile = match.splMobile ? match.splMobile.trim() : '';

      // Find any regular student profile in Student collection
      let regularStudent = null;
      if (mobile) {
        regularStudent = await Student.findOne({ mobile, enrollments: 'Regular' });
      }
      if (!regularStudent && email) {
        regularStudent = await Student.findOne({ email, enrollments: 'Regular' });
      }

      // Check if candidate is Batch 1-9 regular student
      const isBatch1to9 = regularStudent && isRegularBatch1to9(regularStudent.batch);

      // Find any separate SPL student profile currently in the Student collection
      let existingSplStudent = null;
      if (mobile) {
        existingSplStudent = await Student.findOne({ mobile, studentType: 'SPL' });
      }
      if (!existingSplStudent && email) {
        existingSplStudent = await Student.findOne({ email, studentType: 'SPL' });
      }

      if (isBatch1to9) {
        // --- DUPLICATE MERGE CASE ---
        console.log(`[Migration] Merging duplicate SPL candidate: "${match.splName.trim()}" into regular student "${regularStudent.name}" (Batch: ${regularStudent.batch})`);
        
        // Ensure enrollments has 'SPL'
        if (!regularStudent.enrollments.includes('SPL')) {
          regularStudent.enrollments.push('SPL');
        }

        // Copy SPL-specific fields from match details or from existing separate student record
        const sourceData = existingSplStudent || match;
        regularStudent.stack = sourceData.stack || regularStudent.stack || '';
        regularStudent.willingCompanyProcess = sourceData.willingCompanyProcess !== undefined ? sourceData.willingCompanyProcess : regularStudent.willingCompanyProcess;
        regularStudent.willing30Days = sourceData.willing30Days || regularStudent.willing30Days || '';
        regularStudent.acceptOffer = sourceData.acceptOffer || regularStudent.acceptOffer || '';
        regularStudent.fullEffort = sourceData.fullEffort || regularStudent.fullEffort || '';
        regularStudent.issues = sourceData.issues || regularStudent.issues || '';
        regularStudent.needMost = sourceData.needMost || regularStudent.needMost || '';
        regularStudent.status = sourceData.status || regularStudent.status || 'New';
        regularStudent.statusReason = sourceData.statusReason || regularStudent.statusReason || '';
        if (sourceData.resumeData && Object.keys(sourceData.resumeData).length > 0) {
          regularStudent.resumeData = sourceData.resumeData;
        }

        await regularStudent.save();

        // Delete from SplRegistration if they exist there (migrating any references first)
        const splQuery = [];
        if (email) splQuery.push({ email });
        if (mobile) splQuery.push({ mobile });
        if (splQuery.length > 0) {
          const splRegDoc = await SplRegistration.findOne({ $or: splQuery });
          if (splRegDoc) {
            const oldId = splRegDoc._id;
            const newId = regularStudent._id;

            // Migrate references to the regular student
            await Attendance.updateMany({ studentId: oldId }, { $set: { studentId: newId } });
            await User.updateMany({ studentId: oldId }, { $set: { studentId: newId } });
            await Task.updateMany({ studentId: oldId }, { $set: { studentId: newId } });
            await DailyActivity.updateMany({ studentId: oldId }, { $set: { studentId: newId } });
            await LeaveRequest.updateMany({ studentId: oldId }, { $set: { studentId: newId } });
            await MockInterview.updateMany({ studentId: oldId }, { $set: { studentId: newId } });

            // Update Team references
            const teams = await Team.find({ members: oldId });
            for (const team of teams) {
              team.members = team.members.filter(m => m.toString() !== oldId.toString());
              if (!team.members.some(m => m.toString() === newId.toString())) {
                team.members.push(newId);
              }
              await team.save();
            }

            await SplRegistration.deleteOne({ _id: oldId });
            console.log(`[Migration] Migrated SplRegistration references for "${match.splName}" and deleted SplRegistration record.`);
          }
        }

        if (existingSplStudent) {
          const oldId = existingSplStudent._id;
          const newId = regularStudent._id;

          // Migrate references to the regular student
          await Attendance.updateMany({ studentId: oldId }, { $set: { studentId: newId } });
          await User.updateMany({ studentId: oldId }, { $set: { studentId: newId } });
          await Task.updateMany({ studentId: oldId }, { $set: { studentId: newId } });
          await DailyActivity.updateMany({ studentId: oldId }, { $set: { studentId: newId } });
          await LeaveRequest.updateMany({ studentId: oldId }, { $set: { studentId: newId } });
          await MockInterview.updateMany({ studentId: oldId }, { $set: { studentId: newId } });

          // Update Team references
          const teams = await Team.find({ members: oldId });
          for (const team of teams) {
            team.members = team.members.filter(m => m.toString() !== oldId.toString());
            if (!team.members.some(m => m.toString() === newId.toString())) {
              team.members.push(newId);
            }
            await team.save();
          }

          // Delete the separate SPL record
          await Student.findByIdAndDelete(oldId);
          console.log(`[Migration] Migrated existingSplStudent references for "${match.splName}" and deleted Student SPL record.`);
        }
      } else {
        // --- RESTORE SPLREGISTRATION CASE ---
        // Restore/Upsert into SplRegistration collection
        const splQuery = [];
        if (email) splQuery.push({ email });
        if (mobile) splQuery.push({ mobile });
        
        let splReg = null;
        if (splQuery.length > 0) {
          splReg = await SplRegistration.findOne({ $or: splQuery });
        }

        const sourceData = existingSplStudent || match;
        const payload = {
          name: match.splName || sourceData.name || '',
          email: email || sourceData.email || '',
          mobile: mobile || sourceData.mobile || '',
          degree: sourceData.degree || (regularStudent ? regularStudent.degree : ''),
          batch: sourceData.batch || (regularStudent ? regularStudent.batch : ''),
          stack: sourceData.stack || '',
          willingCompanyProcess: !!sourceData.willingCompanyProcess,
          willing30Days: sourceData.willing30Days || '',
          acceptOffer: sourceData.acceptOffer || '',
          fullEffort: sourceData.fullEffort || '',
          issues: sourceData.issues || '',
          needMost: sourceData.needMost || '',
          status: sourceData.status || 'New',
          statusReason: sourceData.statusReason || '',
          grade: sourceData.grade || (regularStudent ? regularStudent.grade : ''),
          resumeData: sourceData.resumeData || {}
        };

        if (splReg) {
          Object.assign(splReg, payload);
          await splReg.save();
        } else {
          splReg = new SplRegistration(payload);
          await splReg.save();
          console.log(`[Migration] Restored SplRegistration profile for: "${payload.name.trim()}"`);
        }

        // Clean up regular student record if it exists (since they are separate now)
        if (regularStudent) {
          regularStudent.enrollments = (regularStudent.enrollments || []).filter(e => e !== 'SPL');
          regularStudent.stack = '';
          regularStudent.willingCompanyProcess = false;
          regularStudent.willing30Days = '';
          regularStudent.acceptOffer = '';
          regularStudent.fullEffort = '';
          regularStudent.issues = '';
          regularStudent.needMost = '';
          regularStudent.studentType = regularStudent.isFrontend ? 'Frontend' : 'Regular';
          await regularStudent.save();
        }

        if (existingSplStudent) {
          const oldId = existingSplStudent._id;
          const newId = splReg._id;

          // Migrate references to the SplRegistration record
          await Attendance.updateMany({ studentId: oldId }, { $set: { studentId: newId } });
          await User.updateMany({ studentId: oldId }, { $set: { studentId: newId } });
          await Task.updateMany({ studentId: oldId }, { $set: { studentId: newId } });
          await DailyActivity.updateMany({ studentId: oldId }, { $set: { studentId: newId } });

          // Delete the separate SPL record from Student collection
          await Student.findByIdAndDelete(oldId);
        }
      }
    }

    // Clean up any remaining studentType: 'SPL' records in Student collection
    const splStudents = await Student.find({ studentType: 'SPL' });
    for (const s of splStudents) {
      console.log(`[Migration] Cleaning residual SPL student record: ${s.name} (${s._id})`);
      await Student.findByIdAndDelete(s._id);
    }

    console.log('[Migration] PlaceX student migration and SplRegistration restoration complete.');
  } catch (error) {
    console.error('[Migration] Critical failure during migration:', error);
  }
};

