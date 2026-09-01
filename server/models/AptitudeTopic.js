import mongoose from 'mongoose';

const aptitudeTopicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Arithmetic', 'Algebra & Numbers', 'Commercial Math', 'Modern Math', 'Data Interpretation'],
    default: 'Arithmetic'
  },
  description: {
    type: String,
    default: ''
  },
  formulaeOrTips: [{
    type: String
  }],
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export const DEFAULT_APTITUDE_TOPICS = [
  { name: 'Number System', category: 'Algebra & Numbers', description: 'Divisibility, units digit, factors, remainder theorem, primes', order: 1 },
  { name: 'Simplification', category: 'Arithmetic', description: 'BODMAS, fractions, surds, indices, decimals', order: 2 },
  { name: 'Percentage', category: 'Commercial Math', description: 'Percentage change, successive percentages, price/consumption relations', order: 3 },
  { name: 'Profit and Loss', category: 'Commercial Math', description: 'Cost price, selling price, marked price, discounts, dishonest dealer', order: 4 },
  { name: 'Ratio and Proportion', category: 'Arithmetic', description: 'Mean proportion, third proportion, coin problems, dividing quantities', order: 5 },
  { name: 'Average', category: 'Arithmetic', description: 'Weighted average, replacement problems, batsman/bowling averages', order: 6 },
  { name: 'Time and Work', category: 'Arithmetic', description: 'Efficiency, work-wages, pipes and cisterns, alternate work', order: 7 },
  { name: 'Time, Speed and Distance', category: 'Arithmetic', description: 'Relative speed, trains, boats and streams, circular tracks, races', order: 8 },
  { name: 'Simple Interest', category: 'Commercial Math', description: 'Principal, annual interest rate, duration, maturity sum', order: 9 },
  { name: 'Compound Interest', category: 'Commercial Math', description: 'Compounding annually/half-yearly, difference between CI & SI', order: 10 },
  { name: 'Permutation and Combination', category: 'Modern Math', description: 'Arrangements, selections, word permutations, conditional groups', order: 11 },
  { name: 'Probability', category: 'Modern Math', description: 'Coins, dice, cards, conditional probability, independent events', order: 12 },
  { name: 'Problems on Ages', category: 'Arithmetic', description: 'Past, present, and future age ratios and equations', order: 13 },
  { name: 'Mixtures and Allegations', category: 'Arithmetic', description: 'Rule of alligation, milk-water dilutions, replacement cycles', order: 14 },
  { name: 'Data Interpretation', category: 'Data Interpretation', description: 'Bar graphs, pie charts, tabular sets, line charts, caselets', order: 15 },
  { name: 'Partnership', category: 'Commercial Math', description: 'Capital investment ratios, working/sleeping partners, profit division', order: 16 }
];

export default mongoose.model('AptitudeTopic', aptitudeTopicSchema);
