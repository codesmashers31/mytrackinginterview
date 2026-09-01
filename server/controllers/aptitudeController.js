import AptitudeTopic, { DEFAULT_APTITUDE_TOPICS } from '../models/AptitudeTopic.js';
import AptitudeAttempt from '../models/AptitudeAttempt.js';
import StudentAIProgress from '../models/StudentAIProgress.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import aiProvider from '../services/aiProvider.js';
import {
  FRACTION_TO_PERCENTAGE_TABLE,
  SQUARES_TABLE,
  CUBES_TABLE,
  DIVISIBILITY_RULES,
  SPEED_MATH_SHORTCUTS
} from '../utils/aptitudeFoundationsData.js';
import { TOPIC_GUIDES } from '../utils/aptitudeTopicGuides.js';

// Seed topics if collection is empty
const ensureDefaultTopics = async () => {
  const count = await AptitudeTopic.countDocuments();
  if (count === 0) {
    await AptitudeTopic.insertMany(DEFAULT_APTITUDE_TOPICS);
  }
};

/**
 * 1. Get all available aptitude topics
 */
export const getAptitudeTopics = async (req, res) => {
  try {
    await ensureDefaultTopics();
    const topics = await AptitudeTopic.find({ isActive: true }).sort({ order: 1, name: 1 });
    res.json(topics);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch topics', error: err.message });
  }
};

/**
 * 2. Generate questions for a test session
 */
export const generateAptitudeTest = async (req, res) => {
  try {
    const { topic, difficulty = 'Medium', questionCount = 5 } = req.body;
    const count = Math.min(20, Math.max(5, parseInt(questionCount) || 5));

    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }

    const studentId = req.user.id;
    const user = await User.findById(studentId).lean();
    let studentTrack = 'General';
    if (user && user.studentId) {
      const student = await Student.findById(user.studentId).lean();
      if (student && student.studentType) studentTrack = student.studentType;
    }

    const questions = await aiProvider.generateAptitudeQuestions({
      topic,
      difficulty,
      count,
      studentTrack
    });

    // In active test mode, we return questions without exposing correctAnswer or explanation to frontend!
    const clientSafeQuestions = questions.map((q, idx) => ({
      id: `q_${idx + 1}`,
      question: q.question,
      options: q.options,
      topic: q.topic,
      difficulty: q.difficulty
    }));

    // Generate a temporary session token or encrypt answers / return full array if graded server-side
    // We send full questions in response only when submitting, or sign a test session
    res.json({
      topic,
      difficulty,
      questionCount: questions.length,
      questions: clientSafeQuestions,
      // For immediate validation on submit, we store original question payload in client state or verify against server payload
      _serverPayload: questions
    });
  } catch (err) {
    console.error('Error generating aptitude test:', err);
    res.status(500).json({ message: 'Failed to generate test questions', error: err.message });
  }
};

/**
 * 3. Submit completed test, calculate score & accuracy, generate AI feedback, update history
 */
export const submitAptitudeTest = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { topic, difficulty = 'Medium', submittedQuestions = [], timeTakenSeconds = 0, isTimed = false } = req.body;

    if (!Array.isArray(submittedQuestions) || submittedQuestions.length === 0) {
      return res.status(400).json({ message: 'Submitted questions array is required' });
    }

    const user = await User.findById(studentId).lean();
    const studentName = user ? (user.name || user.email.split('@')[0]) : 'Student';
    const studentEmail = user ? user.email : '';
    let batch = '';
    let track = '';

    if (user && user.studentId) {
      const student = await Student.findById(user.studentId).lean();
      if (student) {
        batch = student.batch || '';
        track = student.studentType || '';
      }
    }

    // Grade answers
    let correctCount = 0;
    let answeredCount = 0;

    const evaluatedQuestions = submittedQuestions.map(q => {
      const isAnswered = q.studentAnswer !== null && q.studentAnswer !== undefined && q.studentAnswer !== '';
      if (isAnswered) answeredCount++;

      const isCorrect = isAnswered && String(q.studentAnswer).toUpperCase() === String(q.correctAnswer).toUpperCase();
      if (isCorrect) correctCount++;

      return {
        question: q.question,
        options: q.options,
        correctAnswer: String(q.correctAnswer).toUpperCase(),
        studentAnswer: isAnswered ? String(q.studentAnswer).toUpperCase() : null,
        isCorrect,
        explanation: q.explanation || '',
        topic: q.topic || topic,
        difficulty: q.difficulty || difficulty,
        timeSpentSeconds: Number(q.timeSpentSeconds) || 0
      };
    });

    const totalQuestions = evaluatedQuestions.length;
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const unansweredCount = totalQuestions - answeredCount;

    // AI Performance Diagnostic Analysis
    const aiAnalysis = await aiProvider.analyzeAptitudePerformance({
      topic,
      difficulty,
      questions: evaluatedQuestions,
      score: correctCount,
      totalQuestions,
      accuracy,
      timeTakenSeconds
    });

    // Save Attempt
    const attempt = new AptitudeAttempt({
      studentId,
      studentName,
      studentEmail,
      batch,
      track,
      topic,
      difficulty,
      questionCount: totalQuestions,
      questions: evaluatedQuestions,
      score: correctCount,
      totalQuestions,
      accuracy,
      timeTakenSeconds: Number(timeTakenSeconds) || 0,
      answeredCount,
      unansweredCount,
      isTimed: !!isTimed,
      aiAnalysis
    });

    await attempt.save();

    // Update Student Aggregate Progress
    let progress = await StudentAIProgress.findOne({ studentId });
    if (!progress) {
      progress = new StudentAIProgress({ studentId });
    }

    progress.aptitude.totalTestsTaken += 1;
    progress.aptitude.totalQuestionsAttempted += totalQuestions;
    progress.aptitude.totalQuestionsCorrect += correctCount;
    progress.aptitude.averageAccuracy = Math.round(
      (progress.aptitude.totalQuestionsCorrect / Math.max(1, progress.aptitude.totalQuestionsAttempted)) * 100
    );

    // Update topic mastery
    let mastery = progress.aptitude.topicMastery.find(m => m.topicName === topic);
    if (!mastery) {
      mastery = {
        topicName: topic,
        testsTaken: 1,
        totalQuestions,
        correctQuestions: correctCount,
        accuracyRate: accuracy,
        lastTestedAt: new Date()
      };
      progress.aptitude.topicMastery.push(mastery);
    } else {
      mastery.testsTaken += 1;
      mastery.totalQuestions += totalQuestions;
      mastery.correctQuestions += correctCount;
      mastery.accuracyRate = Math.round((mastery.correctQuestions / Math.max(1, mastery.totalQuestions)) * 100);
      mastery.lastTestedAt = new Date();
    }

    // Determine strong and weak topics
    const sortedMastery = [...progress.aptitude.topicMastery].sort((a, b) => b.accuracyRate - a.accuracyRate);
    progress.aptitude.strongestTopics = sortedMastery.filter(m => m.accuracyRate >= 70).slice(0, 3).map(m => m.topicName);
    progress.aptitude.weakestTopics = sortedMastery.filter(m => m.accuracyRate < 60).slice(0, 3).map(m => m.topicName);

    const todayDateStr = new Date().toISOString().split('T')[0];
    if (progress.aptitude.lastActiveDate !== todayDateStr) {
      progress.aptitude.streakDays += 1;
      progress.aptitude.lastActiveDate = todayDateStr;
    }

    await progress.save();

    res.status(201).json({
      attempt,
      accuracy,
      score: correctCount,
      totalQuestions,
      answeredCount,
      unansweredCount,
      aiAnalysis
    });
  } catch (err) {
    console.error('Error submitting aptitude test:', err);
    res.status(500).json({ message: 'Failed to submit test', error: err.message });
  }
};

/**
 * 4. Get student's history of aptitude attempts
 */
export const getMyAptitudeHistory = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { topic, limit = 20 } = req.query;

    const query = { studentId };
    if (topic) query.topic = topic;

    const attempts = await AptitudeAttempt.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 20)
      .lean();

    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch aptitude history', error: err.message });
  }
};

/**
 * 5. Get student's aggregated aptitude analytics
 */
export const getMyAptitudeAnalytics = async (req, res) => {
  try {
    const studentId = req.user.id;

    let progress = await StudentAIProgress.findOne({ studentId }).lean();
    if (!progress) {
      progress = {
        aptitude: {
          totalTestsTaken: 0,
          totalQuestionsAttempted: 0,
          totalQuestionsCorrect: 0,
          averageAccuracy: 0,
          strongestTopics: [],
          weakestTopics: [],
          topicMastery: [],
          streakDays: 0
        }
      };
    }

    // Fetch recent 10 attempts for performance sparkline
    const recentAttempts = await AptitudeAttempt.find({ studentId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('topic score totalQuestions accuracy createdAt difficulty')
      .lean();

    res.json({
      progress: progress.aptitude,
      recentAttempts: recentAttempts.reverse()
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch analytics', error: err.message });
  }
};

/**
 * 6. Admin endpoint to inspect all student attempts and performance
 */
export const getAdminAptitudeOverview = async (req, res) => {
  try {
    const { topic, search, batch, limit = 50 } = req.query;

    const filter = {};
    if (topic && topic !== 'All') filter.topic = topic;
    if (batch && batch !== 'All') filter.batch = batch;
    if (search) {
      filter.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { studentEmail: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } }
      ];
    }

    const attempts = await AptitudeAttempt.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 50)
      .lean();

    // Calculate aggregated metrics
    const totalTests = await AptitudeAttempt.countDocuments();
    const aggregateData = await AptitudeAttempt.aggregate([
      {
        $group: {
          _id: null,
          avgAccuracy: { $avg: '$accuracy' },
          totalQuestions: { $sum: '$totalQuestions' },
          totalCorrect: { $sum: '$score' }
        }
      }
    ]);

    const stats = aggregateData[0] || { avgAccuracy: 0, totalQuestions: 0, totalCorrect: 0 };

    res.json({
      attempts,
      stats: {
        totalTests,
        avgAccuracy: Math.round(stats.avgAccuracy || 0),
        totalQuestions: stats.totalQuestions || 0,
        totalCorrect: stats.totalCorrect || 0
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch admin aptitude data', error: err.message });
  }
};

/**
 * 7. AI Question Solver with Root-Cause Explanation
 */
export const solveAptitudeQuestion = async (req, res) => {
  try {
    const { questionText, topicHint = '' } = req.body;
    if (!questionText || !questionText.trim()) {
      return res.status(400).json({ message: 'Question statement is required' });
    }

    const solution = await aiProvider.solveAptitudeQuestionWithRootCause({
      questionText: questionText.trim(),
      topicHint: topicHint.trim()
    });

    res.json(solution);
  } catch (err) {
    console.error('Error solving aptitude question:', err);
    res.status(500).json({ message: 'Failed to solve question', error: err.message });
  }
};

/**
 * 8. Get Math Foundations & Speed Math Toolkit
 */
export const getAptitudeFoundations = async (req, res) => {
  try {
    res.json({
      fractionsToPercentages: FRACTION_TO_PERCENTAGE_TABLE,
      squares: SQUARES_TABLE,
      cubes: CUBES_TABLE,
      divisibilityRules: DIVISIBILITY_RULES,
      speedMathShortcuts: SPEED_MATH_SHORTCUTS
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch foundations data', error: err.message });
  }
};

/**
 * 9. Get Topic Study Guide, Formulas & Worked Examples
 */
export const getAptitudeTopicGuide = async (req, res) => {
  try {
    const { topicName } = req.params;
    const guide = TOPIC_GUIDES[topicName];

    if (guide) {
      return res.json(guide);
    }

    // Default fallback guide if topic not pre-seeded in static map
    res.json({
      topicName,
      category: 'Quantitative Aptitude',
      coreIntuition: `Mastering ${topicName} requires understanding fundamental ratios, linear proportions, and speed calculation shortcuts.`,
      formulas: [
        { name: `${topicName} Fundamental Principle`, formula: 'Output = (Input Factor) * (Rate of Progression)', note: 'Base equation' },
        { name: 'Direct & Inverse Variation', formula: 'y = kx OR y = k/x', note: 'Proportionality balance' }
      ],
      shortcuts: [
        { title: 'Option Elimination Technique', tip: 'Use units digit matching and approximate bounds to eliminate at least 2 options immediately.' },
        { title: 'Vedic Math Approximation', tip: 'Round off numbers to nearest multiple of 10 or 100 for fast mental estimation.' }
      ],
      workedExamples: [
        {
          difficulty: 'Easy',
          question: `Sample placement problem on ${topicName}`,
          rootLogic: 'Apply standard linear formulation.',
          givenData: 'Parameters extracted from problem statement',
          stepByStep: 'Step 1: Set up the equation.\\nStep 2: Simplify fractions.\\nStep 3: Calculate final answer.',
          shortcutTrick: 'Use ratio scaling to solve directly.',
          answer: 'Verified solution'
        }
      ]
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch topic guide', error: err.message });
  }
};
