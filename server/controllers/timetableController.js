import Timetable from '../models/Timetable.js';
import Student from '../models/Student.js';

// Helper to generate unique slot IDs
const generateSlotId = () => 'slot_' + Math.random().toString(36).substr(2, 9);

// Helper function to build smart schedule slots
export const generateSmartSlots = ({
  sleepStartTime = '23:00',
  sleepEndTime = '06:00',
  workOrJobHours = 0,
  technicalClassHours = 2,
  communicationClassHours = 1,
  aptitudeClassHours = 1,
  selectedSubjects = ['JavaScript', 'React', 'SQL', 'Aptitude', 'Communication']
}) => {
  const slots = [];

  // 1. Sleep Block
  slots.push({
    id: generateSlotId(),
    title: 'Rest & Deep Sleep',
    category: 'Sleep',
    subject: 'Rest',
    startTime: sleepStartTime,
    endTime: sleepEndTime,
    durationMinutes: 420,
    targetDescription: 'Recharge body and mind for high-focus learning',
    daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  });

  // 2. Early Morning: Aptitude & Logical Reasoning (Fresh Mind)
  slots.push({
    id: generateSlotId(),
    title: 'Aptitude & Quantitative Problem Solving',
    category: 'Aptitude Practice',
    subject: 'Aptitude',
    startTime: '06:30',
    endTime: '07:45',
    durationMinutes: 75,
    targetDescription: 'Solve 15-20 Quant & Logical reasoning questions + Speed Math',
    daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  });

  // 3. Morning: Communication & English Speaking Practice
  slots.push({
    id: generateSlotId(),
    title: 'Communication & Verbal English Practice',
    category: 'Communication Practice',
    subject: 'Communication',
    startTime: '08:00',
    endTime: '09:00',
    durationMinutes: 60,
    targetDescription: 'Self-intro practice, JAM / Extempore topic recording, vocabulary drill',
    daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  });

  // 4. Morning Technical Class
  slots.push({
    id: generateSlotId(),
    title: 'Technical Masterclass & Core Lecture',
    category: 'Technical Class',
    subject: selectedSubjects[0] || 'Technical Training',
    startTime: '09:30',
    endTime: '11:30',
    durationMinutes: 120,
    targetDescription: 'Attend live lecture, take notes, understand architecture & concepts',
    daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  });

  // 5. Midday: Concept Review & Theory Revision
  const theorySub = selectedSubjects[1] || selectedSubjects[0] || 'Web Technologies';
  slots.push({
    id: generateSlotId(),
    title: `${theorySub} Theory & Documentation Revision`,
    category: 'Theory & Concepts',
    subject: theorySub,
    startTime: '11:45',
    endTime: '12:45',
    durationMinutes: 60,
    targetDescription: `Review official documentation, syntax notes, and interview flashcards for ${theorySub}`,
    daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  });

  // 6. Lunch & Routine Break
  slots.push({
    id: generateSlotId(),
    title: 'Lunch & Recharge Break',
    category: 'Break / Meals',
    subject: 'Nutrition',
    startTime: '13:00',
    endTime: '14:00',
    durationMinutes: 60,
    targetDescription: 'Healthy meal, light walk, and mental relaxation',
    daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  });

  // 7. Afternoon: Technical Hands-on Coding Practice
  const codeSub = selectedSubjects[0] || 'React';
  slots.push({
    id: generateSlotId(),
    title: `${codeSub} Hands-on Coding & Project Building`,
    category: 'Technical Practice',
    subject: codeSub,
    startTime: '14:30',
    endTime: '17:00',
    durationMinutes: 150,
    targetDescription: `Build interactive components, write clean modular code, and commit to GitHub`,
    daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  });

  // 8. Late Afternoon / Evening Work / College or Secondary Subject
  if (workOrJobHours > 0) {
    slots.push({
      id: generateSlotId(),
      title: 'Work / Part-time / College Commitment',
      category: 'Work / College',
      subject: 'Work',
      startTime: '17:00',
      endTime: '19:00',
      durationMinutes: workOrJobHours * 60,
      targetDescription: 'Professional or educational commitments',
      daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    });
  } else {
    const dbSub = selectedSubjects.find(s => ['SQL', 'Java', 'Python', 'Node.js', 'DSA'].includes(s)) || 'SQL';
    slots.push({
      id: generateSlotId(),
      title: `${dbSub} Problem Solving & Practice`,
      category: 'Technical Practice',
      subject: dbSub,
      startTime: '17:30',
      endTime: '19:00',
      durationMinutes: 90,
      targetDescription: `Execute queries, solve algorithm challenges, and practice interview code`,
      daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    });
  }

  // 9. Night: Daily Review, Mock Assessment & Tomorrow Planning
  slots.push({
    id: generateSlotId(),
    title: 'Daily Review, Mock Challenge & Task Logging',
    category: 'Technical Practice',
    subject: 'Daily Review',
    startTime: '20:30',
    endTime: '22:00',
    durationMinutes: 90,
    targetDescription: 'Log daily company applications, complete day activity notes, prepare for tomorrow',
    daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  });

  return slots;
};

// Generate Preview Timetable
export const generatePreviewTimetable = async (req, res) => {
  try {
    const {
      sleepHours = 7,
      sleepStartTime = '23:00',
      sleepEndTime = '06:00',
      workOrJobHours = 0,
      personalRoutineHours = 2,
      technicalClassHours = 2,
      communicationClassHours = 1,
      aptitudeClassHours = 1,
      selectedSubjects = ['JavaScript', 'React', 'SQL', 'Aptitude', 'Communication']
    } = req.body;

    const availableSelfStudyHours = Math.max(
      0,
      24 - (sleepHours + workOrJobHours + personalRoutineHours + technicalClassHours + communicationClassHours + aptitudeClassHours)
    );

    const slots = generateSmartSlots({
      sleepStartTime,
      sleepEndTime,
      workOrJobHours,
      technicalClassHours,
      communicationClassHours,
      aptitudeClassHours,
      selectedSubjects
    });

    res.json({
      sleepHours,
      workOrJobHours,
      personalRoutineHours,
      technicalClassHours,
      communicationClassHours,
      aptitudeClassHours,
      availableSelfStudyHours,
      selectedSubjects,
      slots
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate timetable preview', error: error.message });
  }
};

// Get current student's timetable + date-specific checklist
export const getMyTimetable = async (req, res) => {
  try {
    const studentId = req.user.id;
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];
    let timetable = await Timetable.findOne({ studentId });

    if (!timetable) {
      return res.json(null);
    }

    let dateChecklist = timetable.dailyChecklists.find(c => c.date === targetDate);

    // Determine slots for this date: if past date has a snapshot, preserve and use it!
    const dateSlots = (dateChecklist && dateChecklist.slotsSnapshot && dateChecklist.slotsSnapshot.length > 0)
      ? dateChecklist.slotsSnapshot
      : timetable.slots;

    const activeSlotsCount = dateSlots.filter(s => s.category !== 'Sleep').length;

    if (!dateChecklist) {
      dateChecklist = {
        date: targetDate,
        completedSlotIds: [],
        slotsSnapshot: timetable.slots,
        totalCount: activeSlotsCount,
        completedCount: 0,
        completionRate: 0,
        notes: ''
      };
    }

    res.json({
      ...timetable.toObject(),
      selectedDate: targetDate,
      dateSlots,
      todayChecklist: dateChecklist
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve timetable', error: error.message });
  }
};

// Save or Update Timetable (Preserves past history, updates today & future)
export const saveMyTimetable = async (req, res) => {
  try {
    const studentId = req.user.id;
    const studentName = req.user.name || 'Student';
    const studentEmail = req.user.email;

    let batch = '';
    if (req.user.studentId) {
      const studentDoc = await Student.findById(req.user.studentId).select('batch').lean();
      if (studentDoc && studentDoc.batch) {
        batch = studentDoc.batch;
      }
    }

    const {
      sleepHours = 7,
      sleepStartTime = '23:00',
      sleepEndTime = '06:00',
      workOrJobHours = 0,
      workDetails = '',
      personalRoutineHours = 2,
      technicalClassHours = 2,
      communicationClassHours = 1,
      aptitudeClassHours = 1,
      selectedSubjects = [],
      slots = []
    } = req.body;

    const availableSelfStudyHours = Math.max(
      0,
      24 - (sleepHours + workOrJobHours + personalRoutineHours + technicalClassHours + communicationClassHours + aptitudeClassHours)
    );

    // Ensure all slots have IDs
    const preparedSlots = (slots.length > 0 ? slots : generateSmartSlots({
      sleepStartTime,
      sleepEndTime,
      workOrJobHours,
      technicalClassHours,
      communicationClassHours,
      aptitudeClassHours,
      selectedSubjects
    })).map(s => ({
      ...s,
      id: s.id || generateSlotId()
    }));

    const todayStr = new Date().toISOString().split('T')[0];

    const timetable = await Timetable.findOne({ studentId });

    if (!timetable) {
      const newTimetable = new Timetable({
        studentId,
        studentName,
        studentEmail,
        batch,
        sleepHours,
        sleepStartTime,
        sleepEndTime,
        workOrJobHours,
        workDetails,
        personalRoutineHours,
        technicalClassHours,
        communicationClassHours,
        aptitudeClassHours,
        availableSelfStudyHours,
        selectedSubjects,
        slots: preparedSlots,
        dailyChecklists: [{
          date: todayStr,
          completedSlotIds: [],
          slotsSnapshot: preparedSlots,
          totalCount: preparedSlots.filter(s => s.category !== 'Sleep').length,
          completedCount: 0,
          completionRate: 0,
          notes: ''
        }],
        isActive: true
      });
      await newTimetable.save();
      return res.json(newTimetable);
    }

    // Update ongoing active fields
    timetable.studentName = studentName;
    timetable.studentEmail = studentEmail;
    if (batch) timetable.batch = batch;
    timetable.sleepHours = sleepHours;
    timetable.sleepStartTime = sleepStartTime;
    timetable.sleepEndTime = sleepEndTime;
    timetable.workOrJobHours = workOrJobHours;
    timetable.workDetails = workDetails;
    timetable.personalRoutineHours = personalRoutineHours;
    timetable.technicalClassHours = technicalClassHours;
    timetable.communicationClassHours = communicationClassHours;
    timetable.aptitudeClassHours = aptitudeClassHours;
    timetable.availableSelfStudyHours = availableSelfStudyHours;
    timetable.selectedSubjects = selectedSubjects;
    timetable.slots = preparedSlots;

    // Update today's checklist snapshot if it exists (or leave past dates untouched!)
    const todayChecklist = timetable.dailyChecklists.find(c => c.date === todayStr);
    if (todayChecklist) {
      todayChecklist.slotsSnapshot = preparedSlots;
      todayChecklist.totalCount = preparedSlots.filter(s => s.category !== 'Sleep').length;
      todayChecklist.completionRate = Math.round(((todayChecklist.completedSlotIds?.length || 0) / Math.max(1, todayChecklist.totalCount)) * 100);
    }

    await timetable.save();
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save timetable', error: error.message });
  }
};

// Check or Uncheck Slot for Specific Date
export const toggleSlotCheck = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { slotId, date } = req.body;

    if (!slotId) {
      return res.status(400).json({ message: 'Slot ID is required' });
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    const timetable = await Timetable.findOne({ studentId });

    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found. Please create one first.' });
    }

    let checklist = timetable.dailyChecklists.find(c => c.date === targetDate);

    // If checklist exists with snapshot, use it; otherwise lock in current active slots as snapshot
    const activeSlots = (checklist && checklist.slotsSnapshot && checklist.slotsSnapshot.length > 0)
      ? checklist.slotsSnapshot
      : timetable.slots;

    const nonSleepSlots = activeSlots.filter(s => s.category !== 'Sleep');
    const totalCount = Math.max(1, nonSleepSlots.length);

    if (!checklist) {
      checklist = {
        date: targetDate,
        completedSlotIds: [slotId],
        slotsSnapshot: timetable.slots,
        totalCount: totalCount,
        completedCount: 1,
        completionRate: Math.round((1 / totalCount) * 100),
        notes: ''
      };
      timetable.dailyChecklists.push(checklist);
    } else {
      if (!checklist.slotsSnapshot || checklist.slotsSnapshot.length === 0) {
        checklist.slotsSnapshot = timetable.slots;
      }
      const existsIndex = checklist.completedSlotIds.indexOf(slotId);
      if (existsIndex > -1) {
        checklist.completedSlotIds.splice(existsIndex, 1);
      } else {
        checklist.completedSlotIds.push(slotId);
      }
      checklist.totalCount = totalCount;
      checklist.completedCount = checklist.completedSlotIds.length;
      checklist.completionRate = Math.round((checklist.completedCount / totalCount) * 100);
    }

    await timetable.save();
    res.json({
      selectedDate: targetDate,
      todayChecklist: checklist,
      dailyChecklists: timetable.dailyChecklists
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update slot progress', error: error.message });
  }
};

// Reset/Delete Timetable
export const deleteMyTimetable = async (req, res) => {
  try {
    const studentId = req.user.id;
    await Timetable.findOneAndDelete({ studentId });
    res.json({ message: 'Timetable reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset timetable', error: error.message });
  }
};

// Admin: Get all student timetables with statistics
export const getAllStudentTimetables = async (req, res) => {
  try {
    const { batch, search } = req.query;
    const query = {};

    if (batch && batch !== 'All') {
      query.batch = batch;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { studentName: regex },
        { studentEmail: regex },
        { selectedSubjects: regex },
        { 'slots.title': regex }
      ];
    }

    const timetables = await Timetable.find(query).sort({ updatedAt: -1 }).lean();
    const todayStr = new Date().toISOString().split('T')[0];

    // Compute live progress stats for today
    const enriched = timetables.map(t => {
      const todayChecklist = t.dailyChecklists?.find(c => c.date === todayStr) || {
        completedCount: 0,
        totalCount: t.slots?.filter(s => s.category !== 'Sleep').length || 0,
        completionRate: 0
      };

      return {
        ...t,
        todayProgress: todayChecklist
      };
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve student timetables', error: error.message });
  }
};
