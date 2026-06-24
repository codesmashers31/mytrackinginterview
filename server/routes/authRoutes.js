import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Student from '../models/Student.js';
import SplRegistration from '../models/SplRegistration.js';
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

const getPrimaryStudent = async (student) => {
  if (!student) return null;
  if (student.studentType !== 'SPL') {
    return student;
  }
  const matchQuery = [];
  if (student.mobile) {
    matchQuery.push({ mobile: student.mobile.trim() });
  }
  if (student.email) {
    matchQuery.push({ email: student.email.trim().toLowerCase() });
  }
  if (matchQuery.length > 0) {
    const primary = await Student.findOne({
      $or: matchQuery,
      studentType: { $ne: 'SPL' }
    });
    if (primary) {
      return primary;
    }
  }
  return student;
};

const ensureStudentAccount = async (emailOrMobile) => {
  if (!emailOrMobile) return;
  const normalized = emailOrMobile.trim().toLowerCase();

  // 1. Try finding in Student collection first
  const student = await Student.findOne({
    $or: [
      ...(normalized ? [{ email: normalized }] : []),
      { mobile: emailOrMobile.trim() }
    ]
  });

  if (student) {
    const primaryStudent = await getPrimaryStudent(student);
    if (!primaryStudent) return;

    const email = primaryStudent.email ? primaryStudent.email.trim().toLowerCase() : '';
    const mobile = primaryStudent.mobile ? primaryStudent.mobile.trim() : '';
    const expectedUserEmail = email ? email : mobile;

    if (expectedUserEmail) {
      const studentQuery = [];
      if (primaryStudent.mobile) studentQuery.push({ mobile: primaryStudent.mobile.trim() });
      if (primaryStudent.email) studentQuery.push({ email: primaryStudent.email.trim().toLowerCase() });
      const allStudentsForPerson = await Student.find({ $or: studentQuery });
      const studentIds = allStudentsForPerson.map(s => s._id);

      let user = await User.findOne({
        $or: [
          { studentId: { $in: studentIds } },
          { email: expectedUserEmail }
        ]
      });

      if (user) {
        let modified = false;
        if (!user.studentId || user.studentId.toString() !== primaryStudent._id.toString()) {
          user.studentId = primaryStudent._id;
          modified = true;
        }
        if (user.email !== expectedUserEmail) {
          user.email = expectedUserEmail;
          modified = true;
        }
        if (modified) {
          await user.save().catch(() => {});
        }
      } else {
        const password = mobile || email;
        try {
          user = new User({
            name: primaryStudent.name || 'Student',
            email: expectedUserEmail,
            password,
            role: 'student',
            studentId: primaryStudent._id
          });
          await user.save();
        } catch (saveErr) {
          if (saveErr.code !== 11000) throw saveErr;
        }
      }
    }
    return;
  }

  // 2. If not in Student collection, try finding in SplRegistration collection
  const splReg = await SplRegistration.findOne({
    $or: [
      ...(normalized ? [{ email: normalized }] : []),
      { mobile: emailOrMobile.trim() }
    ]
  });

  if (splReg) {
    const expectedUserEmail = splReg.email ? splReg.email.trim().toLowerCase() : splReg.mobile.trim();
    if (expectedUserEmail) {
      let user = await User.findOne({
        $or: [
          { studentId: splReg._id },
          { email: expectedUserEmail }
        ]
      });

      if (user) {
        let modified = false;
        if (!user.studentId || user.studentId.toString() !== splReg._id.toString()) {
          user.studentId = splReg._id;
          modified = true;
        }
        if (user.email !== expectedUserEmail) {
          user.email = expectedUserEmail;
          modified = true;
        }
        if (modified) {
          await user.save().catch(() => {});
        }
      } else {
        const password = splReg.mobile || splReg.email;
        try {
          user = new User({
            name: splReg.name || 'SPL Student',
            email: expectedUserEmail,
            password,
            role: 'student',
            studentId: splReg._id
          });
          await user.save();
        } catch (saveErr) {
          if (saveErr.code !== 11000) throw saveErr;
        }
      }
    }
  }
};

export const ensureAllStudentAccounts = async () => {
  try {
    const students = await Student.find();
    for (const student of students) {
      if (student.mobile || student.email) {
        await ensureStudentAccount(student.mobile || student.email);
      }
    }

    const splRegs = await SplRegistration.find();
    for (const spl of splRegs) {
      if (spl.mobile || spl.email) {
        await ensureStudentAccount(spl.mobile || spl.email);
      }
    }
  } catch (err) {
    console.error('Failed to sync student accounts:', err);
  }
};

router.get('/spl-students', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    await ensureAllStudentAccounts();
    const mergedStudents = await Student.find({ enrollments: 'SPL' }, '_id');
    const splRegs = await SplRegistration.find({}, '_id');
    const splIds = [
      ...mergedStudents.map(s => s._id),
      ...splRegs.map(r => r._id)
    ];

    const users = await User.find({ role: 'student', studentId: { $in: splIds } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load SPL student accounts', error: error.message });
  }
});

router.get('/task-students', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find({ role: 'student' }).lean();
    
    const studentIds = users.map(u => u.studentId).filter(Boolean);
    const studentsList = await Student.find({ _id: { $in: studentIds } }).lean();
    const splRegsList = await SplRegistration.find({ _id: { $in: studentIds } }).lean();
    
    const studentMap = new Map(studentsList.map(s => [s._id.toString(), s]));
    const splRegMap = new Map(splRegsList.map(r => [r._id.toString(), r]));

    const result = [];
    for (const user of users) {
      if (!user.studentId) continue;
      const student = studentMap.get(user.studentId.toString());
      const splReg = splRegMap.get(user.studentId.toString());
      
      if (!student && !splReg) continue;

      if (student) {
        const isPlaced = student.currentStatus && student.currentStatus.toLowerCase() === 'placed';
        if (isPlaced) continue;

        result.push({
          _id: user._id,
          studentId: user.studentId,
          name: student.name,
          email: student.email || user.email,
          mobile: student.mobile || '',
          batch: (student.isFrontend || student.studentType === 'Frontend') ? 'Frontend' : (student.batch ? student.batch.trim() : ''),
          grade: student.grade || '',
          stack: student.stack || '',
          type: student.enrollments?.includes('SPL') ? 'SPL Class Student' : 'Directory Student'
        });
      } else if (splReg) {
        const isPlaced = splReg.status && splReg.status.toLowerCase() === 'placed';
        if (isPlaced) continue;

        result.push({
          _id: user._id,
          studentId: user.studentId,
          name: splReg.name,
          email: splReg.email || user.email,
          mobile: splReg.mobile || '',
          batch: splReg.batch || '',
          grade: splReg.grade || '',
          stack: splReg.stack || '',
          type: 'SPL Class Student'
        });
      }
    }
    
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
    if (!email || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const inputVal = email.trim().toLowerCase();
    
    // First sync the student account if we can find them
    await ensureStudentAccount(email);

    // Try to find student in Student collection or SplRegistration collection
    const student = await Student.findOne({
      $or: [
        { email: inputVal },
        { mobile: email.trim() }
      ]
    });

    const splReg = await SplRegistration.findOne({
      $or: [
        { email: inputVal },
        { mobile: email.trim() }
      ]
    });

    let user = null;
    if (student) {
      const studentQuery = [];
      if (student.mobile) studentQuery.push({ mobile: student.mobile.trim() });
      if (student.email) studentQuery.push({ email: student.email.trim().toLowerCase() });
      const allStudentsForPerson = await Student.find({ $or: studentQuery });
      const studentIds = allStudentsForPerson.map(s => s._id);

      user = await User.findOne({
        $or: [
          { studentId: { $in: studentIds } },
          { email: inputVal },
          ...(student.mobile ? [{ email: student.mobile.trim() }] : []),
          ...(student.email ? [{ email: student.email.trim().toLowerCase() }] : [])
        ]
      });
    } else if (splReg) {
      user = await User.findOne({
        $or: [
          { studentId: splReg._id },
          { email: inputVal },
          ...(splReg.mobile ? [{ email: splReg.mobile.trim() }] : []),
          ...(splReg.email ? [{ email: splReg.email.trim().toLowerCase() }] : [])
        ]
      });
    } else {
      user = await User.findOne({ email: inputVal });
    }

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Access Denied: Invalid Credentials' });
    }

    let studentType = '';
    if (user.role === 'student' && user.studentId) {
      const studentRec = await Student.findById(user.studentId);
      const splRec = await SplRegistration.findById(user.studentId);
      
      if (studentRec) {
        const searchTerms = [];
        if (studentRec.mobile) searchTerms.push({ mobile: studentRec.mobile.trim() });
        if (studentRec.email) searchTerms.push({ email: studentRec.email.trim().toLowerCase() });
        
        if (searchTerms.length > 0) {
          const allRecs = await Student.find({ $or: searchTerms });
          const types = allRecs.map(r => r.studentType);
          if (types.includes('Frontend')) {
            studentType = 'Frontend';
          } else if (types.includes('Regular')) {
            studentType = 'Regular';
          } else {
            studentType = studentRec.studentType || 'Regular';
          }
        } else {
          studentType = studentRec.studentType || 'Regular';
        }
      } else if (splRec) {
        studentType = 'SPL';
      }
    }

    const token = signJwt({ id: user._id, email: user.email, role: user.role, name: user.name });
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        studentType 
      } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Auth server error', error: error.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    let grade = '';
    let studentProfile = null;

    if (user.role === 'student') {
      let student = null;
      if (user.studentId) {
        student = await Student.findById(user.studentId);
        if (!student) {
          const splReg = await SplRegistration.findById(user.studentId);
          if (splReg) {
            student = {
              ...splReg.toObject(),
              studentType: 'SPL',
              enrollments: ['SPL'],
              currentStatus: splReg.status,
              passedOutYear: splReg.passedOutYear || splReg.batch
            };
          }
        }
      } else {
        student = await Student.findOne({
          $or: [
            { email: user.email.trim().toLowerCase() },
            { mobile: user.email.trim() }
          ]
        });
        
        if (!student) {
          const splReg = await SplRegistration.findOne({
            $or: [
              { email: user.email.trim().toLowerCase() },
              { mobile: user.email.trim() }
            ]
          });
          if (splReg) {
            student = {
              ...splReg.toObject(),
              studentType: 'SPL',
              enrollments: ['SPL'],
              currentStatus: splReg.status,
              passedOutYear: splReg.passedOutYear || splReg.batch
            };
            user.studentId = splReg._id;
            await user.save();
          }
        } else {
          user.studentId = student._id;
          await user.save();
        }
      }

      if (student) {
        grade = student.grade || '';
        studentProfile = student;
      }
    }

    res.json({
      ...user.toObject(),
      grade,
      studentProfile
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user resume data
router.get('/my-resume', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'Only students have a resume' });
    }

    let student = null;
    if (user.studentId) {
      student = await Student.findById(user.studentId);
      if (!student) {
        student = await SplRegistration.findById(user.studentId);
      }
    } else {
      student = await Student.findOne({
        $or: [
          { email: user.email.trim().toLowerCase() },
          { mobile: user.email.trim() }
        ]
      });
      if (!student) {
        student = await SplRegistration.findOne({
          $or: [
            { email: user.email.trim().toLowerCase() },
            { mobile: user.email.trim() }
          ]
        });
      }
    }

    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }
    res.json(student.resumeData || {});
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching resume', error: error.message });
  }
});

// Update user resume data
router.put('/my-resume', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can update resumes' });
    }

    let student = null;
    let isSpl = false;

    if (user.studentId) {
      student = await Student.findById(user.studentId);
      if (!student) {
        student = await SplRegistration.findById(user.studentId);
        isSpl = true;
      }
    } else {
      student = await Student.findOne({
        $or: [
          { email: user.email.trim().toLowerCase() },
          { mobile: user.email.trim() }
        ]
      });
      if (!student) {
        student = await SplRegistration.findOne({
          $or: [
            { email: user.email.trim().toLowerCase() },
            { mobile: user.email.trim() }
          ]
        });
        isSpl = true;
      }
    }

    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    student.resumeData = req.body;
    await student.save();
    res.json({ message: 'Resume saved successfully', resumeData: student.resumeData });
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
