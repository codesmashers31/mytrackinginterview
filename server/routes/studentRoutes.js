import express from 'express';
import Student from '../models/Student.js';
import User from '../models/User.js';
import multer from 'multer';
import xlsx from 'xlsx';
import fs from 'fs';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.get('/', authMiddleware, async (req, res) => {
    try {
        const { search, status, degree, year, isFrontend, all, studentType } = req.query;
        let query = {};
        
        if (studentType) {
            query.studentType = studentType;
        } else if (isFrontend === 'true') {
            query.isFrontend = true;
        } else if (isFrontend === 'false') {
            query.isFrontend = { $ne: true };
        } else if (all !== 'true') {
            query.isFrontend = { $ne: true };
            
            // Exclude SPL students from the regular directory list
            const spls = await SplRegistration.find({}, 'email mobile').lean();
            const splEmails = spls.map(s => s.email ? s.email.trim().toLowerCase() : '').filter(Boolean);
            const splMobiles = spls.map(s => s.mobile ? s.mobile.trim() : '').filter(Boolean);
            
            if (splEmails.length > 0) {
                query.email = { $nin: splEmails };
            }
            if (splMobiles.length > 0) {
                query.mobile = { $nin: splMobiles };
            }
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { batch: { $regex: search, $options: 'i' } },
                { passedOutYear: { $regex: search, $options: 'i' } },
                { skills: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (status && status !== 'All') query.currentStatus = { $regex: new RegExp(`^${status}$`, 'i') };
        if (degree && degree !== 'All') query.degree = { $regex: new RegExp(`^${degree}$`, 'i') };
        if (year) query.passedOutYear = year;

        const students = await Student.find(query).sort({ createdAt: -1 });
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students', error: error.message });
    }
});

// GET dashboard stats (protected)
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const spls = await SplRegistration.find({}, 'email mobile').lean();
        const splEmails = spls.map(s => s.email ? s.email.trim().toLowerCase() : '').filter(Boolean);
        const splMobiles = spls.map(s => s.mobile ? s.mobile.trim() : '').filter(Boolean);

        const regularQuery = { isFrontend: { $ne: true } };
        
        if (splEmails.length > 0) {
            regularQuery.email = { $nin: splEmails };
        }
        if (splMobiles.length > 0) {
            regularQuery.mobile = { $nin: splMobiles };
        }

        const total = await Student.countDocuments(regularQuery);
        
        // Use case-insensitive matching for robust counting
        const jobSeekers = await Student.countDocuments({ ...regularQuery, currentStatus: { $regex: /^job seeker$/i } });
        const placed = await Student.countDocuments({ ...regularQuery, currentStatus: { $regex: /^placed$/i } });
        const needToFilled = await Student.countDocuments({ ...regularQuery, currentStatus: { $regex: /^need to filled$/i } });
        const inactiveUsers = await Student.countDocuments({ ...regularQuery, currentStatus: { $regex: /^inactive - not responded$/i } });
        const interviewProcess = await Student.countDocuments({ ...regularQuery, currentStatus: { $regex: /^interview process$/i } });
        
        const recent = await Student.find(regularQuery).sort({ createdAt: -1 }).limit(5);

        // Stats for Frontend track
        const frontendQuery = { isFrontend: true };
        const frontendTotal = await Student.countDocuments(frontendQuery);
        const frontendPlaced = await Student.countDocuments({ ...frontendQuery, currentStatus: { $regex: /^placed$/i } });
        const frontendJobSeekers = await Student.countDocuments({ ...frontendQuery, currentStatus: { $regex: /^job seeker$/i } });
        const recentFrontend = await Student.find(frontendQuery).sort({ createdAt: -1 }).limit(5);

        res.json({ 
            total, 
            jobSeekers, 
            placed, 
            needToFilled, 
            inactiveUsers, 
            interviewProcess, 
            recent,
            frontendTotal,
            frontendPlaced,
            frontendJobSeekers,
            recentFrontend
        });
    } catch (error) {
        res.status(500).json({ message: 'Dashboard stats failure' });
    }
});

router.post('/', async (req, res) => {
    try {
        const payload = { ...req.body };
        payload.isFrontend = payload.studentType === 'Frontend';
        const student = new Student(payload);
        await student.save();
        res.status(201).json(student);
    } catch (error) {
        res.status(400).json({ message: 'Registration failed', error: error.message });
    }
});

router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const payload = { ...req.body };
        if (payload.studentType) {
            payload.isFrontend = payload.studentType === 'Frontend';
        }
        const student = await Student.findByIdAndUpdate(req.params.id, payload, { returnDocument: 'after' });
        if (student) {
            const user = await User.findOne({ studentId: student._id });
            if (user) {
                user.name = student.name;
                if (student.studentType === 'SPL') {
                    user.email = student.email ? student.email.trim().toLowerCase() : student.mobile.trim();
                } else {
                    user.email = student.mobile.trim();
                }
                await user.save();
            }
        }
        res.json(student);
    } catch (error) {
        res.status(400).json({ message: 'Update failed', error: error.message });
    }
});

// DELETE all students (protected)
router.delete('/all', authMiddleware, async (req, res) => {
    try {
        const result = await Student.deleteMany({});
        res.json({
            message: 'All student records deleted successfully',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete all students', error: error.message });
    }
});

// DELETE student (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: 'Deletion failed', error: error.message });
    }
});

// DELETE bulk students (protected)
router.post('/bulk-delete', authMiddleware, async (req, res) => {
    try {
        const { ids } = req.body;
        await Student.deleteMany({ _id: { $in: ids } });
        res.json({ message: 'Multiple records deleted' });
    } catch (error) {
        res.status(400).json({ message: 'Bulk deletion failed' });
    }
});

import SplRegistration from '../models/SplRegistration.js';

// POST Eligibility Checker (protected)
router.post('/eligible', authMiddleware, async (req, res) => {
    try {
        const { degrees, years, statuses, page = 1, limit = 10, fetchAll = false } = req.body;
        
        let studentQuery = {};
        let splQuery = {};

        if (degrees && degrees.length > 0) {
            const regexes = degrees.map(d => new RegExp(`^${d}$`, 'i'));
            studentQuery.degree = { $in: regexes };
            splQuery.degree = { $in: regexes };
        }
        if (statuses && statuses.length > 0) {
            const regexes = statuses.map(s => new RegExp(`^${s}$`, 'i'));
            studentQuery.currentStatus = { $in: regexes };
            // For SPL students, we don't strictly filter by 'Job Seeker', they are automatically eligible.
        }
        
        // Exact year matching
        if (years && years.length > 0) {
             const stringYears = years.map(y => String(y));
             studentQuery.passedOutYear = { $in: stringYears };
             splQuery.batch = { $in: stringYears };
        }

        const students = await Student.find(studentQuery).lean();
        const spls = await SplRegistration.find(splQuery).lean();

        // Deduplicate using mobile and email
        const uniqueMobiles = new Set(students.map(s => s.mobile).filter(Boolean));
        const uniqueEmails = new Set(students.map(s => s.email).filter(Boolean));

        const normalizedSpls = spls.filter(spl => {
             if (spl.mobile && uniqueMobiles.has(spl.mobile)) return false;
             if (spl.email && uniqueEmails.has(spl.email)) return false;
             return true;
        }).map(spl => ({
             _id: spl._id,
             name: spl.name,
             mobile: spl.mobile,
             email: spl.email,
             degree: spl.degree,
             grade: spl.grade || '',
             passedOutYear: spl.batch,
             currentStatus: 'SPL Student (' + spl.status + ')',
             createdAt: spl.createdAt
        }));

        let combined = [...students, ...normalizedSpls];
        combined.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        const totalCount = combined.length;

        if (fetchAll) {
            return res.json({
                count: totalCount,
                students: combined,
                totalPages: 1,
                currentPage: 1
            });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const paginated = combined.slice(skip, skip + parseInt(limit));

        res.json({ 
            count: totalCount, 
            students: paginated,
            totalPages: Math.ceil(totalCount / parseInt(limit)),
            currentPage: parseInt(page)
        });
    } catch (error) {
        res.status(500).json({ message: 'Eligibility query failed', error: error.message });
    }
});

// POST Bulk Import (protected)
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    try {
        const workbook = xlsx.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);
        
        const isFrontend = req.query.isFrontend === 'true';

        const students = data.map(row => ({
            name: row.Name || row.name || 'Unknown',
            mobile: String(row.Mobile || row.mobile || ''),
            email: row.Email || row.email || '',
            degree: row.Degree || row.degree || (isFrontend ? 'Frontend' : 'Not Provided'),
            passedOutYear: String(row['Batch Year'] || row.Year || row['Passed Out Year'] || row.passedOutYear || 'Need to filled'),
            batch: String(row.Batch || row.batch || ''),
            currentStatus: row.Status || row.currentStatus || 'Need to filled',
            statusReason: row['Status Reason'] || row.statusReason || row.Reason || row.reason || '',
            others: row.Others || row.others || row['Other Notes'] || row.otherNotes || '',
            skills: row.Skills || row.skills || '',
            companyName: row.Company || row['Company Name'] || row.companyName || '',
            packageLpa: String(row.Package || row.packageLpa || ''),
            jobGetMode: row.Mode || row.jobGetMode || '',
            city: row.City || row.city || row.Town || row.town || '',
            isFrontend: isFrontend
        }));

        await Student.insertMany(students);
        fs.unlinkSync(req.file.path);
        res.json({ message: 'Bulk imported successfully', count: students.length });
    } catch (error) {
        fs.unlinkSync(req.file.path);
        res.status(500).json({ message: 'Import failed', error: error.message });
    }
});

export default router;
