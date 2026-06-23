import express from 'express';
import Student from '../models/Student.js';
import SplRegistration from '../models/SplRegistration.js';
import User from '../models/User.js';
import multer from 'multer';
import xlsx from 'xlsx';
import fs from 'fs';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });
const getSplIdentifiers = async () => {
    const spls = await SplRegistration.find({}, 'email mobile').lean();
    const splEmails = spls.map(s => s.email ? s.email.trim().toLowerCase() : '').filter(Boolean);
    const splMobiles = spls.map(s => s.mobile ? s.mobile.trim() : '').filter(Boolean);
    return { splEmails, splMobiles };
};

router.get('/', authMiddleware, async (req, res) => {
    try {
        const { search, status, degree, year, isFrontend, all, studentType, enrollment } = req.query;
        
        // 1. Build Student Query
        let query = {};
        if (enrollment) {
            if (enrollment === 'Regular') {
                query.enrollments = 'Regular';
            } else if (enrollment === 'SPL') {
                query.enrollments = 'SPL';
            } else if (enrollment === 'Regular+SPL') {
                query.enrollments = { $all: ['Regular', 'SPL'] };
            }
        } else if (studentType) {
            if (studentType === 'Regular') {
                query.enrollments = 'Regular';
            } else if (studentType === 'SPL') {
                query.enrollments = 'SPL';
            } else if (studentType === 'Frontend') {
                query.isFrontend = true;
            } else {
                query.studentType = studentType;
            }
        } else if (isFrontend === 'true') {
            query.isFrontend = true;
        } else if (isFrontend === 'false') {
            query.isFrontend = { $ne: true };
            query.enrollments = 'Regular';
        } else if (all !== 'true') {
            query.isFrontend = { $ne: true };
            query.enrollments = 'Regular';
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

        let students = await Student.find(query).lean();

        // 2. Fetch and Map SplRegistration records if we are looking for SPL students
        const includeSplRegs = !enrollment || enrollment === 'All' || enrollment === 'SPL';
        const isRestrictingToRegularOnly = enrollment === 'Regular' || studentType === 'Regular' || isFrontend === 'false' || all !== 'true';

        let splRegs = [];
        if (includeSplRegs && !isRestrictingToRegularOnly && !isFrontend) {
            let splQuery = {};
            if (search) {
                splQuery.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { mobile: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { batch: { $regex: search, $options: 'i' } }
                ];
            }
            if (status && status !== 'All') {
                splQuery.status = { $regex: new RegExp(`^${status}$`, 'i') };
            }
            if (degree && degree !== 'All') {
                splQuery.degree = { $regex: new RegExp(`^${degree}$`, 'i') };
            }
            if (year) {
                splQuery.batch = year;
            }

            const rawSplRegs = await SplRegistration.find(splQuery).lean();
            splRegs = rawSplRegs.map(r => ({
                ...r,
                studentType: 'SPL',
                enrollments: ['SPL'],
                currentStatus: r.status,
                passedOutYear: r.batch
            }));
        }

        // 3. Combine and Sort
        let combined = [...students, ...splRegs].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        res.json(combined);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students', error: error.message });
    }
});

// GET dashboard stats (protected)
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const { splEmails, splMobiles } = await getSplIdentifiers();
        const regularQuery = { isFrontend: { $ne: true }, studentType: { $ne: 'SPL' } };
        
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
        if (payload.studentType) {
            payload.isFrontend = payload.studentType === 'Frontend';
        }
        if (!payload.enrollments || payload.enrollments.length === 0) {
            payload.enrollments = [payload.studentType === 'SPL' ? 'SPL' : 'Regular'];
        }
        if (payload.enrollments.includes('Regular')) {
            payload.studentType = payload.isFrontend ? 'Frontend' : 'Regular';
        } else {
            payload.studentType = 'SPL';
        }

        const email = (payload.email || '').trim().toLowerCase();
        const mobile = (payload.mobile || '').trim();
        if (email || mobile) {
            const orConditions = [];
            if (email) orConditions.push({ email });
            if (mobile) orConditions.push({ mobile });
            
            const existing = await Student.findOne({ $or: orConditions });
            if (existing) {
                return res.status(409).json({ message: 'A student with the same email or mobile already exists.' });
            }
        }

        const student = new Student(payload);
        await student.save();
        res.status(201).json(student);
    } catch (error) {
        res.status(400).json({ message: 'Registration failed', error: error.message });
    }
});

router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const payload = { ...req.body };

        // 1. Check if ID belongs to SplRegistration
        const splRegExists = await SplRegistration.exists({ _id: id });
        if (splRegExists) {
            const reg = await SplRegistration.findByIdAndUpdate(id, payload, { returnDocument: 'after' });
            if (reg) {
                const targetEmail = (reg.email && reg.email.trim()) ? reg.email.trim().toLowerCase() : (reg.mobile ? reg.mobile.trim() : '');
                if (targetEmail) {
                    const user = await User.findOne({ studentId: reg._id });
                    if (user) {
                        user.name = reg.name;
                        user.email = targetEmail;
                        await user.save();
                    }
                }
            }
            return res.json(reg);
        }

        // 2. Otherwise update Student collection
        const currentStudent = await Student.findById(id);
        if (!currentStudent) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (payload.studentType) {
            payload.isFrontend = payload.studentType === 'Frontend';
        }
        
        if (payload.enrollments) {
            if (payload.enrollments.includes('Regular')) {
                payload.studentType = payload.isFrontend ? 'Frontend' : 'Regular';
            } else {
                payload.studentType = 'SPL';
            }
        }

        const email = payload.email !== undefined ? payload.email : currentStudent.email;
        const mobile = payload.mobile !== undefined ? payload.mobile : currentStudent.mobile;
        
        const targetEmail = (email && email.trim()) ? email.trim().toLowerCase() : (mobile ? mobile.trim() : '');

        const searchTerms = [];
        if (currentStudent.mobile) {
            searchTerms.push({ mobile: currentStudent.mobile.trim() });
        }
        if (currentStudent.email) {
            searchTerms.push({ email: currentStudent.email.trim().toLowerCase() });
        }
        if (payload.mobile) {
            searchTerms.push({ mobile: payload.mobile.trim() });
        }
        if (payload.email) {
            searchTerms.push({ email: payload.email.trim().toLowerCase() });
        }

        const samePersonStudents = searchTerms.length > 0 ? await Student.find({ $or: searchTerms }) : [];
        const samePersonStudentIds = samePersonStudents.map(s => s._id);

        if (targetEmail) {
            const conflictingUser = await User.findOne({
                email: targetEmail,
                studentId: { $nin: samePersonStudentIds }
            });
            if (conflictingUser) {
                return res.status(409).json({ message: 'The mobile number or email is already registered to another user account' });
            }
        }

        const student = await Student.findByIdAndUpdate(id, payload, { returnDocument: 'after' });
        if (student) {
            const updatedSearchTerms = [];
            if (student.mobile) {
                updatedSearchTerms.push({ mobile: student.mobile.trim() });
            }
            if (student.email) {
                updatedSearchTerms.push({ email: student.email.trim().toLowerCase() });
            }
            const allStudentsForPerson = await Student.find({ $or: updatedSearchTerms });
            const studentIds = allStudentsForPerson.map(s => s._id);

            const user = await User.findOne({ studentId: { $in: studentIds } });
            if (user) {
                user.name = student.name;
                if (targetEmail) {
                    user.email = targetEmail;
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
        const { id } = req.params;
        const splRegExists = await SplRegistration.exists({ _id: id });
        if (splRegExists) {
            await SplRegistration.findByIdAndDelete(id);
            return res.json({ message: 'Deleted successfully' });
        }

        const student = await Student.findByIdAndDelete(id);
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
        await SplRegistration.deleteMany({ _id: { $in: ids } });
        await Student.deleteMany({ _id: { $in: ids } });
        res.json({ message: 'Multiple records deleted' });
    } catch (error) {
        res.status(400).json({ message: 'Bulk deletion failed' });
    }
});

// POST Eligibility Checker (protected)
router.post('/eligible', authMiddleware, async (req, res) => {
    try {
        const { degrees, years, statuses, page = 1, limit = 10, fetchAll = false } = req.body;
        
        let studentQuery = { studentType: { $ne: 'SPL' } };
        let splQuery = {};

        if (degrees && degrees.length > 0) {
            const regexes = degrees.map(d => new RegExp(`^${d}$`, 'i'));
            studentQuery.degree = { $in: regexes };
            splQuery.degree = { $in: regexes };
        }
        if (statuses && statuses.length > 0) {
            const regexes = statuses.map(s => new RegExp(`^${s}$`, 'i'));
            studentQuery.currentStatus = { $in: regexes };
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
            isFrontend: isFrontend,
            studentType: isFrontend ? 'Frontend' : 'Regular'
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
