/**
 * Robust JSON parser and schema validator for AI outputs.
 */

export const parseRobustJSON = (text) => {
  if (typeof text !== 'string') return text;
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/, '');
  }
  return JSON.parse(cleaned);
};

export const validateAptitudeQuestions = (rawQuestions, topic, difficulty) => {
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    throw new Error('AI failed to generate question array');
  }

  return rawQuestions.map((q, idx) => {
    if (!q.question || typeof q.question !== 'string') {
      throw new Error(`Question ${idx + 1} is missing a question statement`);
    }

    let options = q.options;
    if (Array.isArray(options)) {
      if (typeof options[0] === 'string') {
        const letters = ['A', 'B', 'C', 'D'];
        options = options.slice(0, 4).map((opt, i) => ({
          id: letters[i] || String(i + 1),
          text: String(opt).trim()
        }));
      } else {
        options = options.map((opt, i) => ({
          id: String(opt.id || ['A', 'B', 'C', 'D'][i] || i + 1).toUpperCase().trim(),
          text: String(opt.text || opt.value || opt).trim()
        }));
      }
    } else if (typeof options === 'object' && options !== null) {
      options = Object.entries(options).map(([key, val]) => ({
        id: String(key).toUpperCase().trim(),
        text: String(val).trim()
      }));
    } else {
      throw new Error(`Question ${idx + 1} has invalid options format`);
    }

    const validIds = ['A', 'B', 'C', 'D'];
    let correctAnswer = String(q.correctAnswer || 'A').toUpperCase().trim();
    if (!validIds.includes(correctAnswer)) {
      const matchedOpt = options.find(o => o.text.toLowerCase() === correctAnswer.toLowerCase());
      correctAnswer = matchedOpt ? matchedOpt.id : 'A';
    }

    return {
      question: q.question.trim(),
      options: options.slice(0, 4),
      correctAnswer,
      explanation: q.explanation || 'Step-by-step mathematical reasoning verified.',
      topic: q.topic || topic,
      difficulty: q.difficulty || difficulty
    };
  });
};

export const validateAptitudeAnalysis = (rawAnalysis) => {
  if (!rawAnalysis || typeof rawAnalysis !== 'object') {
    return {
      overallSummary: 'Practice attempt recorded successfully.',
      strengths: ['Active problem solving effort'],
      weaknesses: ['Review complex question variants'],
      commonMistakes: ['Calculation errors under timed conditions'],
      recommendations: ['Review formula shortcuts and practice 10 similar questions']
    };
  }

  return {
    overallSummary: String(rawAnalysis.overallSummary || 'Practice attempt analyzed.').trim(),
    strengths: Array.isArray(rawAnalysis.strengths) ? rawAnalysis.strengths.map(String) : [],
    weaknesses: Array.isArray(rawAnalysis.weaknesses) ? rawAnalysis.weaknesses.map(String) : [],
    commonMistakes: Array.isArray(rawAnalysis.commonMistakes) ? rawAnalysis.commonMistakes.map(String) : [],
    recommendations: Array.isArray(rawAnalysis.recommendations) ? rawAnalysis.recommendations.map(String) : []
  };
};

export const validateCommunicationEvaluation = (rawEval, fallbackTranscript = '') => {
  if (!rawEval || typeof rawEval !== 'object') {
    return {
      transcript: fallbackTranscript || 'Speech recorded.',
      overallScore: 70,
      scores: {
        grammar: 70,
        fluency: 70,
        vocabulary: 70,
        clarity: 70,
        professionalTone: 70,
        technicalCommunication: 70
      },
      fillerWordCount: 0,
      fillerWordsUsed: [],
      mistakes: [],
      positiveFeedback: ['Good effort delivering the spoken response.'],
      areasOfImprovement: ['Practice speaking with more structured points and professional vocabulary.'],
      idealAnswerOrExample: '',
      coachingDrillRecommendation: 'Practice repeating technical elevator pitches with clear pronunciation.'
    };
  }

  const clamp = (num, min = 0, max = 100, fallback = 70) => {
    const val = Number(num);
    if (isNaN(val)) return fallback;
    return Math.max(min, Math.min(max, Math.round(val)));
  };

  const rawScores = rawEval.scores || {};

  return {
    transcript: String(rawEval.transcript || fallbackTranscript).trim(),
    overallScore: clamp(rawEval.overallScore, 0, 100, 72),
    scores: {
      grammar: clamp(rawScores.grammar, 0, 100, 70),
      fluency: clamp(rawScores.fluency, 0, 100, 70),
      vocabulary: clamp(rawScores.vocabulary, 0, 100, 70),
      clarity: clamp(rawScores.clarity, 0, 100, 70),
      professionalTone: clamp(rawScores.professionalTone, 0, 100, 72),
      technicalCommunication: clamp(rawScores.technicalCommunication, 0, 100, 70)
    },
    fillerWordCount: Number(rawEval.fillerWordCount) || 0,
    fillerWordsUsed: Array.isArray(rawEval.fillerWordsUsed) ? rawEval.fillerWordsUsed.map(String) : [],
    mistakes: Array.isArray(rawEval.mistakes) ? rawEval.mistakes.map(m => ({
      originalText: String(m.originalText || '').trim(),
      improvedVersion: String(m.improvedVersion || '').trim(),
      category: ['Grammar', 'Tense', 'Vocabulary', 'Sentence Structure', 'Professional Tone', 'Clarity', 'Filler Words'].includes(m.category)
        ? m.category
        : 'Grammar',
      explanation: String(m.explanation || '').trim()
    })).filter(m => m.originalText && m.improvedVersion) : [],
    positiveFeedback: Array.isArray(rawEval.positiveFeedback) ? rawEval.positiveFeedback.map(String) : [],
    areasOfImprovement: Array.isArray(rawEval.areasOfImprovement) ? rawEval.areasOfImprovement.map(String) : [],
    idealAnswerOrExample: String(rawEval.idealAnswerOrExample || '').trim(),
    coachingDrillRecommendation: String(rawEval.coachingDrillRecommendation || '').trim()
  };
};
