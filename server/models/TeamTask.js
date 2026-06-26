import mongoose from 'mongoose';

const teamTaskSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  maxMarks: { 
    type: Number, 
    default: 100 
  },
  dueDate: { 
    type: Date, 
    required: true 
  },
  associatedTeams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }]
}, { timestamps: true });

export default mongoose.model('TeamTask', teamTaskSchema);
