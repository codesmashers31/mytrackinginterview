import mongoose from 'mongoose';

const teamPerformanceSchema = new mongoose.Schema({
  teamId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Team', 
    required: true 
  },
  taskId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'TeamTask', 
    required: true 
  },
  marksObtained: { 
    type: Number, 
    required: true 
  },
  remarks: { 
    type: String, 
    default: '' 
  },
  markedAt: { 
    type: Date, 
    default: Date.now 
  },
  markedBy: { 
    type: String, 
    default: 'Admin' 
  }
}, { timestamps: true });

// Prevent duplicate marking for the same team and task
teamPerformanceSchema.index({ teamId: 1, taskId: 1 }, { unique: true });

export default mongoose.model('TeamPerformance', teamPerformanceSchema);
