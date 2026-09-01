import CommunicationTopic, { DEFAULT_COMMUNICATION_TOPICS } from '../models/CommunicationTopic.js';
import CommunicationSession from '../models/CommunicationSession.js';
import StudentAIProgress from '../models/StudentAIProgress.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import aiProvider from '../services/aiProvider.js';

// Seed topics if collection is empty
const ensureDefaultTopics = async () => {
  const count = await CommunicationTopic.countDocuments();
  if (count === 0) {
    await CommunicationTopic.insertMany(DEFAULT_COMMUNICATION_TOPICS);
  }
};

/**
 * 1. Get all available communication topics
 */
export const getCommunicationTopics = async (req, res) => {
  try {
    await ensureDefaultTopics();
    const topics = await CommunicationTopic.find({ isActive: true }).sort({ category: 1, title: 1 });
    res.json(topics);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch communication topics', error: err.message });
  }
};

/**
 * 2. Generate a personalized adaptive communication topic
 */
export const generateCustomCommunicationTopic = async (req, res) => {
  try {
    const { category = 'Project & Technical', level = 'Intermediate' } = req.body;
    const studentId = req.user.id;

    const user = await User.findById(studentId).lean();
    let studentTrack = 'Software Engineering';
    if (user && user.studentId) {
      const student = await Student.findById(user.studentId).lean();
      if (student && student.studentType) studentTrack = `${student.studentType} Track`;
    }

    const aiTopic = await aiProvider.generateCommunicationTopic({
      category,
      level,
      focusArea: studentTrack
    });

    res.json(aiTopic);
  } catch (err) {
    console.error('Error generating communication topic:', err);
    res.status(500).json({ message: 'Failed to generate topic', error: err.message });
  }
};

/**
 * 3. Submit audio speech or transcript for AI Evaluation
 */
export const submitSpeechForEvaluation = async (req, res) => {
  try {
    const studentId = req.user.id;
    const {
      topicTitle,
      topicCategory = 'General',
      topicContext = '',
      transcriptText = '',
      durationSeconds = 0,
      audioBase64 = ''
    } = req.body;

    if (!topicTitle) {
      return res.status(400).json({ message: 'Topic title is required' });
    }

    // Process audio buffer from uploaded file (via multer) or direct base64
    let audioBuffer = null;
    let mimeType = 'audio/webm';

    if (req.file) {
      audioBuffer = req.file.buffer;
      mimeType = req.file.mimetype || 'audio/webm';
    } else if (audioBase64) {
      const cleanBase64 = audioBase64.replace(/^data:audio\/\w+;base64,/, '');
      audioBuffer = Buffer.from(cleanBase64, 'base64');
    }

    if (!audioBuffer && !transcriptText) {
      return res.status(400).json({ message: 'Either an audio recording or speech transcript text is required' });
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

    // Call AI Evaluation Provider
    const evaluation = await aiProvider.evaluateCommunicationSpeech({
      audioBuffer,
      mimeType,
      transcriptText,
      topicTitle,
      topicContext
    });

    // Save Session Record
    const session = new CommunicationSession({
      studentId,
      studentName,
      studentEmail,
      batch,
      track,
      topic: topicTitle,
      category: topicCategory,
      durationSeconds: Number(durationSeconds) || 0,
      transcript: evaluation.transcript || transcriptText,
      overallScore: evaluation.overallScore,
      scores: evaluation.scores,
      fillerWordCount: evaluation.fillerWordCount,
      fillerWordsUsed: evaluation.fillerWordsUsed,
      mistakes: evaluation.mistakes,
      positiveFeedback: evaluation.positiveFeedback,
      areasOfImprovement: evaluation.areasOfImprovement,
      idealAnswerOrExample: evaluation.idealAnswerOrExample,
      coachingDrillRecommendation: evaluation.coachingDrillRecommendation
    });

    await session.save();

    // Update Student Aggregated Communication Progress
    let progress = await StudentAIProgress.findOne({ studentId });
    if (!progress) {
      progress = new StudentAIProgress({ studentId });
    }

    const comm = progress.communication;
    comm.totalSessions += 1;
    comm.bestScore = Math.max(comm.bestScore, evaluation.overallScore);
    comm.averageOverallScore = Math.round(
      ((comm.averageOverallScore * (comm.totalSessions - 1)) + evaluation.overallScore) / comm.totalSessions
    );
    comm.averageGrammarScore = Math.round(
      ((comm.averageGrammarScore * (comm.totalSessions - 1)) + evaluation.scores.grammar) / comm.totalSessions
    );
    comm.averageFluencyScore = Math.round(
      ((comm.averageFluencyScore * (comm.totalSessions - 1)) + evaluation.scores.fluency) / comm.totalSessions
    );
    comm.averageVocabularyScore = Math.round(
      ((comm.averageVocabularyScore * (comm.totalSessions - 1)) + evaluation.scores.vocabulary) / comm.totalSessions
    );
    comm.averageProfessionalScore = Math.round(
      ((comm.averageProfessionalScore * (comm.totalSessions - 1)) + evaluation.scores.professionalTone) / comm.totalSessions
    );

    // Track score trend
    comm.recentScoreTrend.push({
      date: new Date(),
      score: evaluation.overallScore,
      topic: topicTitle
    });
    if (comm.recentScoreTrend.length > 15) {
      comm.recentScoreTrend = comm.recentScoreTrend.slice(-15);
    }

    await progress.save();

    res.status(201).json({
      session,
      evaluation
    });
  } catch (err) {
    console.error('Error submitting speech for communication evaluation:', err);
    res.status(500).json({ message: 'Failed to evaluate speech', error: err.message });
  }
};

/**
 * 4. Get student's previous communication sessions
 */
export const getMyCommunicationHistory = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { limit = 20 } = req.query;

    const sessions = await CommunicationSession.find({ studentId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 20)
      .lean();

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch communication history', error: err.message });
  }
};

/**
 * 5. Get student's communication progress analytics
 */
export const getMyCommunicationAnalytics = async (req, res) => {
  try {
    const studentId = req.user.id;

    let progress = await StudentAIProgress.findOne({ studentId }).lean();
    if (!progress) {
      progress = {
        communication: {
          totalSessions: 0,
          averageOverallScore: 0,
          bestScore: 0,
          averageGrammarScore: 0,
          averageFluencyScore: 0,
          averageVocabularyScore: 0,
          averageProfessionalScore: 0,
          recentScoreTrend: []
        }
      };
    }

    res.json(progress.communication);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch analytics', error: err.message });
  }
};

/**
 * 6. Admin endpoint to inspect all student communication practice sessions
 */
export const getAdminCommunicationOverview = async (req, res) => {
  try {
    const { search, batch, limit = 50 } = req.query;

    const filter = {};
    if (batch && batch !== 'All') filter.batch = batch;
    if (search) {
      filter.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { studentEmail: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } }
      ];
    }

    const sessions = await CommunicationSession.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 50)
      .lean();

    const totalSessions = await CommunicationSession.countDocuments();
    const aggregateData = await CommunicationSession.aggregate([
      {
        $group: {
          _id: null,
          avgOverall: { $avg: '$overallScore' },
          avgGrammar: { $avg: '$scores.grammar' },
          avgFluency: { $avg: '$scores.fluency' },
          avgProfessional: { $avg: '$scores.professionalTone' }
        }
      }
    ]);

    const stats = aggregateData[0] || { avgOverall: 0, avgGrammar: 0, avgFluency: 0, avgProfessional: 0 };

    res.json({
      sessions,
      stats: {
        totalSessions,
        avgOverall: Math.round(stats.avgOverall || 0),
        avgGrammar: Math.round(stats.avgGrammar || 0),
        avgFluency: Math.round(stats.avgFluency || 0),
        avgProfessional: Math.round(stats.avgProfessional || 0)
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch admin communication data', error: err.message });
  }
};
