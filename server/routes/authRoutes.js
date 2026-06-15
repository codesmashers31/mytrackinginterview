import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import SplRegistration from '../models/SplRegistration.js';
import Student from '../models/Student.js';
import authMiddleware from '../middleware/authMiddleware.js';
import requireRole from '../middleware/roleMiddleware.js';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const router = express.Router();
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const signJwt = (payload) => jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

const ensureStudentAccountsFromSpl = async () => {
  const registrations = await SplRegistration.find();
  const students = [];

  for (const reg of registrations) {
    if (!reg.email) continue;
    const email = reg.email.trim().toLowerCase();
    let user = await User.findOne({ email });

    if (!user) {
      const password = reg.mobile && reg.mobile.trim() ? reg.mobile.trim() : email;
      user = new User({
        name: reg.name || email,
        email,
        password,
        role: 'student'
      });
      await user.save();
    }

    students.push({
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: reg.mobile || '',
      grade: reg.grade || '',
      status: reg.status || '',
      registrationId: reg._id
    });
  }

  return students;
};

const ensureStudentAccountsFromDirectory = async () => {
  const directoryStudents = await Student.find();

  for (const student of directoryStudents) {
    if (!student.mobile) continue;
    const mobile = student.mobile.trim();
    if (!mobile) continue;

    let user = await User.findOne({ email: mobile });
    if (!user) {
      user = new User({
        name: student.name || 'Student',
        email: mobile,
        password: mobile, // mobile as password
        role: 'student',
        studentId: student._id
      });
      await user.save();
    } else if (!user.studentId) {
      user.studentId = student._id;
      await user.save();
    }
  }
};

const ensureStudentAccount = async (emailOrMobile) => {
  if (!emailOrMobile) return;
  const normalized = emailOrMobile.trim().toLowerCase();

  // 1. Check if user already exists
  let user = await User.findOne({ email: normalized });
  if (user) return;

  // 2. Check if there is an SPL registration matching this email or mobile
  const reg = await SplRegistration.findOne({
    $or: [
      { email: normalized },
      { mobile: emailOrMobile.trim() }
    ]
  });

  if (reg) {
    const regEmail = reg.email.trim().toLowerCase();
    user = await User.findOne({ email: regEmail });
    if (!user) {
      const password = reg.mobile && reg.mobile.trim() ? reg.mobile.trim() : regEmail;
      user = new User({
        name: reg.name || regEmail,
        email: regEmail,
        password,
        role: 'student'
      });
      await user.save();
    }
    return;
  }

  // 3. Check if there is a Student directory record matching this mobile
  const student = await Student.findOne({ mobile: emailOrMobile.trim() });
  if (student) {
    const mobile = student.mobile.trim();
    user = new User({
      name: student.name || 'Student',
      email: mobile,
      password: mobile, // mobile as password
      role: 'student',
      studentId: student._id
    });
    await user.save();
    return;
  }
};

router.get('/spl-students', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const students = await ensureStudentAccountsFromSpl();
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load SPL student accounts', error: error.message });
  }
});

router.get('/task-students', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find({ role: 'student' }).lean();
    
    // 1. Gather all studentIds for bulk Student query
    const studentIds = users.map(u => u.studentId).filter(Boolean);
    const studentsList = await Student.find({ _id: { $in: studentIds } }).lean();
    const studentMap = new Map(studentsList.map(s => [s._id.toString(), s]));

    // 2. Gather emails of users without studentId for bulk SplRegistration query
    const splEmails = users.filter(u => !u.studentId).map(u => u.email.trim().toLowerCase());
    const splList = await SplRegistration.find({ email: { $in: splEmails } }).lean();
    const splMap = new Map(splList.map(r => [r.email.trim().toLowerCase(), r]));

    // 3. Assemble results in memory using O(1) map lookups
    const result = users.map(user => {
      let type = 'Directory Student';
      let batch = '';
      let grade = '';
      let mobile = '';
      
      if (user.studentId) {
        const student = studentMap.get(user.studentId.toString());
        if (student) {
          batch = student.batch ? student.batch.trim() : (student.passedOutYear || '');
          grade = student.grade || '';
          mobile = student.mobile || '';
          type = 'Directory Student';
        }
      } else {
        const splRegistration = splMap.get(user.email.trim().toLowerCase());
        if (splRegistration) {
          batch = splRegistration.batch ? splRegistration.batch.trim() : '';
          grade = splRegistration.grade || '';
          mobile = splRegistration.mobile || '';
          type = 'SPL Class Student';
        }
      }
      
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile,
        batch,
        grade,
        type
      };
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load students for task assignment', error: error.message });
  }
});

// Register a Coordination user (admin only)
router.post('/register-coordinator', authMiddleware, requireRole('admin'), async (req, res) => {
  console.log('Register coordinator payload:', req.body);
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  try {
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    const user = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: 'coordinator'
    });
    await user.save();
    res.status(201).json({ message: 'Coordinator account created' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create coordinator', error: error.message });
  }
});

// Register a Placement Support user (admin only)
router.post('/register-placement', authMiddleware, requireRole('admin'), async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  try {
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    const user = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: 'placement'
    });
    await user.save();
    res.status(201).json({ message: 'Placement Support account created' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create placement support account', error: error.message });
  }
});

// Get all coordinators (admin only)
router.get('/coordinators', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const coordinators = await User.find({ role: 'coordinator' }).select('name email createdAt');
    res.json(coordinators);
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch coordinators', error: error.message });
  }
});

// Get all placement support accounts (admin only)
router.get('/placements', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const placements = await User.find({ role: 'placement' }).select('name email createdAt');
    res.json(placements);
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch placement support accounts', error: error.message });
  }
});

// Update a user account (admin only)
router.put('/users/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email && email.trim().toLowerCase() !== user.email) {
      const existing = await User.findOne({ email: email.trim().toLowerCase() });
      if (existing) {
        return res.status(409).json({ message: 'Email already registered' });
      }
      user.email = email.trim().toLowerCase();
    }

    if (name) user.name = name.trim();
    if (password && password.trim() !== '') {
      user.password = password;
    }

    await user.save();
    res.json({ message: 'User account updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
});

// Delete a user account (admin only)
router.delete('/users/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (email) {
      await ensureStudentAccount(email);
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Access Denied: Invalid Credentials' });
    }

    const token = signJwt({ id: user._id, email: user.email, role: user.role, name: user.name });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Auth server error', error: error.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    let grade = '';
    let splRegistrationId = null;
    let studentProfile = null;

    if (user.role === 'student') {
      if (user.studentId) {
        const student = await Student.findById(user.studentId);
        if (student) {
          grade = student.grade || '';
          studentProfile = student.toObject();
        }
      } else {
        const splRegistration = await SplRegistration.findOne({ email: user.email.trim().toLowerCase() });
        if (splRegistration) {
          grade = splRegistration.grade || '';
          splRegistrationId = splRegistration._id;
          studentProfile = splRegistration.toObject();
        }
      }
    }

    res.json({
      ...user.toObject(),
      grade,
      splRegistrationId,
      studentProfile
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user resume data from Student (directory) or SPL Registration
router.get('/my-resume', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'Only students have a resume' });
    }

    if (user.studentId) {
      const student = await Student.findById(user.studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student record not found' });
      }
      res.json(student.resumeData || {});
    } else {
      const splRegistration = await SplRegistration.findOne({ email: user.email.trim().toLowerCase() });
      if (!splRegistration) {
        return res.status(404).json({ message: 'SPL Registration not found for this user' });
      }
      res.json(splRegistration.resumeData || {});
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching resume', error: error.message });
  }
});

// Update user resume data on Student (directory) or SPL Registration
router.put('/my-resume', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can update resumes' });
    }

    if (user.studentId) {
      const student = await Student.findByIdAndUpdate(
        user.studentId,
        { resumeData: req.body },
        { returnDocument: 'after' }
      );
      if (!student) {
        return res.status(404).json({ message: 'Student record not found' });
      }
      res.json({ message: 'Resume saved successfully', resumeData: student.resumeData });
    } else {
      const splRegistration = await SplRegistration.findOne({ email: user.email.trim().toLowerCase() });
      if (!splRegistration) {
        return res.status(404).json({ message: 'SPL Registration not found for this user' });
      }
      splRegistration.resumeData = req.body;
      await splRegistration.save();
      res.json({ message: 'Resume saved successfully', resumeData: splRegistration.resumeData });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error saving resume', error: error.message });
  }
});

// Parse resume data from uploaded PDF or TXT, or pasted raw text
router.post('/parse-resume', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can parse resumes' });
    }

    let textContent = '';

    if (req.file) {
      console.log('[ResumeParser] Received file:', req.file.originalname, 'Mime:', req.file.mimetype, 'Size:', req.file.size);
      const mimeType = req.file.mimetype;
      const originalName = req.file.originalname || '';
      const isPdf = mimeType === 'application/pdf' || originalName.toLowerCase().endsWith('.pdf');
      const isTxt = mimeType === 'text/plain' || originalName.toLowerCase().endsWith('.txt');
      
      if (isPdf) {
        try {
          const parsedPdf = await pdf(req.file.buffer);
          console.log('[ResumeParser] PDF parsed. Pages:', parsedPdf.numpages);
          textContent = parsedPdf.text || '';
          console.log('[ResumeParser] Extracted text length:', textContent.length, 'preview:', JSON.stringify(textContent.substring(0, 100)));
        } catch (pdfErr) {
          console.error('[ResumeParser] PDF parsing error:', pdfErr);
          return res.status(400).json({ message: 'Failed to extract text from PDF. Ensure the file is not corrupted or password protected.' });
        }
      } else if (isTxt) {
        textContent = req.file.buffer.toString('utf-8');
        console.log('[ResumeParser] TXT parsed. Length:', textContent.length);
      } else {
        return res.status(400).json({ message: 'Unsupported file type. Please upload a PDF or TXT file.' });
      }
    } else if (req.body.text) {
      textContent = req.body.text;
      console.log('[ResumeParser] Received raw text. Length:', textContent.length);
    } else {
      return res.status(400).json({ message: 'No file uploaded or raw text provided.' });
    }

    if (!textContent || textContent.trim().length === 0) {
      return res.status(400).json({ message: 'Could not extract or read any text content. If this is a PDF, ensure it is not scanned/image-only.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        message: 'Gemini API key is not configured on the server. Please add GEMINI_API_KEY to the server/.env file.' 
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });

    const prompt = `You are an expert resume parsing assistant. Extract information from the following resume text and format it EXACTLY according to the JSON schema below.

Resume Text:
"""
${textContent}
"""

JSON Schema:
{
  "basicInfo": {
    "name": "string (candidate full name)",
    "email": "string (candidate email address)",
    "phone": "string (candidate phone number)",
    "linkedin": "string (candidate LinkedIn profile link, empty string if not found)",
    "github": "string (candidate GitHub or portfolio link, empty string if not found)",
    "summary": "string (a concise professional summary or objective, write one based on their background if not explicitly present)"
  },
  "education": [
    {
      "degree": "string (degree/course, e.g. B.Tech Computer Science, High School, etc.)",
      "institution": "string (school, college, or university name)",
      "year": "string (year or year range, e.g. 2018 - 2022)",
      "score": "string (score, CGPA, or percentage, e.g. 8.5 CGPA or 85%, or empty string if not found)"
    }
  ],
  "experience": [
    {
      "role": "string (job title / role)",
      "company": "string (company name)",
      "duration": "string (duration, e.g. Jan 2020 - Present)",
      "description": "string (detailed description of activities/achievements, keep bullet points separated by newlines)"
    }
  ],
  "projects": [
    {
      "title": "string (project title)",
      "techStack": "string (comma-separated list of technologies used, e.g. React, Node.js, MongoDB)",
      "link": "string (project url or github repository, empty string if not found)",
      "description": "string (description of what the project does and key features)"
    }
  ],
  "skills": ["string (an array of skill names, e.g., ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'])"],
  "certifications": [
    {
      "title": "string (certification name)",
      "issuer": "string (issuing organization, e.g. AWS, Coursera)",
      "year": "string (year/date issued)",
      "link": "string (credential url, empty string if not found)"
    }
  ],
  "languages": ["string (an array of languages they speak, e.g. ['English', 'German', 'Spanish'])"],
  "awards": "string (awards or key achievements, keep bullet points separated by newlines)"
}

Return ONLY the raw JSON object. Do not wrap in markdown code block formatting (like \`\`\`json). Ensure all properties are present, and use empty strings or empty arrays if information is missing.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON output:', responseText);
      return res.status(500).json({ message: 'Failed to structure the extracted resume data. Please try again.' });
    }

    res.json(parsedData);
  } catch (error) {
    console.error('Error parsing resume:', error);
    res.status(500).json({ message: 'An internal server error occurred during resume parsing.', error: error.message });
  }
});

router.post('/register-student', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  try {
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: 'student'
    });
    await user.save();
    res.status(201).json({ message: 'Student account created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

router.get('/students', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('name email createdAt');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch student accounts', error: error.message });
  }
});

router.post('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password verification failed' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Password update failed', error: error.message });
  }
});

export default router;
