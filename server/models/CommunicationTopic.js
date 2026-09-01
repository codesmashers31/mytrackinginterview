import mongoose from 'mongoose';

const communicationTopicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['HR & Self Introduction', 'Project & Technical', 'Behavioral & Leadership', 'Workplace & Teamwork', 'Problem Solving'],
    default: 'HR & Self Introduction'
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  },
  description: { type: String, default: '' },
  keyPointsToCover: [{ type: String }],
  recommendedDurationSeconds: { type: Number, default: 90 },
  vocabularyHints: [{ type: String }],
  isAiGenerated: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const DEFAULT_COMMUNICATION_TOPICS = [
  {
    title: 'Tell Me About Yourself (IT Placement Pitch)',
    category: 'HR & Self Introduction',
    level: 'Beginner',
    description: 'Introduce yourself with academic background, core technical skills, and career objective in software engineering.',
    keyPointsToCover: ['Greeting & name', 'Education & graduation', 'Primary skills (Frontend/Backend/Databases)', 'Academic projects summary', 'Why you want this role'],
    recommendedDurationSeconds: 90,
    vocabularyHints: ['Passionate about', 'Specialized in', 'Hands-on experience', 'Problem solver', 'Aspiring software engineer']
  },
  {
    title: 'Explain Your Best Technical Project',
    category: 'Project & Technical',
    level: 'Intermediate',
    description: 'Explain an end-to-end full-stack or frontend application you developed, its architecture, and the problem it solved.',
    keyPointsToCover: ['Project purpose & target users', 'Tech stack chosen & reason', 'Key features built by you', 'Challenges faced & solutions', 'Outcome & live deployment'],
    recommendedDurationSeconds: 120,
    vocabularyHints: ['Architected', 'Implemented RESTful APIs', 'Seamless state management', 'Overcame bottleneck', 'Deployed on']
  },
  {
    title: 'Explain How React Works Under the Hood',
    category: 'Project & Technical',
    level: 'Intermediate',
    description: 'Explain Virtual DOM, component lifecycle, hooks, and reconciliation in simple professional English.',
    keyPointsToCover: ['Virtual DOM vs Real DOM', 'State & Props flow', 'Reconciliation & Diffing algorithm', 'Why React is efficient'],
    recommendedDurationSeconds: 90,
    vocabularyHints: ['Component tree', 'Re-rendering optimization', 'Declarative UI', 'Unidirectional data flow']
  },
  {
    title: 'Describing a Difficult Bug and How You Fixed It',
    category: 'Problem Solving',
    level: 'Advanced',
    description: 'Walk through a challenging bug you encountered in code, your debugging approach, and the root-cause fix.',
    keyPointsToCover: ['The symptom / error observed', 'Debugging methodology (logs, devtools, isolation)', 'The root cause identified', 'The robust fix & prevention'],
    recommendedDurationSeconds: 90,
    vocabularyHints: ['Root cause analysis', 'Reproduced consistently', 'Edge case scenario', 'Refactored logic', 'Regression tested']
  },
  {
    title: 'Handling Conflict or Disagreement in a Team Project',
    category: 'Behavioral & Leadership',
    level: 'Intermediate',
    description: 'Share an experience where you had a differing technical opinion in a team and how you resolved it constructively.',
    keyPointsToCover: ['Context & differing viewpoints', 'Open discussion & listening', 'Finding common ground with data/testing', 'Successful delivery outcome'],
    recommendedDurationSeconds: 90,
    vocabularyHints: ['Constructive dialogue', 'Collaborative mindset', 'Data-driven decision', 'Aligned with project goals']
  },
  {
    title: 'Why Should We Hire You Over Other Candidates?',
    category: 'HR & Self Introduction',
    level: 'Beginner',
    description: 'Pitch your unique combination of technical aptitude, fast learning, and consistency.',
    keyPointsToCover: ['Technical competence & practical projects', 'Work ethic & adaptability', 'Enthusiasm to contribute to team velocity', 'Long-term commitment'],
    recommendedDurationSeconds: 90,
    vocabularyHints: ['Quick learner', 'Consistent performer', 'Strong foundation', 'Proactive contributor']
  }
];

export default mongoose.model('CommunicationTopic', communicationTopicSchema);
