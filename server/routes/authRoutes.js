import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

const router = express.Router();

// POST /login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const admin = await Admin.findOne({ email });
        if (!admin || !(await admin.comparePassword(password))) {
            return res.status(401).json({ message: 'Access Denied: Invalid Credentials' });
        }
        
        const token = jwt.sign(
            { id: admin._id, email: admin.email },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );
        
        res.json({ token, admin: { name: admin.name, email: admin.email } });
    } catch (error) {
        res.status(500).json({ message: 'Auth server error' });
    }
});

// POST /change-password (PlaceTrack Settings Feature)
router.post('/change-password', async (req, res) => {
    const { currentPassword, newPassword, email } = req.body;
    try {
        const admin = await Admin.findOne({ email });
        if (!admin || !(await admin.comparePassword(currentPassword))) {
            return res.status(401).json({ message: 'Current password verification failed' });
        }
        
        admin.password = newPassword;
        await admin.save();
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Password update failed' });
    }
});

export default router;
