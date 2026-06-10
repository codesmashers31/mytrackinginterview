import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
// student route protection is handled inside the route file to allow public POST submissions
import authMiddleware from './middleware/authMiddleware.js';
import splRoutes from './routes/splRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import User from './models/User.js';
import emailRoutes from './routes/emailRoutes.js';
import dailyActivityRoutes from './routes/dailyActivityRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/spl-registration', splRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin', emailRoutes);
app.use('/api/daily-activities', dailyActivityRoutes);

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('PlaceTrack Database Linked: MongoDB Connected');
    try {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount === 0) {
        const defaultAdmin = new User({
          email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@placetrack.com',
          password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
          name: 'System Administrator',
          role: 'admin'
        });
        await defaultAdmin.save();
        console.log('Default Administrator Created: admin@placetrack.com / admin123');
      }
    } catch (seedErr) {
      console.error('Failed to seed default admin:', seedErr);
    }
  })
  .catch((err) => console.log('Database Link Failure:', err));

app.listen(PORT, () => {
  console.log(`PlaceTrack Gateway active on port ${PORT}`);
});
