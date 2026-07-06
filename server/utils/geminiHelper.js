import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const getAIModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json'
    }
  });
};

const parseRobustJSON = (text) => {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/, '');
  }
  return JSON.parse(cleaned);
};

/**
 * Generate a personalized weekly learning path/roadmap based on student knowledge.
 */
export const generateRoadmap = async (profile) => {
  const model = getAIModel();
  
  const skillSummary = Object.entries(profile.skillLevel)
    .map(([skill, val]) => `${skill.toUpperCase()}: ${val}/5`)
    .join(', ');

  const prompt = `You are a senior tech mentor and placement coordinator.
Based on the student's profile and detailed current knowledge, generate a structured, personalized multi-week learning path (roadmap) in JSON format.

Student Profile:
- Name: ${profile.name}
- Degree: ${profile.degree}
- Department: ${profile.department}
- Passed Out Year: ${profile.passedOutYear}
- Tech Track: ${profile.techTrack}
- Preferred Language: ${profile.language}

Current Knowledge Profile:
- Academic CGPA: ${profile.cgpa || 'Not specified'}
- Coding Projects Experience: ${profile.codingProjectsExperience}
- Familiar Databases: ${(profile.familiarDatabases || []).join(', ') || 'None'}
- Problem Solving Level: ${profile.problemSolvingExperience}
- Certifications Completed: ${profile.certifications || 'None'}

Skills ratings: ${skillSummary}
Communication ratings: Speaking: ${profile.commLevel.speaking}/5, Listening: ${profile.commLevel.listening}/5, Reading: ${profile.commLevel.reading}/5, Writing: ${profile.commLevel.writing}/5
Aptitude ratings: Logical: ${profile.aptitudeLevel.logical}/5, Quantitative: ${profile.aptitudeLevel.quantitative}/5, Verbal: ${profile.aptitudeLevel.verbal}/5
Target Package: ${profile.targetPackage}

Determine their overall starting level ("Beginner", "Intermediate", or "Advanced"). Use their CGPA, project experience, and problem solving levels to scale the roadmap difficulty appropriately.

Generate a JSON object matching this schema:
{
  "level": "Beginner | Intermediate | Advanced",
  "stages": [
    {
      "title": "Stage Title (e.g., Core Frontend Programming)",
      "description": "Brief description",
      "weeks": [
        {
          "weekNumber": 1,
          "title": "Week 1 Topic Focus",
          "topics": [
            "Day 1: Topic A",
            "Day 2: Topic B",
            "Day 3: Topic C",
            "Day 4: Topic D",
            "Day 5: Topic E"
          ]
        }
      ]
    }
  ]
}

Provide exactly 5 days of topics per week. Ensure the output is valid JSON.`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  return parseRobustJSON(responseText);
};

/**
 * Generate daily study plan with all 6 required segments based on student knowledge levels.
 */
export const generateDailyPlan = async (profile, topicName, dayNumber, weekNumber) => {
  const model = getAIModel();

  const prompt = `You are a senior trainer and mentor. Generate a complete study, practice, and assignment plan for Day ${dayNumber} of Week ${weekNumber} in JSON format.
The generated content must be written in the preferred language: ${profile.language}. If the language is not English, explain all concepts, instructions, notes, and task explanations in that language, but keep programming keywords/syntax/code comments standard.

Details:
- Tech Track: ${profile.techTrack}
- Topic: ${topicName}

Knowledge Profile of Student:
- Coding Projects Experience: ${profile.codingProjectsExperience}
- Familiar Databases: ${(profile.familiarDatabases || []).join(', ') || 'None'}
- Problem Solving Level: ${profile.problemSolvingExperience}
- Current Level: ${profile.experience}

If the student is a Beginner (or has "Never practiced" problem solving / "None" projects), generate simpler, foundational explanations and easy tasks. If they are Advanced (or have "LeetCode regular" / "3+ Projects"), generate complex, deep-dive explanations, edge cases, and hard challenges.

Generate a JSON object matching this schema:
{
  "topicName": "${topicName}",
  "estimatedDuration": "5 Hours",
  "readingTopic": {
    "title": "A short, engaging reading topic title",
    "description": "Text describing what the student must read and comprehend in ${profile.language}",
    "duration": "30 minutes"
  },
  "commPractice": {
    "title": "Communication challenge title",
    "description": "Daily communication challenge details (e.g. self-introduction practice, HR mock prep, email writing, GD topics) in ${profile.language}",
    "type": "Reading | Speaking | GD | Email | Resume Summary",
    "duration": "20 minutes"
  },
  "techTopic": {
    "title": "${topicName} notes",
    "explanation": "Detailed conceptual explanation in ${profile.language}",
    "syntax": "Syntax template of the code",
    "examples": [
      {
        "code": "JavaScript/Java/Python snippet",
        "output": "Console output",
        "explanation": "Detailed explanation of what the snippet demonstrates"
      }
    ],
    "revisionNotes": "Revision summary bullet points",
    "commonMistakes": [
      { "mistake": "Mistake text", "fix": "Solution/Fix text" }
    ],
    "duration": "60 minutes"
  },
  "codingTask": {
    "title": "Practical Coding challenge",
    "description": "Description of the real-world coding task the student must complete in ${profile.language}",
    "difficulty": "Easy | Medium | Hard",
    "duration": "60 minutes"
  },
  "logicalTask": {
    "title": "Logical reasoning or programming puzzle",
    "description": "Analytical problem description (logical reasoning, quantitative aptitude, or problem solving code puzzle) in ${profile.language}",
    "inputOutput": "Sample inputs and expected outputs",
    "duration": "30 minutes"
  },
  "assignment": {
    "title": "Daily mini-project or assignment",
    "description": "Instructions for building a practical, mini-project in ${profile.language}",
    "objectives": [
      "Objective 1",
      "Objective 2"
    ],
    "expectedOutput": "Expected behavior and output details",
    "duration": "90 minutes"
  },
  "interviewQuestions": [
    // Generate exactly 15 questions in total: 5 HR questions and 10 Technical questions
    {
      "question": "Question text",
      "category": "Technical | HR",
      "hint": "Brief hint or bullet points for the answer"
    }
  ]
}

Ensure the output is valid JSON and only returns the JSON block. Do not include markdown code fence formatting.`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  return parseRobustJSON(responseText);
};

/**
 * Generate mock questions.
 */
export const generateMockQuestions = async (profile, mockType, topicHistory) => {
  const model = getAIModel();

  const prompt = `You are a technical interviewer.
Generate 5 mock interview questions and answers in JSON format.

Profile:
- Track: ${profile.techTrack}
- Level: ${profile.experience}
- Round: ${mockType}
- Completed Topics: ${topicHistory.join(', ')}

Schema:
{
  "questions": [
    {
      "question": "Question text",
      "category": "Technical | HR | Scenario | Project",
      "sampleAnswerHint": "Core points to look for in response"
    }
  ]
}

Ensure the output is valid JSON.`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  return parseRobustJSON(responseText);
};
