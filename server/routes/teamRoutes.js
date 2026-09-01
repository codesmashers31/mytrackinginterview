import express from 'express';
import Team from '../models/Team.js';
import TeamTask from '../models/TeamTask.js';
import TeamPerformance from '../models/TeamPerformance.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import SplRegistration from '../models/SplRegistration.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper to get student record ID for logged-in user
const getStudentIdFromUser = async (user) => {
  if (user.role !== 'student') return null;
  const userRecord = await User.findById(user.id);
  if (userRecord && userRecord.studentId) {
    return userRecord.studentId;
  }
  // Fallback: search Student by email or mobile matching user's email
  const emailVal = user.email ? user.email.trim().toLowerCase() : '';
  const student = await Student.findOne({
    $or: [
      { email: emailVal },
      { mobile: user.email }
    ]
  });
  if (student) return student._id;

  const splReg = await SplRegistration.findOne({
    $or: [
      { email: emailVal },
      { mobile: user.email }
    ]
  });
  return splReg ? splReg._id : null;
};

// Helper to populate team members from both Student and SplRegistration collections
const populateTeamMembers = async (teamsOrTeam) => {
  if (!teamsOrTeam) return teamsOrTeam;
  const isArray = Array.isArray(teamsOrTeam);
  const teams = isArray ? teamsOrTeam : [teamsOrTeam];

  // Gather all unique member ObjectIds/IDs
  const allMemberIds = [];
  teams.forEach(team => {
    if (team.members && team.members.length > 0) {
      team.members.forEach(id => {
        if (id && !allMemberIds.includes(String(id))) {
          allMemberIds.push(id);
        }
      });
    }
  });

  if (allMemberIds.length === 0) {
    return teamsOrTeam;
  }

  // Fetch from Student collection
  const students = await Student.find({ _id: { $in: allMemberIds } }).lean();
  const studentMap = {};
  students.forEach(s => {
    studentMap[String(s._id)] = s;
  });

  // Fetch missing from SplRegistration collection
  const missingIds = allMemberIds.filter(id => !studentMap[String(id)]);
  if (missingIds.length > 0) {
    const splRegs = await SplRegistration.find({ _id: { $in: missingIds } }).lean();
    splRegs.forEach(r => {
      studentMap[String(r._id)] = {
        ...r,
        studentType: 'SPL',
        enrollments: ['SPL'],
        currentStatus: r.status,
        passedOutYear: r.passedOutYear || r.batch
      };
    });
  }

  // Map populated members back to each team
  const populatedTeams = teams.map(team => {
    const teamObj = typeof team.toObject === 'function' ? team.toObject() : team;
    teamObj.members = (teamObj.members || [])
      .map(id => studentMap[String(id)] || null)
      .filter(m => m !== null);
    return teamObj;
  });

  return isArray ? populatedTeams : populatedTeams[0];
};

// ----------------------------------------------------
// TEAMS
// ----------------------------------------------------

// GET all teams (with members populated) - Accessible to admin, coordinator, student, placement
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { track, batch, status } = req.query;
    let query = {};
    if (track && track !== 'All') query.track = track;
    if (batch && batch !== 'All') query.batch = batch;
    if (status && status !== 'All') query.status = status;

    const teams = await Team.find(query).lean();
    const populated = await populateTeamMembers(teams);
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teams', error: error.message });
  }
});

// GET currently logged-in student's team
router.get('/my-team', authMiddleware, async (req, res) => {
  try {
    const studentId = await getStudentIdFromUser(req.user);
    if (!studentId) {
      return res.json(null);
    }

    const team = await Team.findOne({ members: studentId }).lean();
    if (!team) {
      return res.json(null);
    }

    const populated = await populateTeamMembers(team);
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching my team', error: error.message });
  }
});

// POST create/update team (Admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access Denied: Admins only' });
    }

    const { name, members } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Team name is required' });
    }

    // Check if team with this name already exists
    let team = await Team.findOne({ name: name.trim() });
    if (team) {
      return res.status(400).json({ message: 'A team with this name already exists' });
    }



    team = new Team({
      name: name.trim(),
      members: members || [],
      track: req.body.track || 'Regular',
      batch: req.body.batch || '',
      status: req.body.status || 'Active',
      prize: req.body.prize || ''
    });

    await team.save();

    if (members && members.length > 0) {
      const activeTeams = await Team.find({ status: 'Active' }, '_id').lean();
      const activeTeamIds = activeTeams.map(t => t._id);
      await Team.updateMany(
        { _id: { $ne: team._id, $in: activeTeamIds } },
        { $pull: { members: { $in: members } } }
      );
    }

    const rawTeam = await Team.findById(team._id).lean();
    const populatedTeam = await populateTeamMembers(rawTeam);
    res.status(201).json(populatedTeam);
  } catch (error) {
    res.status(400).json({ message: 'Error creating team', error: error.message });
  }
});

// PUT update team members/name (Admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access Denied: Admins only' });
    }

    const { name, members, track, batch, status, prize } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (name && name.trim()) {
      // Check duplicate name
      const duplicate = await Team.findOne({ name: name.trim(), _id: { $ne: team._id } });
      if (duplicate) {
        return res.status(400).json({ message: 'A team with this name already exists' });
      }
      team.name = name.trim();
    }

    if (track !== undefined) {
      team.track = track;
    }
    if (batch !== undefined) {
      team.batch = batch;
    }
    if (status !== undefined) {
      team.status = status;
    }
    if (prize !== undefined) {
      team.prize = prize;
    }

    if (members) {
      team.members = members;
      if (members.length > 0) {
        const activeTeams = await Team.find({ status: 'Active' }, '_id').lean();
        const activeTeamIds = activeTeams.map(t => t._id);
        await Team.updateMany(
          { _id: { $ne: team._id, $in: activeTeamIds } },
          { $pull: { members: { $in: members } } }
        );
      }
    }

    await team.save();
    const rawTeam = await Team.findById(team._id).lean();
    const populatedTeam = await populateTeamMembers(rawTeam);
    res.json(populatedTeam);
  } catch (error) {
    res.status(400).json({ message: 'Error updating team', error: error.message });
  }
});

// DELETE a team (Admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access Denied: Admins only' });
    }

    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Clean up related performance records
    await TeamPerformance.deleteMany({ teamId: team._id });

    res.json({ message: 'Team and related activity performance logs deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting team', error: error.message });
  }
});

// ----------------------------------------------------
// TEAM TASKS / CHALLENGES
// ----------------------------------------------------

// GET all team tasks
router.get('/tasks', authMiddleware, async (req, res) => {
  try {
    const tasks = await TeamTask.find().populate('associatedTeams').sort({ dueDate: 1 }).lean();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching team tasks', error: error.message });
  }
});

// POST create team task (Admin only)
router.post('/tasks', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access Denied: Admins only' });
    }

    const { title, description, maxMarks, dueDate, associatedTeams } = req.body;
    if (!title || !dueDate) {
      return res.status(400).json({ message: 'Title and Due Date/Time are required' });
    }

    const task = new TeamTask({
      title: title.trim(),
      description: description || '',
      maxMarks: Number(maxMarks) || 100,
      dueDate: new Date(dueDate),
      associatedTeams: associatedTeams || []
    });

    await task.save();
    const populatedTask = await TeamTask.findById(task._id).populate('associatedTeams');
    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(400).json({ message: 'Error creating team task', error: error.message });
  }
});

// DELETE team task (Admin only)
router.delete('/tasks/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access Denied: Admins only' });
    }

    const task = await TeamTask.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Team task not found' });
    }

    // Clean up related performance records
    await TeamPerformance.deleteMany({ taskId: task._id });

    res.json({ message: 'Team task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting team task', error: error.message });
  }
});

// PUT update team task (Admin only)
router.put('/tasks/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access Denied: Admins only' });
    }

    const { title, description, maxMarks, dueDate, associatedTeams } = req.body;
    const task = await TeamTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Team task not found' });
    }

    if (title && title.trim()) task.title = title.trim();
    if (description !== undefined) task.description = description;
    if (maxMarks !== undefined) task.maxMarks = Number(maxMarks) || 100;
    if (dueDate) task.dueDate = new Date(dueDate);
    if (associatedTeams !== undefined) task.associatedTeams = associatedTeams;

    await task.save();
    const populatedTask = await TeamTask.findById(task._id).populate('associatedTeams');
    res.json(populatedTask);
  } catch (error) {
    res.status(400).json({ message: 'Error updating team task', error: error.message });
  }
});

// ----------------------------------------------------
// GRADING & PERFORMANCE LOGS
// ----------------------------------------------------

// POST grade a team on a task (Admin only)
router.post('/performances', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access Denied: Admins only' });
    }

    const { teamId, taskId, marksObtained, remarks } = req.body;
    if (!teamId || !taskId || marksObtained === undefined) {
      return res.status(400).json({ message: 'Team, Task, and Marks Obtained are required' });
    }

    // Verify task exists to validate maxMarks
    const task = await TeamTask.findById(taskId);
    if (!task) {
      return res.status(444).json({ message: 'Team Task not found' });
    }

    if (Number(marksObtained) > task.maxMarks) {
      return res.status(400).json({ message: `Marks obtained cannot exceed max marks of ${task.maxMarks}` });
    }

    // Upsert performance record
    const performance = await TeamPerformance.findOneAndUpdate(
      { teamId, taskId },
      { 
        marksObtained: Number(marksObtained), 
        remarks: remarks || '',
        markedAt: new Date(),
        markedBy: req.user.name || 'Admin'
      },
      { new: true, upsert: true }
    );

    res.json(performance);
  } catch (error) {
    res.status(400).json({ message: 'Error grading team task', error: error.message });
  }
});

// GET all performances (Admin only)
router.get('/performances', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access Denied: Admins only' });
    }
    const performances = await TeamPerformance.find()
      .populate('teamId')
      .populate('taskId')
      .sort({ createdAt: -1 })
      .lean();
    res.json(performances);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching performance logs', error: error.message });
  }
});

// DELETE a performance record (Admin only)
router.delete('/performances/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access Denied: Admins only' });
    }
    const perf = await TeamPerformance.findByIdAndDelete(req.params.id);
    if (!perf) {
      return res.status(404).json({ message: 'Performance record not found' });
    }
    res.json({ message: 'Performance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting performance log', error: error.message });
  }
});

// GET performances by team ID
router.get('/performances/team/:teamId', authMiddleware, async (req, res) => {
  try {
    const performances = await TeamPerformance.find({ teamId: req.params.teamId })
      .populate('taskId')
      .sort({ createdAt: -1 })
      .lean();
    res.json(performances);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching performance logs', error: error.message });
  }
});

// GET currently logged-in student's team performances
router.get('/performances/my-team', authMiddleware, async (req, res) => {
  try {
    const studentId = await getStudentIdFromUser(req.user);
    if (!studentId) {
      return res.json({ team: null, performances: [] });
    }

    const teamDoc = await Team.findOne({ members: studentId }).lean();
    if (!teamDoc) {
      return res.json({ team: null, performances: [] });
    }

    const team = await populateTeamMembers(teamDoc);

    const performances = await TeamPerformance.find({ teamId: team._id })
      .populate('taskId')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      team,
      performances
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching team performance logs', error: error.message });
  }
});

// GET Leaderboard (scores aggregated from performance records)
router.get('/leaderboard', authMiddleware, async (req, res) => {
  try {
    const { track, batch } = req.query;
    let query = {};
    if (track && track !== 'All') {
      query.track = track;
    } else {
      query.track = { $not: /^Frontend/ };
    }
    if (batch && batch !== 'All') query.batch = batch;

    const teams = await Team.find(query).lean();
    const teamIds = teams.map(t => t._id);
    const performances = await TeamPerformance.find({ teamId: { $in: teamIds } }).lean();

    const leaderboard = teams.map(team => {
      const teamPerf = performances.filter(p => String(p.teamId) === String(team._id));
      const totalScore = teamPerf.reduce((sum, p) => sum + (p.marksObtained || 0), 0);
      const tasksCompleted = teamPerf.length;

      return {
        _id: team._id,
        name: team.name,
        memberCount: team.members ? team.members.length : 0,
        totalScore,
        tasksCompleted
      };
    });

    // Sort by totalScore desc, then by tasksCompleted desc
    leaderboard.sort((a, b) => b.totalScore - a.totalScore || b.tasksCompleted - a.tasksCompleted);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Error computing leaderboard', error: error.message });
  }
});

export default router;
