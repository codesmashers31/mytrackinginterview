import express from 'express';
import Student from '../models/Student.js';
import multer from 'multer';
import xlsx from 'xlsx';
import fs from 'fs';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// GET all students
router.get('/', async (req, res) => {
    try {
        const { search, status, degree, year } = req.query;
        let query = {};
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (status && status !== 'All') query.currentStatus = { $regex: new RegExp(`^${status}$`, 'i') };
        if (degree) query.degree = { $regex: new RegExp(`^${degree}$`, 'i') };
        if (year) query.passedOutYear = year;

        const students = await Student.find(query).sort({ createdAt: -1 });
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students', error: error.message });
    }
});

// GET dashboard stats
router.get('/stats', async (req, res) => {
    try {
        const total = await Student.countDocuments();
        
        // Use case-insensitive matching for robust counting
        const jobSeekers = await Student.countDocuments({ currentStatus: { $regex: /^job seeker$/i } });
        const placed = await Student.countDocuments({ currentStatus: { $regex: /^placed$/i } });
        const needToFilled = await Student.countDocuments({ currentStatus: { $regex: /^need to filled$/i } });
        const interviewProcess = await Student.countDocuments({ currentStatus: { $regex: /^interview process$/i } });
        
        const recent = await Student.find().sort({ createdAt: -1 }).limit(5);

        res.json({ total, jobSeekers, placed, needToFilled, interviewProcess, recent });
    } catch (error) {
        res.status(500).json({ message: 'Dashboard stats failure' });
    }
});

// POST new student
router.post('/', async (req, res) => {
    try {
        const student = new Student(req.body);
        await student.save();
        res.status(201).json(student);
    } catch (error) {
        res.status(400).json({ message: 'Registration failed', error: error.message });
    }
});

// PUT update student
router.put('/:id', async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
        res.json(student);
    } catch (error) {
        res.status(400).json({ message: 'Update failed' });
    }
});

// DELETE all students
router.delete('/all', async (req, res) => {
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

// DELETE student
router.delete('/:id', async (req, res) => {
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

// DELETE bulk students
router.post('/bulk-delete', async (req, res) => {
    try {
        const { ids } = req.body;
        await Student.deleteMany({ _id: { $in: ids } });
        res.json({ message: 'Multiple records deleted' });
    } catch (error) {
        res.status(400).json({ message: 'Bulk deletion failed' });
    }
});

// POST Eligibility Checker
router.post('/eligible', async (req, res) => {
    try {
        const { degrees, minYear, maxYear, statuses } = req.body;
        
        let query = {};
        if (degrees && degrees.length > 0) {
            query.degree = { $in: degrees.map(d => new RegExp(`^${d}$`, 'i')) };
        }
        if (statuses && statuses.length > 0) {
            query.currentStatus = { $in: statuses.map(s => new RegExp(`^${s}$`, 'i')) };
        }
        
        if (minYear || maxYear) {
            // Because passedOutYear is a string now, we do exact matches or simple string compares if needed.
            // Better to pull all matching string years. For simplicity, we just filter post-query if range is needed on strings,
            // or we try to cast. Let's do post-filter for safety.
        }

        let eligibleStudents = await Student.find(query);
        
        if (minYear || maxYear) {
            const min = minYear ? parseInt(minYear) : 0;
            const max = maxYear ? parseInt(maxYear) : 9999;
            eligibleStudents = eligibleStudents.filter(s => {
                const year = parseInt(s.passedOutYear);
                if (isNaN(year)) return false;
                return year >= min && year <= max;
            });
        }

        res.json({ count: eligibleStudents.length, students: eligibleStudents });
    } catch (error) {
        res.status(500).json({ message: 'Eligibility query failed' });
    }
});

// POST Bulk Import
router.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    try {
        const workbook = xlsx.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);
        
        const students = data.map(row => ({
            name: row.Name || row.name || 'Unknown',
            mobile: String(row.Mobile || row.mobile || ''),
            degree: row.Degree || row.degree || 'Not Provided',
            passedOutYear: String(row['Batch Year'] || row.Year || row['Passed Out Year'] || row.passedOutYear || 'Need to filled'),
            batch: String(row.Batch || row.batch || ''),
            currentStatus: row.Status || row.currentStatus || 'Need to filled',
            companyName: row.Company || row['Company Name'] || row.companyName || '',
            packageLpa: String(row.Package || row.packageLpa || ''),
            jobGetMode: row.Mode || row.jobGetMode || ''
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
