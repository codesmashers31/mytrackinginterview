import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard, MetricCard } from '../components/AppShell';
import { authHeaders, getUserId, logout } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import { 
  Clock, 
  Calendar, 
  Plus, 
  BookOpen, 
  CheckSquare,
  Flame,
  Activity,
  ArrowRight,
  Gamepad2,
  Trophy,
  Award,
  CheckCircle2,
  Circle,
  User,
  Briefcase,
  UserCheck,
  X,
  CheckCircle,
  AlertCircle,
  LogOut
} from 'lucide-react';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [grade, setGrade] = useState('N/A');
  const [myTeam, setMyTeam] = useState(null);
  const [myPerformances, setMyPerformances] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [profile, setProfile] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Form states for profile details check & update
  const [formData, setFormData] = useState({
    degree: '',
    passedOutYear: '',
    currentStatus: '',
    companyName: '',
    packageLpa: '',
    jobGetMode: '',
    skills: '',
    stack: ''
  });

  const fetchWorkspaceData = async () => {
    const studentId = getUserId();
    if (!studentId) {
      toast.error('Student ID missing. Re-authenticating...');
      logout();
      return;
    }

    try {
      // 1. Fetch profile first to get student track and batch details
      const meRes = await fetch(buildApiUrl('/auth/me'), { headers: authHeaders() });
      if (meRes.status === 401) {
        logout();
        return;
      }
      const meData = meRes.ok ? await meRes.json() : {};
      
      const studentProfile = meData.studentProfile || {};
      setProfile(studentProfile);
      
      const isFrontend = studentProfile.isFrontend || studentProfile.studentType === 'Frontend';
      const isSpl = studentProfile.studentType === 'SPL' || (studentProfile.enrollments && studentProfile.enrollments.includes('SPL'));
      const track = isFrontend ? 'Frontend' : (isSpl ? 'SPL' : 'Regular');
      const batch = studentProfile.batch || '';

      const leadUrl = (track === 'Frontend' || track === 'SPL')
        ? buildApiUrl(`/teams/leaderboard?track=${track}`)
        : buildApiUrl(`/teams/leaderboard?track=${track}&batch=${batch}`);

      // 2. Fetch the rest of the endpoints including filtered leaderboard and today's attendance
      const [logsRes, attendanceRes, tasksRes, teamRes, leadRes, todayAttRes] = await Promise.all([
        fetch(buildApiUrl('/daily-activities/my'), { headers: authHeaders() }),
        fetch(buildApiUrl(`/attendance/student/${studentId}`), { headers: authHeaders() }),
        fetch(buildApiUrl('/tasks/my/list'), { headers: authHeaders() }),
        fetch(buildApiUrl('/teams/performances/my-team'), { headers: authHeaders() }),
        fetch(leadUrl, { headers: authHeaders() }),
        fetch(buildApiUrl('/attendance/today'), { headers: authHeaders() })
      ]);

      if (logsRes.status === 401 || attendanceRes.status === 401 || tasksRes.status === 401) {
        logout();
        return;
      }

      const logsData = logsRes.ok ? await logsRes.json() : [];
      const attendanceData = attendanceRes.ok ? await attendanceRes.json() : [];
      const tasksData = tasksRes.ok ? await tasksRes.json() : [];
      const teamData = teamRes.ok ? await teamRes.json() : null;
      const leadData = leadRes.ok ? await leadRes.json() : [];
      const todayAttData = todayAttRes.ok ? await todayAttRes.json() : null;

      setLogs(logsData);
      setAttendance(attendanceData);
      setTasks(tasksData);
      if (meData.grade) setGrade(meData.grade);
      
      if (teamData) {
        if (teamData.team) setMyTeam(teamData.team);
        if (teamData.performances) setMyPerformances(teamData.performances);
      }
      setLeaderboard(leadData);
      
      if (todayAttData && todayAttData.attendance) {
        setTodayAttendance(todayAttData.attendance);
      } else {
        setTodayAttendance(null);
      }
    } catch (err) {
      toast.error('Failed to sync dashboard telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, []);

  // Initialize update profile form when modal opens
  useEffect(() => {
    if (profile) {
      setFormData({
        degree: profile.degree || '',
        passedOutYear: profile.passedOutYear || '',
        currentStatus: profile.currentStatus || 'Need to filled',
        companyName: profile.companyName || '',
        packageLpa: profile.packageLpa || '',
        jobGetMode: profile.jobGetMode || '',
        skills: profile.skills || '',
        stack: profile.stack || ''
      });
    }
  }, [profile, showUpdateModal]);

  const calculateTelemetry = () => {
    // 1. Total Hours Invested
    const totalHours = attendance.reduce((sum, record) => sum + (record.totalHours || 0), 0);

    // 2. Daily Logging Streak
    const calculateStreak = () => {
      if (!attendance || attendance.length === 0) return 0;
      
      const uniqueDates = [...new Set(attendance.map(a => new Date(a.date).toDateString()))]
        .map(d => new Date(d))
        .sort((a, b) => b - a);

      if (uniqueDates.length === 0) return 0;

      let streak = 0;
      let today = new Date();
      today.setHours(0, 0, 0, 0);

      let latestDate = uniqueDates[0];
      latestDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((today - latestDate) / (1000 * 60 * 60 * 24));
      if (diffDays > 1) return 0;

      let checkDate = new Date(latestDate);
      for (let i = 0; i < uniqueDates.length; i++) {
        const d = new Date(uniqueDates[i]);
        d.setHours(0, 0, 0, 0);
        if (d.getTime() === checkDate.getTime()) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      return streak;
    };

    // 3. Tasks Completed
    const totalTasksCount = tasks.length;
    const completedTasksCount = tasks.filter(t => 
      t.overallStatus === 'Completed' || 
      (t.questions && t.questions.length > 0 && t.questions.every(q => q.status === 'Completed'))
    ).length;

    return {
      totalHours: totalHours.toFixed(1),
      streak: calculateStreak(),
      tasksSummary: totalTasksCount > 0 ? `${completedTasksCount} / ${totalTasksCount}` : '0 / 0',
      completedPercent: totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0
    };
  };

  const telemetry = calculateTelemetry();

  // Combine logs and tasks for recent activity feed
  const recentActivities = [
    ...logs.map(l => ({ type: 'log', date: new Date(l.date), title: 'Daily Log Created', desc: `${l.module} - ${l.topicCovered}`, id: l._id })),
    ...attendance.filter(a => a.checkInTime).map(a => ({ type: 'attendance', date: new Date(a.date), title: 'Attendance Marked', desc: `Status: ${a.status} ${a.totalHours ? `(${a.totalHours} hrs)` : ''}`, id: a._id })),
    ...tasks.filter(t => t.overallStatus === 'Completed' || (t.questions && t.questions.length > 0 && t.questions.every(q => q.status === 'Completed'))).map(t => ({ type: 'task', date: new Date(t.updatedAt || t.createdAt), title: 'Task Completed', desc: t.title, id: t._id }))
  ].sort((a, b) => b.date - a.date).slice(0, 5);

  // Toggle company process willingness from journey stepper
  const handleToggleWillingness = async () => {
    if (!profile) return;
    const newStatus = !profile.willingCompanyProcess;
    
    // Optimistic UI update
    setProfile(prev => ({ ...prev, willingCompanyProcess: newStatus }));
    
    try {
      const res = await fetch(buildApiUrl(`/students/${profile._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({ willingCompanyProcess: newStatus })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error('Willingness update failed');
      
      // Update local state with latest data
      const isFrontend = data.isFrontend || data.studentType === 'Frontend';
      const isSpl = data.studentType === 'SPL' || (data.enrollments && data.enrollments.includes('SPL'));
      const updatedProfile = {
        ...data,
        studentType: isFrontend ? 'Frontend' : (isSpl ? 'SPL' : 'Regular'),
        enrollments: data.enrollments || (isSpl ? ['SPL'] : ['Regular'])
      };
      
      setProfile(updatedProfile);
      toast.success(newStatus ? 'Willingness to join company process registered!' : 'Willingness status removed.');
    } catch (err) {
      // Revert on failure
      setProfile(prev => ({ ...prev, willingCompanyProcess: !newStatus }));
      toast.error('Could not update willingness status.');
    }
  };

  // Submit profile details check & update form
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profile) return;
    setUpdatingProfile(true);
    try {
      const res = await fetch(buildApiUrl(`/students/${profile._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      
      const isFrontend = data.isFrontend || data.studentType === 'Frontend';
      const isSpl = data.studentType === 'SPL' || (data.enrollments && data.enrollments.includes('SPL'));
      const updatedProfile = {
        ...data,
        studentType: isFrontend ? 'Frontend' : (isSpl ? 'SPL' : 'Regular'),
        enrollments: data.enrollments || (isSpl ? ['SPL'] : ['Regular'])
      };

      setProfile(updatedProfile);
      toast.success('Profile details updated successfully!');
      setShowUpdateModal(false);
      
      // Refresh statistics and data
      fetchWorkspaceData();
    } catch (err) {
      toast.error(err.message || 'Failed to update profile details.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const renderTodayAttendanceCard = () => {
    if (!todayAttendance) {
      return (
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-white border border-amber-500/25 p-5 mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-amber-500/5 rounded-full blur-2xl" />
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <AlertCircle className="animate-bounce" size={22} />
            </div>
            <div>
              <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                Attendance Pending
              </span>
              <h4 className="text-sm font-bold text-slate-800 mt-1">Check-In Required Today</h4>
              <p className="text-xs text-slate-500 mt-0.5">Please check in from the attendance portal to mark your presence.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/student/attendance')}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition shrink-0"
          >
            Go to Check In <ArrowRight size={14} />
          </button>
        </div>
      );
    }

    const checkInStr = todayAttendance.checkInTime ? new Date(todayAttendance.checkInTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';
    const checkOutStr = todayAttendance.checkOutTime ? new Date(todayAttendance.checkOutTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';

    if (todayAttendance.status === 'In Progress') {
      return (
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-indigo-500/10 via-indigo-600/5 to-white border border-indigo-500/25 p-5 mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-indigo-500/5 rounded-full blur-2xl" />
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
              <Clock className="animate-pulse" size={22} />
            </div>
            <div>
              <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-2.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                Shift In Progress
              </span>
              <h4 className="text-sm font-bold text-slate-800 mt-1">Checked In Successfully</h4>
              <p className="text-xs text-slate-500 mt-0.5">Checked in at <span className="font-semibold text-slate-800">{checkInStr}</span>. Don't forget to check out when done.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/student/attendance')}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition shrink-0"
          >
            Mark Check Out <LogOut size={14} />
          </button>
        </div>
      );
    }

    return (
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-500/10 via-emerald-600/5 to-white border border-emerald-500/25 p-5 mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-emerald-500/5 rounded-full blur-2xl" />
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <CheckCircle className="text-emerald-600" size={22} />
          </div>
          <div>
            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Shift Completed
            </span>
            <h4 className="text-sm font-bold text-slate-800 mt-1">Attendance Checked Out</h4>
            <p className="text-xs text-slate-500 mt-0.5">Checked In: <span className="font-semibold text-slate-800">{checkInStr}</span> | Checked Out: <span className="font-semibold text-slate-800">{checkOutStr}</span> | Worked: <span className="font-black text-emerald-700">{todayAttendance.totalHours ? todayAttendance.totalHours.toFixed(1) : 0} hrs</span></p>
          </div>
        </div>
        <button
          onClick={() => navigate('/student/attendance')}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition shrink-0"
        >
          View Log History
        </button>
      </div>
    );
  };

  const renderJourneyStepper = () => {
    const isLoggingActive = parseFloat(telemetry.totalHours) > 0 || telemetry.streak > 0;
    const isAssignedTeam = !!myTeam;
    const isWilling = !!profile?.willingCompanyProcess;
    const isPlaced = profile?.currentStatus === 'Placed' || profile?.currentStatus === 'Onboard';

    const stages = [
      {
        id: 1,
        title: 'Account Active',
        desc: 'Profile active in system',
        status: 'completed',
        icon: <CheckCircle2 className="text-emerald-500" size={20} />
      },
      {
        id: 2,
        title: 'Daily Logs',
        desc: `${telemetry.totalHours} hrs logged`,
        status: isLoggingActive ? 'completed' : 'active',
        icon: isLoggingActive ? (
          <CheckCircle2 className="text-emerald-500" size={20} />
        ) : (
          <Flame className="text-amber-500 animate-pulse" size={20} />
        )
      },
      {
        id: 3,
        title: 'Guild Assigned',
        desc: isAssignedTeam ? `Clan: ${myTeam.name}` : 'Awaiting assignment',
        status: isAssignedTeam ? 'completed' : (!isLoggingActive ? 'locked' : 'active'),
        icon: isAssignedTeam ? (
          <CheckCircle2 className="text-emerald-500" size={20} />
        ) : (
          <Gamepad2 className={!isLoggingActive ? 'text-slate-300' : 'text-indigo-500 animate-pulse'} size={20} />
        )
      },
      {
        id: 4,
        title: 'Company Willingness',
        desc: isWilling ? 'Willingness Registered' : 'Not confirmed',
        status: isWilling ? 'completed' : (!isAssignedTeam ? 'locked' : 'active'),
        icon: isWilling ? (
          <CheckCircle2 className="text-emerald-500" size={20} />
        ) : (
          <UserCheck className={!isAssignedTeam ? 'text-slate-300' : 'text-indigo-500 animate-bounce'} size={20} />
        )
      },
      {
        id: 5,
        title: 'Hired & Placed',
        desc: isPlaced ? `Placed: ${profile.companyName || 'Corporate'}` : 'In Placement Funnel',
        status: isPlaced ? 'completed' : (!isWilling ? 'locked' : 'active'),
        icon: isPlaced ? (
          <CheckCircle2 className="text-emerald-500" size={20} />
        ) : (
          <Briefcase className={!isWilling ? 'text-slate-300' : 'text-amber-500 animate-pulse'} size={20} />
        )
      }
    ];

    // Connect lines width percentage
    let activeStepsCount = 1;
    if (isLoggingActive) activeStepsCount = 2;
    if (isLoggingActive && isAssignedTeam) activeStepsCount = 3;
    if (isLoggingActive && isAssignedTeam && isWilling) activeStepsCount = 4;
    if (isLoggingActive && isAssignedTeam && isWilling && isPlaced) activeStepsCount = 5;
    const progressPercent = ((activeStepsCount - 1) / 4) * 100;

    return (
      <SurfaceCard className="p-6 mb-8 border border-slate-100 overflow-hidden relative bg-gradient-to-br from-white to-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Activity className="text-indigo-600 animate-pulse" size={18} />
              My Placement Journey Process
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Track your progress and interactive milestones towards onboarding.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Stage {activeStepsCount} of 5 Active
            </span>
          </div>
        </div>

        {/* Stepper Grid Container */}
        <div className="relative">
          {/* Connecting Line for desktop */}
          <div className="absolute top-[26px] left-[5%] right-[5%] h-1 bg-slate-100 -translate-y-1/2 hidden lg:block z-0" />
          <div 
            className="absolute top-[26px] left-[5%] h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-indigo-600 -translate-y-1/2 hidden lg:block z-0 transition-all duration-500" 
            style={{ width: `${progressPercent * 0.9}%` }}
          />

          <div className="grid gap-6 lg:grid-cols-5 relative z-10">
            {stages.map((stage) => {
              const isCompleted = stage.status === 'completed' || (stage.id < activeStepsCount);
              const isActive = stage.id === activeStepsCount;
              const isLocked = stage.id > activeStepsCount;

              return (
                <div 
                  key={stage.id} 
                  className={`flex flex-row lg:flex-col items-start lg:items-center p-4 rounded-2xl border transition-all ${
                    isActive 
                      ? 'bg-gradient-to-r lg:bg-gradient-to-b from-indigo-50/40 to-white border-indigo-200/80 shadow-md ring-2 ring-indigo-500/10' 
                      : isCompleted 
                        ? 'bg-white border-slate-200/60 shadow-sm' 
                        : 'bg-slate-50/50 border-dashed border-slate-200 opacity-60'
                  }`}
                >
                  {/* Step Bubble */}
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full border-4 shrink-0 transition-all ${
                    isCompleted 
                      ? 'bg-emerald-50 border-emerald-200' 
                      : isActive 
                        ? 'bg-indigo-50 border-indigo-300 animate-pulse' 
                        : 'bg-slate-100 border-slate-200'
                  }`}>
                    {stage.icon}
                  </div>

                  {/* Step Information */}
                  <div className="ml-4 lg:ml-0 lg:mt-3 lg:text-center flex-1">
                    <span className={`text-[9px] font-black uppercase tracking-wider block ${
                      isCompleted ? 'text-emerald-600' : isActive ? 'text-indigo-600' : 'text-slate-400'
                    }`}>
                      Stage {stage.id}
                    </span>
                    <span className="font-bold text-slate-800 text-sm block mt-0.5">{stage.title}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{stage.desc}</span>

                    {/* Interactive Stage 4 Toggle */}
                    {stage.id === 4 && !isLocked && (
                      <div className="mt-2.5">
                        <button
                          type="button"
                          onClick={handleToggleWillingness}
                          className={`px-3 py-1.5 text-[10px] font-extrabold uppercase rounded-lg border transition-all ${
                            isWilling 
                              ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer' 
                              : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 hover:scale-105 shadow-sm cursor-pointer'
                          }`}
                        >
                          {isWilling ? 'Willingness: YES' : 'Click to Register'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SurfaceCard>
    );
  };

  return (
    <AppShell
      title="Student Workspace"
      subtitle="Overview of your learning process, active team challenges, and career placement updates."
    >
      {/* Welcome & Profile Header */}
      {profile && (
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 md:p-10 mb-8 border border-white/5 shadow-2xl">
          {/* Decorative subtle glows */}
          <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 h-40 w-40 bg-blue-500/10 rounded-full blur-3xl" />
          
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                Candidate Profile
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mt-4 tracking-tight">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-white">{profile.name}</span>! 👋
              </h1>
              <p className="text-slate-400 text-sm mt-2 max-w-xl">
                Ready to accelerate your placements? Track your learning stats, coordinate with your guild crew, and stay ready for mock evaluations.
              </p>
              
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setShowUpdateModal(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <UserCheck size={14} /> Check & Update Profile
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 items-center bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-md shrink-0">
              <div className="text-xs">
                <span className="text-slate-400 block font-medium">Track Program</span>
                <span className="text-white font-bold text-sm flex items-center gap-1.5 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                  {profile.isFrontend || profile.studentType === 'Frontend' ? 'Frontend Track' : (profile.enrollments && profile.enrollments.includes('SPL') ? 'SPL Class' : 'Regular Track')}
                </span>
              </div>
              <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block" />
              <div className="text-xs">
                <span className="text-slate-400 block font-medium">Batch / Cohort</span>
                <span className="text-white font-bold text-sm mt-0.5 block">{profile.batch || 'Not Assigned'}</span>
              </div>
              <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block" />
              <div className="text-xs">
                <span className="text-slate-400 block font-medium">Employment Status</span>
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full mt-1 border ${
                  profile.currentStatus === 'Placed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  profile.currentStatus === 'Onboard' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  profile.currentStatus === 'Interview Process' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-slate-50/10 text-slate-300 border-slate-500/20'
                }`}>
                  {profile.currentStatus || 'Needs Update'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning Callout for Missing Info */}
      {profile && (profile.currentStatus === 'Need to filled' || !profile.degree || !profile.passedOutYear) && (
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-red-500/10 via-red-600/5 to-white border border-red-500/25 p-5 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-red-500/5 rounded-full blur-2xl" />
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-700">
              <AlertCircle className="animate-bounce" size={22} />
            </div>
            <div>
              <span className="text-[9px] bg-red-100 text-red-800 font-bold px-2.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                Action Required
              </span>
              <h4 className="text-sm font-bold text-slate-800 mt-1">Profile Details Need Updates</h4>
              <p className="text-xs text-slate-500 mt-0.5">Please check and fill in your current degree, graduation year, and placement status.</p>
            </div>
          </div>
          <button
            onClick={() => setShowUpdateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white hover:bg-red-700 text-xs font-bold rounded-xl shadow-md transition shrink-0"
          >
            Update Profile Now <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Today's Attendance Process Card */}
      {profile && renderTodayAttendanceCard()}



      {/* Metric stats cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard 
          title="Total Hours Invested" 
          value={`${telemetry.totalHours} hrs`} 
          helper="Total logged check-in hours"
          icon={<Clock size={22} />}
          tone="primary"
        />
        <MetricCard 
          title="Daily Logging Streak" 
          value={`${telemetry.streak} Days`} 
          helper="Consecutive days of attendance"
          icon={<Flame size={22} />}
          tone="warning"
        />
        <MetricCard 
          title="Tasks Completed" 
          value={telemetry.tasksSummary} 
          helper={`${telemetry.completedPercent}% overall completion`}
          icon={<CheckSquare size={22} />}
          tone="success"
        />
        <MetricCard 
          title="Overall Grade" 
          value={grade || 'N/A'} 
          helper="Your current performance grade"
          icon={<BookOpen size={22} />}
          tone="primary"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left Side: Activity Feed & Team Challenges */}
        <div className="space-y-6">
          {/* Team Details & Clan Section */}
          <SurfaceCard className="p-6 border border-slate-100 bg-gradient-to-br from-white to-indigo-50/5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Gamepad2 size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">🛡️ Team Details & Clan</h2>
              </div>
              {myTeam && (
                <button 
                  onClick={() => navigate('/student/teams')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition"
                >
                  View Details <ArrowRight size={14} />
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex min-h-[140px] items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
              </div>
            ) : !myTeam ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm font-semibold text-slate-700">No Team Assigned Yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Ask your administrator to add you to a team guild to participate in activities and challenges!</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Team Info Panel */}
                <div className="p-5 bg-slate-50/55 rounded-2xl border border-slate-150 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex flex-wrap gap-2 items-center mb-2.5">
                      <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Active Guild
                      </span>
                      <span className="text-[9px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {myTeam.batch || 'General'}
                      </span>
                    </div>

                    <div className="mb-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Team Clan</span>
                      <h3 className="text-2xl font-black text-slate-950 mt-0.5">{myTeam.name}</h3>
                    </div>

                    <div className="mb-4">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Team Oriented</span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-600/10 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-600/20 mt-1">
                        {myTeam.track ? `${myTeam.track}-oriented` : 'Regular-oriented'}
                      </span>
                    </div>
                    
                    <p className="text-[10px] text-slate-400 mt-0.5">Crew Size: {myTeam.members?.length || 0} members</p>
                  </div>
                  
                  {/* Companions Mini List */}
                  <div className="border-t border-slate-200 pt-3 mt-4">
                    <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-2">Clan Companions</h4>
                    <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                      {myTeam.members?.slice(0, 3).map(m => m && (
                        <div key={m._id} className="flex items-center justify-between text-xs py-0.5">
                          <span className="font-medium text-slate-700 truncate max-w-[130px]">{m.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded font-bold shrink-0">{m.degree || 'Student'}</span>
                        </div>
                      ))}
                      {myTeam.members?.length > 3 && (
                        <p className="text-[9px] text-slate-400 italic text-center mt-1">+ {myTeam.members.length - 3} more crew members</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-xs">
                    <div className="flex items-center gap-1 text-indigo-600 font-black">
                      <Trophy size={14} className="text-indigo-500" />
                      {leaderboard.find(l => String(l._id) === String(myTeam._id))?.totalScore || 0} <span className="font-normal text-slate-400 text-[10px]">pts</span>
                    </div>
                    <div className="font-bold text-slate-700">
                      Rank #{leaderboard.findIndex(l => String(l._id) === String(myTeam._id)) + 1 || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Team Grades & Evaluation Remarks */}
                <div className="p-5 bg-white rounded-2xl border border-slate-150 flex flex-col shadow-sm">
                  <h3 className="font-bold text-slate-800 text-xs mb-3 flex items-center gap-1.5 uppercase tracking-wider text-slate-400">
                    <Award size={14} className="text-indigo-500" />
                    Challenge Remarks
                  </h3>

                  {myPerformances.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-6 text-slate-400">
                      <p className="text-xs font-semibold">No scored achievements yet</p>
                      <p className="text-[10px] mt-0.5">Scored team tasks will populate here with remarks.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar flex-1">
                      {myPerformances.slice(0, 4).map(perf => (
                        <div key={perf._id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-start justify-between gap-3 hover:bg-slate-100/50 transition">
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-slate-800 text-xs truncate block">{perf.taskId?.title || 'Challenge'}</span>
                            {perf.remarks && (
                              <p className="text-[10px] text-slate-500 italic mt-0.5 truncate" title={perf.remarks}>"{perf.remarks}"</p>
                            )}
                          </div>
                          <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                            {perf.marksObtained} pts
                          </span>
                        </div>
                      ))}
                      {myPerformances.length > 4 && (
                        <button 
                          onClick={() => navigate('/student/teams')}
                          className="w-full text-center text-[10px] font-bold text-indigo-600 hover:underline pt-1 block"
                        >
                          View all {myPerformances.length} grades
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </SurfaceCard>

          {/* Team Process Section */}
          {myTeam && (
            <SurfaceCard className="p-6 border border-slate-100 bg-gradient-to-br from-white to-slate-50/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <CheckSquare size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">🎯 Team Process</h2>
                    <p className="text-xs text-slate-400">Scored challenges and orientation tasks assigned to your clan.</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/student/teams')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition"
                >
                  View Challenges <ArrowRight size={14} />
                </button>
              </div>

              {myPerformances.length === 0 ? (
                <div className="text-center py-6 text-slate-400 bg-slate-50/50 border border-slate-100 rounded-2xl">
                  <p className="text-xs font-bold text-slate-500">No Scored Challenges Found</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Scored process challenges will populate here once completed.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myPerformances.slice(0, 3).map(perf => (
                    <div key={perf._id} className="p-3.5 bg-white border border-slate-200/60 rounded-2xl flex flex-col gap-2 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[9px] font-extrabold uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                            Process Challenge
                          </span>
                          <h4 className="font-bold text-slate-800 text-sm mt-1">{perf.taskId?.title || 'Challenge'}</h4>
                        </div>
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-100">
                          {perf.marksObtained} pts
                        </span>
                      </div>
                      
                      {perf.remarks && (
                        <div className="text-xs text-slate-500 italic bg-slate-50/50 p-2 rounded-xl border border-slate-100 mt-1">
                          "{perf.remarks}"
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        <span>Evaluated: {new Date(perf.markedAt || perf.createdAt).toLocaleDateString()}</span>
                        <span>Grader: {perf.markedBy || 'Admin'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SurfaceCard>
          )}

          {/* Activity Feed Card */}
          <SurfaceCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Activity size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Recent Activity Log</h2>
            </div>

            {loading ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <p>No recent activity found. Start logging to see your progress!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((act, i) => (
                  <div key={`${act.id}-${i}`} className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/50 transition">
                    <div className="mt-1 flex-shrink-0">
                      {act.type === 'log' && <BookOpen size={18} className="text-indigo-500" />}
                      {act.type === 'attendance' && <Calendar size={18} className="text-blue-500" />}
                      {act.type === 'task' && <CheckSquare size={18} className="text-emerald-500" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-800 text-sm">{act.title}</span>
                        <span className="text-xs text-slate-400">• {act.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{act.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>
        </div>

        {/* Right Side: Quick Actions & Leaderboard standing */}
        <div className="space-y-6">
          <SurfaceCard className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <h3 className="text-lg font-bold mb-2">Quick Actions</h3>
            <p className="text-slate-300 text-sm mb-6">Jump directly to your daily tasks and logs.</p>
            
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/student/attendance')}
                className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-xl transition font-semibold"
              >
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-blue-300" />
                  Check In / Out
                </div>
                <ArrowRight size={16} className="text-slate-400" />
              </button>

              <button 
                onClick={() => navigate('/student/daily-activity')}
                className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-xl transition font-semibold"
              >
                <div className="flex items-center gap-3">
                  <Plus size={18} className="text-indigo-300" />
                  Log Daily Activity
                </div>
                <ArrowRight size={16} className="text-slate-400" />
              </button>

              <button 
                onClick={() => navigate('/student/tasks')}
                className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-xl transition font-semibold"
              >
                <div className="flex items-center gap-3">
                  <CheckSquare size={18} className="text-emerald-300" />
                  View Assigned Tasks
                </div>
                <ArrowRight size={16} className="text-slate-400" />
              </button>

              <button 
                onClick={() => navigate('/student/teams')}
                className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-xl transition font-semibold"
              >
                <div className="flex items-center gap-3">
                  <Gamepad2 size={18} className="text-amber-300" />
                  Team Guild Activity
                </div>
                <ArrowRight size={16} className="text-slate-400" />
              </button>
            </div>
          </SurfaceCard>
        </div>
      </div>

      {/* Update Profile Details Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
              <div>
                <h3 className="text-lg font-black flex items-center gap-2">
                  <UserCheck size={20} className="text-indigo-400" />
                  Check & Update Details
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">Keep your profile current for companies and placements.</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowUpdateModal(false)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Degree</label>
                  <input
                    type="text"
                    required
                    value={formData.degree}
                    onChange={e => setFormData(prev => ({ ...prev, degree: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. MCA, B.E (CSE)"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Graduation Year</label>
                  <input
                    type="text"
                    required
                    value={formData.passedOutYear}
                    onChange={e => setFormData(prev => ({ ...prev, passedOutYear: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. 2024"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Employment Status</label>
                <select
                  value={formData.currentStatus}
                  onChange={e => setFormData(prev => ({ ...prev, currentStatus: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Need to filled">Needs Updates</option>
                  <option value="Job Seeker">Active Job Seeker</option>
                  <option value="Interview Process">Interviewing</option>
                  <option value="Placed">Placed successfully</option>
                  <option value="Onboard">Onboarded</option>
                </select>
              </div>

              {/* Conditional fields if Placed or Onboard */}
              {(formData.currentStatus === 'Placed' || formData.currentStatus === 'Onboard') && (
                <div className="space-y-4 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">Placement Details</span>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Company Name</label>
                    <input
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. Cognitive Mobiles"
                    />
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Package LPA</label>
                      <input
                        type="text"
                        required
                        value={formData.packageLpa}
                        onChange={e => setFormData(prev => ({ ...prev, packageLpa: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                        placeholder="e.g. 2.4"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Job Mode</label>
                      <select
                        value={formData.jobGetMode}
                        onChange={e => setFormData(prev => ({ ...prev, jobGetMode: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none"
                      >
                        <option value="">Select Mode</option>
                        <option value="SLA">Placement Drive</option>
                        <option value="Self">Self Applied</option>
                        <option value="Referral">Referral</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Core Tech Stack</label>
                <input
                  type="text"
                  value={formData.stack}
                  onChange={e => setFormData(prev => ({ ...prev, stack: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. MERN Stack, Python Full Stack"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Key Skills</label>
                <textarea
                  value={formData.skills}
                  onChange={e => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 h-20 resize-none"
                  placeholder="e.g. HTML5, CSS3, JavaScript, React.js, Node.js"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md disabled:opacity-50"
                >
                  {updatingProfile ? 'Saving Details...' : 'Save & Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
