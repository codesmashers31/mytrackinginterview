import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  members: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student' 
  }],
  track: {
    type: String,
    enum: ['Regular', 'Frontend'],
    default: 'Regular'
  },
  batch: {
    type: String,
    default: ''
  }
}, { timestamps: true });

export default mongoose.model('Team', teamSchema);
