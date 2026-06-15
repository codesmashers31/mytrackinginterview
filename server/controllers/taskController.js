import Task from '../models/Task.js';
import User from '../models/User.js';

const calculateOverallStatus = (questions) => {
  if (!Array.isArray(questions) || questions.length === 0) return 'Pending';
  
  const allCompleted = questions.every(q => q.status === 'Completed');
  if (allCompleted) return 'Completed';

  const anyBlocked = questions.some(q => ['Blocked', 'Doubt', 'Not Completed'].includes(q.status));
  if (anyBlocked) {
    const found = questions.map(q => q.status).find(s => ['Blocked', 'Doubt', 'Not Completed'].includes(s));
    return found || 'Blocked';
  }

  const anyInProgress = questions.some(q => q.status === 'In Progress' || q.status === 'Completed');
  if (anyInProgress) return 'In Progress';

  return 'Pending';
};

export const createTask = async (req, res) => {
  try {
    const { studentId, title, description, dueDate, questions } = req.body;
    if (!studentId || !title || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Student, title and at least one question are required' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Assigned student account not found' });
    }

    const normalizedQuestions = questions.map((item) => ({
      question: item.question || item,
      status: item.status || 'Pending',
      remarks: item.remarks || ''
    }));

    const task = new Task({
      studentId: student._id,
      studentName: student.name,
      studentEmail: student.email,
      title,
      description: description || '',
      dueDate: dueDate ? new Date(dueDate) : null,
      questions: normalizedQuestions,
      overallStatus: calculateOverallStatus(normalizedQuestions),
      assignedBy: req.user.name || req.user.email || 'Admin'
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Task creation failed', error: error.message });
  }
};

export const listTasks = async (req, res) => {
  try {
    const { studentId, status, studentEmail } = req.query;

    // Get all SPL student user IDs (role = 'student', studentId = null)
    const splUsers = await User.find({ role: 'student', studentId: { $eq: null } }).select('_id');
    const splUserIds = splUsers.map(u => u._id);

    const query = { studentId: { $in: splUserIds } };
    if (studentId) {
      if (splUserIds.map(id => id.toString()).includes(studentId.toString())) {
        query.studentId = studentId;
      } else {
        return res.json([]);
      }
    }
    if (studentEmail) query.studentEmail = studentEmail;
    if (status) query.overallStatus = status;

    const tasks = await Task.find(query).sort({ assignedAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to list tasks', error: error.message });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Could not retrieve task', error: error.message });
  }
};

export const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ studentId: req.user.id }).sort({ dueDate: 1, assignedAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch student tasks', error: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (req.user.role === 'student' && task.studentId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: you can only update your own tasks' });
    }

    const updates = {};
    if (req.user.role === 'admin') {
      const { title, description, dueDate, questions, overallStatus } = req.body;
      if (title) updates.title = title;
      if (description) updates.description = description;
      if (dueDate) updates.dueDate = new Date(dueDate);
      if (Array.isArray(questions)) {
        updates.questions = questions.map((item) => ({
          question: item.question || item,
          status: item.status || 'Pending',
          remarks: item.remarks || ''
        }));
      }
      updates.overallStatus = updates.questions ? calculateOverallStatus(updates.questions) : (overallStatus || task.overallStatus);
    } else if (req.user.role === 'student') {
      const { questions, overallStatus } = req.body;
      if (Array.isArray(questions)) {
        updates.questions = questions.map((item) => ({
          question: item.question || item.questionText || 'Question',
          status: item.status || 'Pending',
          remarks: item.remarks || ''
        }));
      }
      updates.overallStatus = updates.questions ? calculateOverallStatus(updates.questions) : (overallStatus || task.overallStatus);
    }

    updates.updatedAt = new Date();

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, updates, { returnDocument: 'after' });
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Task update failed', error: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: 'Could not delete task', error: error.message });
  }
};

export const getStudentTasks = async (req, res) => {
  try {
    const { studentId } = req.params;
    const tasks = await Task.find({ studentId }).sort({ assignedAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Could not load student tasks', error: error.message });
  }
};
