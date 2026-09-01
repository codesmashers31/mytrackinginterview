import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import {
  parseRobustJSON,
  validateAptitudeQuestions,
  validateAptitudeAnalysis,
  validateCommunicationEvaluation
} from './aiResponseValidator.js';

dotenv.config();

/**
 * Replaceable AI Provider interface implementation using Google Gemini.
 */
class GeminiAIProvider {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ WARNING: GEMINI_API_KEY is not configured in .env. AI generation will use structured mock fallback.');
      this.genAI = null;
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  getModel(jsonMode = true) {
    if (!this.genAI) {
      throw new Error('GEMINI_API_KEY is not configured on server.');
    }
    return this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: jsonMode ? { responseMimeType: 'application/json' } : {}
    });
  }

  /**
   * Generate high-quality structured quantitative/logical aptitude questions.
   */
  async generateAptitudeQuestions({ topic, difficulty = 'Medium', count = 5, studentTrack = 'Full Stack' }) {
    const prompt = `You are an expert IT campus recruitment and placement aptitude test designer.
Generate exactly ${count} multiple-choice aptitude practice questions on the topic "${topic}".

Difficulty Level: ${difficulty}
Target Audience: Engineering & IT graduates preparing for top software product/services companies (TCS NQT, Infosys, Zoho, Cognizant, Wipro, Accenture, Amazon, Startups).

Requirements:
1. Each question must be mathematically accurate, clear, and challenging according to ${difficulty} difficulty.
2. Provide exactly 4 options labeled "A", "B", "C", and "D".
3. Provide the exact correct option letter in "correctAnswer".
4. Provide a clear, step-by-step mathematical derivation and shortcut trick in "explanation".

JSON Format Schema:
[
  {
    "question": "Question statement with complete numerical values",
    "options": [
      { "id": "A", "text": "Option A value" },
      { "id": "B", "text": "Option B value" },
      { "id": "C", "text": "Option C value" },
      { "id": "D", "text": "Option D value" }
    ],
    "correctAnswer": "A | B | C | D",
    "explanation": "Step 1: Formula... Step 2: Calculation... Step 3: Result...",
    "topic": "${topic}",
    "difficulty": "${difficulty}"
  }
]

Return ONLY the JSON array. Do not wrap in markdown or prose.`;

    try {
      const model = this.getModel(true);
      const result = await model.generateContent(prompt);
      const parsed = parseRobustJSON(result.response.text());
      return validateAptitudeQuestions(parsed, topic, difficulty);
    } catch (err) {
      console.error('Gemini Aptitude Generation Error:', err);
      return this._fallbackAptitudeQuestions(topic, difficulty, count);
    }
  }

  /**
   * Analyze student's aptitude test performance.
   */
  async analyzeAptitudePerformance({ topic, difficulty, questions, score, totalQuestions, accuracy, timeTakenSeconds }) {
    const questionSummary = questions.map((q, i) => `Q${i+1}: Correct=${q.isCorrect ? 'YES' : 'NO'}, StudentAns=${q.studentAnswer || 'Skipped'}, CorrectAns=${q.correctAnswer}`).join('\n');
    const prompt = `You are a placement mentor analyzing a student's aptitude test performance.
Topic: ${topic}
Difficulty: ${difficulty}
Score: ${score}/${totalQuestions} (${accuracy}% accuracy)
Time Taken: ${timeTakenSeconds} seconds

Question Summary:
${questionSummary}

Provide an analytical diagnostic JSON feedback:
{
  "overallSummary": "2-3 sentences concise performance review praising accuracy and highlighting speed/concept gaps",
  "strengths": ["Key strength 1", "Key strength 2"],
  "weaknesses": ["Specific conceptual gap or calculation bottleneck 1", "Weakness 2"],
  "commonMistakes": ["Typical trap avoided or fallen into in this topic"],
  "recommendations": ["Actionable next practice advice, e.g., Practice 10 medium questions on X tomorrow"]
}

Return strictly valid JSON.`;

    try {
      const model = this.getModel(true);
      const result = await model.generateContent(prompt);
      const parsed = parseRobustJSON(result.response.text());
      return validateAptitudeAnalysis(parsed);
    } catch (err) {
      console.error('Gemini Aptitude Analysis Error:', err);
      return validateAptitudeAnalysis(null);
    }
  }

  /**
   * Generate an adaptive communication topic.
   */
  async generateCommunicationTopic({ category = 'Project & Technical', level = 'Intermediate', focusArea = 'Software Engineer' }) {
    const prompt = `You are a communication and corporate placement coach.
Generate 1 practical IT interview speaking topic for an aspiring software developer.

Category: ${category}
Level: ${level}
Focus Area: ${focusArea}

Output Schema:
{
  "title": "Clear, engaging topic title",
  "category": "${category}",
  "level": "${level}",
  "description": "2-sentence briefing on what the student should speak about and what recruiters evaluate",
  "keyPointsToCover": ["Point 1", "Point 2", "Point 3", "Point 4"],
  "recommendedDurationSeconds": 90,
  "vocabularyHints": ["Professional word 1", "Professional word 2", "Technical phrase 3"]
}

Return strictly valid JSON.`;

    try {
      const model = this.getModel(true);
      const result = await model.generateContent(prompt);
      const parsed = parseRobustJSON(result.response.text());
      return parsed;
    } catch (err) {
      console.error('Gemini Comm Topic Generation Error:', err);
      return {
        title: 'Walk Through Your Daily Problem-Solving Routine',
        category: 'Problem Solving',
        level: 'Intermediate',
        description: 'Explain how you approach complex coding problems from understanding requirements to testing edge cases.',
        keyPointsToCover: ['Requirement breakdown', 'Algorithm choice', 'Writing clean modular code', 'Testing edge cases'],
        recommendedDurationSeconds: 90,
        vocabularyHints: ['Systematic approach', 'Time complexity optimization', 'Edge case validation', 'Modular design']
      };
    }
  }

  /**
   * Multimodal speech transcription & communication evaluation.
   */
  async evaluateCommunicationSpeech({ audioBuffer, mimeType = 'audio/webm', transcriptText = '', topicTitle, topicContext = '' }) {
    const evaluationPrompt = `You are an elite corporate IT communication coach, English language specialist, and technical interviewer.
Analyze the following student's spoken answer for an IT software job placement interview.

Topic: "${topicTitle}"
Context: "${topicContext}"

Evaluation Criteria:
1. Grammar & Tense correctness (e.g. converting "I am completed project" -> "I have completed the project").
2. Fluency & Flow (smooth transitions, minimal hesitation).
3. Vocabulary & Professional Lexicon (replace basic slang/casual Tamil-English/Hinglish phrasing with corporate software terminology).
4. Clarity & Sentence Structure.
5. Professional Tone & Workplace Etiquette.
6. Technical Communication (how well technical concepts and reasoning are communicated).
7. Filler words identification ("um", "like", "actually", "basically", "you know", "ah").

Provide a constructive, highly student-friendly coaching report in JSON:
{
  "transcript": "Accurate transcribed spoken English text",
  "overallScore": 75,
  "scores": {
    "grammar": 72,
    "fluency": 78,
    "vocabulary": 70,
    "clarity": 80,
    "professionalTone": 75,
    "technicalCommunication": 76
  },
  "fillerWordCount": 3,
  "fillerWordsUsed": ["actually", "like", "basically"],
  "mistakes": [
    {
      "originalText": "Exact mistake or weak phrase spoken",
      "improvedVersion": "Polished, professional IT recruiter-approved version",
      "category": "Grammar | Tense | Vocabulary | Sentence Structure | Professional Tone | Clarity | Filler Words",
      "explanation": "Why this correction makes you sound like a confident software professional"
    }
  ],
  "positiveFeedback": ["What the student did great 1", "Positive attribute 2"],
  "areasOfImprovement": ["Constructive focus area 1", "Constructive focus area 2"],
  "idealAnswerOrExample": "A stellar 60-90 second sample response demonstrating ideal sentence flow",
  "coachingDrillRecommendation": "One specific 2-minute daily speaking exercise to master this weakness"
}

Return ONLY strictly valid JSON.`;

    try {
      const model = this.getModel(true);
      let contentParts = [];

      if (audioBuffer && audioBuffer.length > 0) {
        contentParts.push({
          inlineData: {
            mimeType: mimeType || 'audio/webm',
            data: audioBuffer.toString('base64')
          }
        });
      } else if (transcriptText) {
        contentParts.push(`Student Transcript: "${transcriptText}"`);
      } else {
        throw new Error('Neither audio nor transcript was provided for evaluation');
      }

      contentParts.push(evaluationPrompt);

      const result = await model.generateContent(contentParts);
      const parsed = parseRobustJSON(result.response.text());
      return validateCommunicationEvaluation(parsed, transcriptText);
    } catch (err) {
      console.error('Gemini Communication Evaluation Error:', err);
      return validateCommunicationEvaluation(null, transcriptText);
    }
  }

  // Fallback generator if AI API is unreachable
  _fallbackAptitudeQuestions(topic, difficulty, count) {
    const sampleBank = [
      {
        question: `If the cost price of 20 articles is equal to the selling price of 16 articles in ${topic}, what is the percentage profit or loss?`,
        options: [
          { id: 'A', text: '20% profit' },
          { id: 'B', text: '25% profit' },
          { id: 'C', text: '20% loss' },
          { id: 'D', text: '25% loss' }
        ],
        correctAnswer: 'B',
        explanation: 'Let CP of 1 article = Re 1. CP of 20 = Rs 20. SP of 16 = Rs 20 -> SP of 1 = 20/16 = Rs 1.25. Profit = (0.25/1) * 100 = 25%.',
        topic,
        difficulty
      },
      {
        question: `A and B can complete a work in 12 days and 18 days respectively. If they work on alternate days starting with A, in how many days will the work be completed?`,
        options: [
          { id: 'A', text: '14.5 days' },
          { id: 'B', text: '14.33 days' },
          { id: 'C', text: '15 days' },
          { id: 'D', text: '16 days' }
        ],
        correctAnswer: 'B',
        explanation: 'LCM of (12, 18) = 36 units. A = 3 units/day, B = 2 units/day. In 2 days = 5 units. In 14 days = 35 units. Remaining 1 unit by A in 1/3 day = 14.33 days.',
        topic,
        difficulty
      },
      {
        question: `A train traveling at 72 km/h crosses a 200 m long platform in 22 seconds. What is the length of the train?`,
        options: [
          { id: 'A', text: '220 m' },
          { id: 'B', text: '240 m' },
          { id: 'C', text: '200 m' },
          { id: 'D', text: '250 m' }
        ],
        correctAnswer: 'B',
        explanation: 'Speed = 72 * 5/18 = 20 m/s. Total distance = Speed * Time = 20 * 22 = 440 m. Train length = 440 - 200 = 240 m.',
        topic,
        difficulty
      },
      {
        question: `Two numbers are in the ratio 3 : 5. If 9 is subtracted from each, the new numbers are in the ratio 12 : 23. What is the smaller number?`,
        options: [
          { id: 'A', text: '27' },
          { id: 'B', text: '33' },
          { id: 'C', text: '49' },
          { id: 'D', text: '55' }
        ],
        correctAnswer: 'B',
        explanation: 'Let numbers be 3x and 5x. (3x - 9)/(5x - 9) = 12/23. Cross-multiplying: 23(3x - 9) = 12(5x - 9) -> 69x - 207 = 60x - 108 -> 9x = 99 -> x = 11. Smaller number = 3 * 11 = 33.',
        topic,
        difficulty
      },
      {
        question: `In how many different ways can the letters of the word 'CORPORATION' be arranged so that the vowels always come together?`,
        options: [
          { id: 'A', text: '840' },
          { id: 'B', text: '2880' },
          { id: 'C', text: '50400' },
          { id: 'D', text: '43200' }
        ],
        correctAnswer: 'C',
        explanation: 'Total letters = 11. Vowels = O, O, A, I, O (5 vowels: 3 O, 1 A, 1 I). Consonants = C, R, P, R, T, N (6 consonants: 2 R, 1 C, 1 P, 1 T, 1 N). Treating 5 vowels as 1 unit: 7 units arranged in 7!/2! ways. Vowels arranged among themselves in 5!/3! ways. Total = (7!/2!) * (5!/3!) = 2520 * 20 = 50400.',
        topic,
        difficulty
      }
    ];

    const results = [];
    for (let i = 0; i < count; i++) {
      const template = sampleBank[i % sampleBank.length];
      results.push({
        ...template,
        topic,
        difficulty
      });
    }
    return results;
  }
}

export const aiProvider = new GeminiAIProvider();
export default aiProvider;
