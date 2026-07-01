import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import LearningProfile from '../models/LearningProfile.js';
import LearningPath from '../models/LearningPath.js';
import DailyTopic from '../models/DailyTopic.js';
import DayProgress from '../models/DayProgress.js';
import Assessment from '../models/Assessment.js';
import MockInterview from '../models/MockInterview.js';
import ReadinessScore from '../models/ReadinessScore.js';
import AISettings from '../models/AISettings.js';
import Student from '../models/Student.js';
import SplRegistration from '../models/SplRegistration.js';
import User from '../models/User.js';
import { generateRoadmap, generateDailyPlan, generateMockQuestions } from '../utils/geminiHelper.js';

const router = express.Router();

// Helper to calculate overall readiness score based on weight system:
// 30% Tech, 20% Coding, 15% Comm, 15% Assignment, 10% Attendance, 10% Mock
const calculateReadiness = async (studentId) => {
  const profile = await LearningProfile.findOne({ studentId });
  const path = await LearningPath.findOne({ studentId });
  const progresses = await DayProgress.find({ studentId });
  const assessments = await Assessment.find({ studentId });
  const mocks = await MockInterview.find({ studentId, status: 'Completed' });

  // 1. Technical Skill Score (30%)
  // Base from onboarding ratings + average of passed assessments
  let techBase = 60;
  if (profile) {
    const ratings = Object.values(profile.skillLevel || {});
    if (ratings.length > 0) {
      const avg = ratings.reduce((acc, r) => acc + r, 0) / ratings.length;
      techBase = Math.round(avg * 20); // Scale to 100
    }
  }
  let assessmentAvg = 0;
  const passedAssessments = assessments.filter(a => a.status === 'Passed');
  if (passedAssessments.length > 0) {
    assessmentAvg = passedAssessments.reduce((acc, a) => acc + (a.score || 0), 0) / passedAssessments.length;
  }
  const techScore = Math.round(assessmentAvg ? (techBase * 0.4 + assessmentAvg * 0.6) : techBase);

  // 2. Coding Skill Score (20%)
  // Average of coding tasks completed + assignments completed
  let codingTasksCompleted = 0;
  let totalDays = progresses.length;
  progresses.forEach(p => {
    if (p.tasks.coding === 'Completed') codingTasksCompleted++;
  });
  const codingTaskRate = totalDays > 0 ? (codingTasksCompleted / totalDays) * 100 : 50;
  const codingScore = Math.round(codingTaskRate);

  // 3. Communication Score (15%)
  // Onboarding comm level + communication practice rate
  let commBase = 60;
  if (profile && profile.commLevel) {
    const commRatings = Object.values(profile.commLevel);
    commBase = Math.round((commRatings.reduce((acc, r) => acc + r, 0) / commRatings.length) * 20);
  }
  let commCompleted = 0;
  progresses.forEach(p => {
    if (p.tasks.comm === 'Completed') commCompleted++;
  });
  const commRate = totalDays > 0 ? (commCompleted / totalDays) * 100 : 50;
  const commScore = Math.round(commBase * 0.5 + commRate * 0.5);

  // 4. Assignment Score (15%)
  let assignmentCompleted = 0;
  progresses.forEach(p => {
    if (['Completed', 'Reviewed'].includes(p.tasks.assignment)) assignmentCompleted++;
  });
  const assignmentScore = totalDays > 0 ? Math.round((assignmentCompleted / totalDays) * 100) : 0;

  // 5. Attendance Score (10%)
  // Can be mapped from daily streak consistency + general logging days
  const streakBonus = path ? Math.min(100, path.dailyStreak * 10) : 0;
  const attendanceScore = Math.min(100, 80 + Math.round(streakBonus * 0.2));

  // 6. Mock Interview Score (10%)
  let mockScore = 50;
  if (mocks.length > 0) {
    mockScore = Math.round(mocks.reduce((acc, m) => acc + m.overallScore, 0) / mocks.length);
  }

  // Calculate Weighted Average
  const overallScore = Math.round(
    (techScore * 0.30) +
    (codingScore * 0.20) +
    (commScore * 0.15) +
    (assignmentScore * 0.15) +
    (attendanceScore * 0.10) +
    (mockScore * 0.10)
  );

  let status = 'Learning Stage';
  if (overallScore >= 90) status = 'Placement Ready';
  else if (overallScore >= 80) status = 'Interview Ready';
  else if (overallScore >= 60) status = 'Interview Preparation Stage';
  else if (overallScore >= 40) status = 'Learning Stage';
  else status = 'Needs Improvement';

  await ReadinessScore.findOneAndUpdate(
    { studentId },
    { 
      learningScore: techScore, 
      codingScore, 
      assignmentScore, 
      attendanceScore, 
      communicationScore: commScore, 
      mockScore, 
      overallScore, 
      status 
    },
    { new: true, upsert: true }
  );
};

const isAiEnabled = async () => {
  const settings = await AISettings.findOne();
  return settings ? settings.aiGenerationEnabled : true;
};

// ----------------------------------------------------
// STUDENT ENDPOINTS
// ----------------------------------------------------

/**
 * POST /api/ai/onboard
 * Submit onboarding preferences and generate custom roadmap
 */
router.post('/onboard', authMiddleware, async (req, res) => {
  try {
    const studentId = req.user.id;
    const {
      degree, passedOutYear, experience, currentStatus, language,
      techTrack, skillLevel, commLevel, aptitudeLevel, dailyAvailability, 
      targetRole, targetPackage, department, mobile, email,
      cgpa, codingProjectsExperience, familiarDatabases, problemSolvingExperience, certifications
    } = req.body;

    const user = await User.findById(studentId);
    if (!user) return res.status(404).json({ message: 'Student account not found' });

    // 1. Save learning profile
    const profile = await LearningProfile.findOneAndUpdate(
      { studentId },
      {
        studentId,
        name: user.name,
        mobile: mobile || user.mobile || '',
        email: email || user.email || '',
        degree,
        department: department || '',
        passedOutYear,
        experience,
        currentStatus,
        language,
        techTrack,
        skillLevel,
        commLevel: commLevel || { speaking: 3, listening: 3, reading: 3, writing: 3 },
        aptitudeLevel: aptitudeLevel || { logical: 3, quantitative: 3, verbal: 3 },
        dailyAvailability,
        targetRole,
        targetPackage,
        cgpa: cgpa || '',
        codingProjectsExperience: codingProjectsExperience || 'None',
        familiarDatabases: familiarDatabases || [],
        problemSolvingExperience: problemSolvingExperience || 'Never practiced',
        certifications: certifications || ''
      },
      { new: true, upsert: true }
    );

    // 2. Generate roadmap via Gemini
    let roadmapData;
    try {
      roadmapData = await generateRoadmap(profile);
    } catch (aiErr) {
      console.error('Gemini roadmap generation failed:', aiErr);
      return res.status(502).json({ message: 'AI roadmap generation failed. Please verify API key configs.' });
    }

    // 3. Save learning path
    const path = await LearningPath.findOneAndUpdate(
      { studentId },
      {
        studentId,
        level: roadmapData.level || 'Beginner',
        stages: roadmapData.stages,
        currentWeek: 1,
        currentDay: 1,
        dailyStreak: 0,
        weeklyStreak: 0,
        overallProgress: 0
      },
      { new: true, upsert: true }
    );

    // 4. Initialize readiness score
    await calculateReadiness(studentId);

    res.status(200).json({ profile, path });
  } catch (err) {
    res.status(500).json({ message: 'Server error during onboarding', error: err.message });
  }
});

/**
 * GET /api/ai/profile
 * Get onboarding status
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const profile = await LearningProfile.findOne({ studentId: req.user.id });
    if (!profile) {
      // Look up existing Student or SplRegistration data
      const user = await User.findById(req.user.id);
      let prefilledData = {
        degree: '',
        passedOutYear: '',
        experience: 'Fresher',
        currentStatus: 'Job Seeker',
        techTrack: 'MERN Stack',
        targetRole: '',
        department: '',
        mobile: '',
        email: ''
      };

      if (user) {
        prefilledData.email = user.email || '';
        prefilledData.mobile = user.mobile || '';
        
        if (user.studentId) {
          let studentRec = await Student.findById(user.studentId);
          if (!studentRec) {
            studentRec = await SplRegistration.findById(user.studentId);
          }

          if (studentRec) {
            prefilledData.degree = studentRec.degree || '';
            prefilledData.passedOutYear = studentRec.passedOutYear === 'Need to filled' ? '' : (studentRec.passedOutYear || '');
            prefilledData.currentStatus = studentRec.currentStatus === 'Need to filled' ? 'Job Seeker' : (studentRec.currentStatus || 'Job Seeker');
            
            // Map stack string to enum
            if (studentRec.stack) {
              const stackLower = studentRec.stack.toLowerCase();
              if (stackLower.includes('mern') || stackLower.includes('node') || stackLower.includes('react')) {
                prefilledData.techTrack = 'MERN Stack';
              } else if (stackLower.includes('java')) {
                prefilledData.techTrack = 'Java Full Stack';
              } else if (stackLower.includes('python')) {
                prefilledData.techTrack = 'Python Full Stack';
              } else if (stackLower.includes('data') || stackLower.includes('analyt')) {
                prefilledData.techTrack = 'Data Analytics';
              } else if (stackLower.includes('test') || stackLower.includes('qa')) {
                prefilledData.techTrack = 'Testing';
              } else if (stackLower.includes('design') || stackLower.includes('ux') || stackLower.includes('ui')) {
                prefilledData.techTrack = 'UI/UX';
              }
            }
          }
        }
      }

      return res.status(200).json({ onboarded: false, prefilledData });
    }
    res.status(200).json({ onboarded: true, profile });
  } catch (err) {
    res.status(500).json({ message: 'Server error loading profile', error: err.message });
  }
});

/**
 * GET /api/ai/roadmap
 * Get student's personalized roadmap
 */
router.get('/roadmap', authMiddleware, async (req, res) => {
  try {
    const path = await LearningPath.findOne({ studentId: req.user.id });
    if (!path) return res.status(404).json({ message: 'Roadmap not initialized' });
    res.status(200).json(path);
  } catch (err) {
    res.status(500).json({ message: 'Server error loading roadmap', error: err.message });
  }
});

/**
 * GET /api/ai/daily-plan
 * Get study plan details for a specific day and week.
 * Enforces locking rules (cannot fetch Day N plan if Day N-1 plan is not fully complete).
 */
router.get('/daily-plan', authMiddleware, async (req, res) => {
  try {
    const studentId = req.user.id;
    const path = await LearningPath.findOne({ studentId });
    if (!path) return res.status(404).json({ message: 'Learning roadmap has not been created yet' });

    // Handle optional target day query param
    const requestedDay = req.query.day ? Number(req.query.day) : path.currentDay;

    // Enforce Sequential Locking: 
    // Student can only read requestedDay if it is <= path.currentDay
    if (requestedDay > path.currentDay) {
      return res.status(403).json({ 
        message: `Day ${requestedDay} is currently locked. Complete all tasks for Day ${requestedDay - 1} to unlock it.`,
        locked: true
      });
    }

    // Determine week number and day index inside the week (1 to 6)
    // Day 1 to Day 5: Technical topics
    // Day 6: Weekend Assessment and Mock Interview
    const weekNumber = Math.ceil(requestedDay / 6);
    const dayInWeek = requestedDay % 6 === 0 ? 6 : requestedDay % 6;

    // Initialize or find DayProgress record
    let progress = await DayProgress.findOne({ studentId, dayNumber: requestedDay });
    if (!progress) {
      progress = new DayProgress({
        studentId,
        dayNumber: requestedDay,
        weekNumber,
        tasks: {
          reading: 'Pending',
          comm: 'Pending',
          tech: 'Pending',
          coding: 'Pending',
          logical: 'Pending',
          assignment: 'Pending'
        }
      });
      await progress.save();
    }

    let dailyTopic = null;

    if (dayInWeek <= 5) {
      // Find the topic name from LearningPath stages/weeks topics list
      let activeTopicName = 'Foundational Web Programming';
      let currentWeekObj = null;

      for (const stage of path.stages) {
        currentWeekObj = stage.weeks.find(w => w.weekNumber === weekNumber);
        if (currentWeekObj) break;
      }

      if (currentWeekObj && currentWeekObj.topics.length > 0) {
        const topicIndex = (dayInWeek - 1) % currentWeekObj.topics.length;
        activeTopicName = currentWeekObj.topics[topicIndex];
      }

      dailyTopic = await DailyTopic.findOne({ studentId, dayNumber: requestedDay });

      if (!dailyTopic) {
        const enabled = await isAiEnabled();
        if (!enabled) {
          return res.status(400).json({ message: 'AI Learning plan generation is temporarily disabled by administrator.' });
        }

        const profile = await LearningProfile.findOne({ studentId });
        if (!profile) return res.status(404).json({ message: 'Student profile not found' });

        // Generate full daily content via Gemini
        const plan = await generateDailyPlan(profile, activeTopicName, requestedDay, weekNumber);

        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 1); // 24 hours deadline
        deadline.setHours(20, 0, 0, 0); // 8:00 PM next day

        dailyTopic = new DailyTopic({
          studentId,
          dayNumber: requestedDay,
          weekNumber,
          topicName: activeTopicName,
          readingTopic: plan.readingTopic,
          commPractice: plan.commPractice,
          techTopic: plan.techTopic,
          codingTask: plan.codingTask,
          logicalTask: plan.logicalTask,
          assignment: {
            title: plan.assignment.title || `Assignment: ${activeTopicName}`,
            description: plan.assignment.description || `Build a practical application related to ${activeTopicName}`,
            objectives: plan.assignment.objectives || [],
            expectedOutput: plan.assignment.expectedOutput || '',
            duration: plan.assignment.expectedDuration || '90 minutes',
            deadline
          },
          interviewQuestions: plan.interviewPrep || []
        });

        await dailyTopic.save();
      }
    } else {
      // Day 6: Weekend Assessment and Mock Interview Day
      dailyTopic = {
        topicName: 'Weekend Assessment & Mock Interview',
        dayNumber: requestedDay,
        weekNumber,
        isAssessmentDay: true
      };
    }

    res.status(200).json({ 
      dailyTopic, 
      progress, 
      dayInWeek, 
      currentDay: path.currentDay, 
      currentWeek: path.currentWeek 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error loading daily plan', error: err.message });
  }
});

/**
 * POST /api/ai/toggle-task
 * Toggle the completion status of a daily task (Reading, Comm, Tech, Coding, Logical)
 */
router.post('/toggle-task', authMiddleware, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { dayNumber, taskKey, status } = req.body; // taskKey = 'reading' | 'comm' | 'tech' | 'coding' | 'logical'

    if (!['Pending', 'Completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const progress = await DayProgress.findOne({ studentId, dayNumber });
    if (!progress) return res.status(404).json({ message: 'Progress record not found' });

    progress.tasks[taskKey] = status;
    await progress.save();

    await calculateReadiness(studentId);

    res.status(200).json({ message: `Task status updated to ${status}`, progress });
  } catch (err) {
    res.status(500).json({ message: 'Server error updating task', error: err.message });
  }
});

/**
 * POST /api/ai/submit-assignment
 * Submit GitHub/deployed URL link for the daily assignment
 */
router.post('/submit-assignment', authMiddleware, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { dayNumber, submissionLink } = req.body;

    const progress = await DayProgress.findOne({ studentId, dayNumber });
    if (!progress) return res.status(404).json({ message: 'Progress record not found' });

    progress.submissionLink = submissionLink;
    progress.tasks.assignment = 'Submitted';
    await progress.save();

    await calculateReadiness(studentId);

    res.status(200).json({ message: 'Assignment submitted successfully', progress });
  } catch (err) {
    res.status(500).json({ message: 'Server error submitting assignment', error: err.message });
  }
});

/**
 * POST /api/ai/unlock-next-day
 * Unlocks the next day if the current active day reaches 100% completion
 */
router.post('/unlock-next-day', authMiddleware, async (req, res) => {
  try {
    const studentId = req.user.id;
    const path = await LearningPath.findOne({ studentId });
    if (!path) return res.status(404).json({ message: 'Roadmap not found' });

    const progress = await DayProgress.findOne({ studentId, dayNumber: path.currentDay });
    if (!progress) return res.status(404).json({ message: 'Active day progress not found' });

    // Validate that all 6 tasks are complete
    const { reading, comm, tech, coding, logical, assignment } = progress.tasks;
    const isCompleted = 
      reading === 'Completed' && 
      comm === 'Completed' && 
      tech === 'Completed' && 
      coding === 'Completed' && 
      logical === 'Completed' && 
      ['Submitted', 'Completed', 'Reviewed'].includes(assignment);

    if (!isCompleted) {
      return res.status(400).json({ message: 'Cannot unlock next day. Ensure all 6 daily tasks are complete/submitted.' });
    }

    // Dynamic streak logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (path.lastActiveDate) {
      const lastActive = new Date(path.lastActiveDate);
      lastActive.setHours(0, 0, 0, 0);
      const diffTime = Math.abs(today - lastActive);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        path.dailyStreak += 1;
      } else if (diffDays > 1) {
        path.dailyStreak = 1; // Reset streak if missed a day
      }
    } else {
      path.dailyStreak = 1;
    }
    path.lastActiveDate = new Date();

    // Increment Day progression
    path.currentDay += 1;

    // Check if we need to progress to the next week (after completing Day 6)
    const nextWeekNumber = Math.ceil(path.currentDay / 6);
    if (nextWeekNumber > path.currentWeek) {
      path.currentWeek = nextWeekNumber;
      path.weeklyStreak += 1;
    }

    // Re-calculate roadmap overall progress percentage
    let totalTopics = 0;
    path.stages.forEach(stage => {
      stage.weeks.forEach(week => {
        totalTopics += 6; // 5 days + 1 assessment day
      });
    });
    path.overallProgress = totalTopics > 0 ? Math.min(100, Math.round(((path.currentDay - 1) / totalTopics) * 100)) : 0;
    await path.save();

    await calculateReadiness(studentId);

    res.status(200).json({ message: 'Next day unlocked!', path });
  } catch (err) {
    res.status(500).json({ message: 'Server error during unlocking', error: err.message });
  }
});

/**
 * POST /api/ai/submit-assessment
 * Submit score details for the weekly assessment test
 */
router.post('/submit-assessment', authMiddleware, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { weekNumber, score, questions } = req.body;

    const status = score >= 60 ? 'Passed' : 'Failed';

    const assessment = await Assessment.findOneAndUpdate(
      { studentId, weekNumber },
      {
        studentId,
        weekNumber,
        score,
        status,
        questions,
        improvementFeedback: status === 'Passed' 
          ? 'Great progress this week! Continue maintaining the learning consistency.' 
          : 'Focus more on core technical programming topics and revision notes next week.'
      },
      { new: true, upsert: true }
    );

    // If assessment and mock interview are completed, mark the assignment (Day 6 placeholder) as complete
    const progress = await DayProgress.findOne({ studentId, dayNumber: weekNumber * 6 });
    if (progress) {
      progress.tasks.reading = 'Completed';
      progress.tasks.comm = 'Completed';
      progress.tasks.tech = 'Completed';
      progress.tasks.coding = 'Completed';
      progress.tasks.logical = 'Completed';
      progress.tasks.assignment = 'Completed';
      await progress.save();
    }

    await calculateReadiness(studentId);

    res.status(200).json({ message: 'Assessment submitted successfully', assessment });
  } catch (err) {
    res.status(500).json({ message: 'Server error saving assessment', error: err.message });
  }
});

/**
 * GET /api/ai/readiness
 * Get student readiness statistics
 */
router.get('/readiness', authMiddleware, async (req, res) => {
  try {
    const scores = await ReadinessScore.findOne({ studentId: req.user.id });
    const path = await LearningPath.findOne({ studentId: req.user.id });
    
    res.status(200).json({ 
      scores: scores || { learningScore: 0, codingScore: 0, assignmentScore: 0, attendanceScore: 0, communicationScore: 0, mockScore: 0, overallScore: 0, status: 'Learning Stage' },
      currentDay: path ? path.currentDay : 1,
      currentWeek: path ? path.currentWeek : 1,
      dailyStreak: path ? path.dailyStreak : 0,
      overallProgress: path ? path.overallProgress : 0
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error loading readiness score', error: err.message });
  }
});

/**
 * GET /api/ai/mocks
 * Get mock interview logs
 */
router.get('/mocks', authMiddleware, async (req, res) => {
  try {
    const mocks = await MockInterview.find({ studentId: req.user.id }).sort({ scheduledAt: -1 });
    res.status(200).json(mocks);
  } catch (err) {
    res.status(500).json({ message: 'Server error loading mock slots', error: err.message });
  }
});

/**
 * POST /api/ai/schedule-mock
 * Book a new mock slot
 */
router.post('/schedule-mock', authMiddleware, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { type, scheduledAt } = req.body;

    const profile = await LearningProfile.findOne({ studentId });
    if (!profile) return res.status(404).json({ message: 'Onboarding profile missing' });

    // Get topics history
    const completedTopics = await DailyTopic.find({ studentId }).select('topicName');
    const topicsList = completedTopics.map(t => t.topicName);

    // Generate custom questions via Gemini
    const questionPack = await generateMockQuestions(profile, type, topicsList);

    const questions = questionPack.questions.map(q => ({
      question: q.question,
      score: 0
    }));

    const mock = new MockInterview({
      studentId,
      type,
      scheduledAt: new Date(scheduledAt),
      status: 'Scheduled',
      questions
    });

    await mock.save();
    res.status(200).json({ message: 'Mock interview scheduled successfully', mock });
  } catch (err) {
    res.status(500).json({ message: 'Server error scheduling mock', error: err.message });
  }
});

// ----------------------------------------------------
// ADMIN ENDPOINTS
// ----------------------------------------------------

/**
 * GET /api/ai/admin/dashboard
 * Load administrative dashboard controls and rosters
 */
router.get('/admin/dashboard', authMiddleware, async (req, res) => {
  try {
    if (!['admin', 'coordinator', 'placement'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Restricted administrative access' });
    }

    // Load AI settings
    let settings = await AISettings.findOne();
    if (!settings) {
      settings = new AISettings({ aiGenerationEnabled: true, requireApproval: false });
      await settings.save();
    }

    // Roster of students with profiles and scores
    const profiles = await LearningProfile.find();
    const studentsReport = [];

    for (const p of profiles) {
      const path = await LearningPath.findOne({ studentId: p.studentId });
      const scoreObj = await ReadinessScore.findOne({ studentId: p.studentId });
      const completedCount = await DayProgress.countDocuments({ 
        studentId: p.studentId, 
        'tasks.assignment': { $in: ['Completed', 'Reviewed'] } 
      });

      studentsReport.push({
        studentId: p.studentId,
        name: p.name,
        track: p.techTrack,
        language: p.language,
        level: path ? path.level : 'Unassigned',
        progress: path ? path.overallProgress : 0,
        completedWeek: path ? path.currentWeek : 1,
        completedDay: path ? path.currentDay : 1,
        assignmentsCompleted: completedCount,
        readinessScore: scoreObj ? scoreObj.overallScore : 0,
        status: scoreObj ? scoreObj.status : 'Learning Stage'
      });
    }

    res.status(200).json({ settings, students: studentsReport });
  } catch (err) {
    res.status(500).json({ message: 'Server error loading admin console', error: err.message });
  }
});

/**
 * POST /api/ai/admin/toggle-engine
 * Toggle global AI generation state
 */
router.post('/admin/toggle-engine', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin accounts can configure global AI rules' });
    }
    const { enabled } = req.body;

    const settings = await AISettings.findOneAndUpdate(
      {},
      { aiGenerationEnabled: enabled },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: 'Engine configuration updated', settings });
  } catch (err) {
    res.status(500).json({ message: 'Server error setting engine configs', error: err.message });
  }
});

/**
 * GET /api/ai/admin/submissions
 * Get all submitted assignments for review
 */
router.get('/admin/submissions', authMiddleware, async (req, res) => {
  try {
    if (!['admin', 'coordinator'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Restricted administrative access' });
    }

    const submissions = await DayProgress.find({ 'tasks.assignment': 'Submitted' })
      .populate({ path: 'studentId', select: 'name email' })
      .sort({ updatedAt: -1 });

    res.status(200).json(submissions);
  } catch (err) {
    res.status(500).json({ message: 'Server error loading submissions list', error: err.message });
  }
});

/**
 * POST /api/ai/admin/review-assignment
 * Review and grade student assignment
 */
router.post('/admin/review-assignment', authMiddleware, async (req, res) => {
  try {
    if (!['admin', 'coordinator'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Restricted administrative access' });
    }

    const { submissionId, grade, mentorFeedback, status } = req.body;

    const progress = await DayProgress.findById(submissionId);
    if (!progress) return res.status(404).json({ message: 'Submission record not found' });

    progress.grade = grade;
    progress.mentorFeedback = mentorFeedback;
    progress.tasks.assignment = status; // e.g. "Completed" or "Rejected"
    await progress.save();

    await calculateReadiness(progress.studentId);

    res.status(200).json({ message: 'Assignment reviewed successfully', progress });
  } catch (err) {
    res.status(500).json({ message: 'Server error processing review', error: err.message });
  }
});

export default router;
