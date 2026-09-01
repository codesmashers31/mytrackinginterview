import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard, MetricCard, SectionTabs } from '../components/AppShell';
import { authHeaders, logout, getUserId } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import { 
  Clock, 
  Calendar, 
  Plus, 
  BookOpen, 
  Search, 
  Building2, 
  FileText, 
  Flame, 
  Briefcase, 
  Mail, 
  Phone, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Layers, 
  UserCheck, 
  Code2, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  Send,
  HelpCircle,
  Award
} from 'lucide-react';

export default function StudentDailyActivity() {
  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'interviews' | 'tasks'

  // Data states
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [taskLogs, setTaskLogs] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter states
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('All');
  
  const [interviewSearch, setInterviewSearch] = useState('');
  const [interviewStatusFilter, setInterviewStatusFilter] = useState('All');

  const [taskSearch, setTaskSearch] = useState('');

  // Modals
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState(null);
  const [expandedInterviewId, setExpandedInterviewId] = useState(null);

  // Task Form State
  const [taskForm, setTaskForm] = useState({
    date: new Date().toISOString().split('T')[0],
    companyApply: '',
    taskWorkProcess: '',
    remarks: ''
  });
  const [submittingTask, setSubmittingTask] = useState(false);

  // Application Form State
  const [appForm, setAppForm] = useState({
    companyName: '',
    jobRole: '',
    applyDate: new Date().toISOString().split('T')[0],
    applicationType: 'Email Outreach',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
    hrLinkedin: '',
    jobLink: '',
    status: 'Applied',
    notes: '',
    followUpDate: ''
  });
  const [submittingApp, setSubmittingApp] = useState(false);

  // Interview Form State
  const [interviewForm, setInterviewForm] = useState({
    companyName: '',
    role: '',
    interviewDate: new Date().toISOString().split('T')[0],
    interviewMode: 'Online',
    overallStatus: 'Attended / In Progress',
    
    // Aptitude
    aptitudeAttended: false,
    aptitudePlatform: '',
    aptitudeTopics: '',
    aptitudeQuestions: '',
    aptitudeDifficulty: 'Medium',
    aptitudeResult: 'Pending',
    
    // Communication
    commAttended: false,
    commQuestions: '',
    commDifficulty: 'Medium',
    commResult: 'Pending',

    // Technical
    techAttended: false,
    techTopics: '',
    techCodingQuestions: '',
    techTheoryQuestions: '',
    techDifficulty: 'Medium',
    techResult: 'Pending',

    // HR / Managerial
    hrAttended: false,
    hrDiscussion: '',
    hrResult: 'Pending',

    overallExperience: '',
    tipsAndLearnings: ''
  });
  const [submittingInterview, setSubmittingInterview] = useState(false);

  const fetchAllData = async () => {
    const studentId = getUserId();
    if (!studentId) {
      toast.error('Session expired. Please log in again.');
      logout();
      return;
    }

    try {
      const [appRes, intRes, taskRes, attRes] = await Promise.all([
        fetch(buildApiUrl('/job-applications/my'), { headers: authHeaders() }),
        fetch(buildApiUrl('/interview-experiences/my'), { headers: authHeaders() }),
        fetch(buildApiUrl('/daily-activities/my'), { headers: authHeaders() }),
        fetch(buildApiUrl(`/attendance/student/${studentId}`), { headers: authHeaders() })
      ]);

      if (appRes.status === 401 || intRes.status === 401 || taskRes.status === 401) {
        logout();
        return;
      }

      setApplications(appRes.ok ? await appRes.json() : []);
      setInterviews(intRes.ok ? await intRes.json() : []);
      setTaskLogs(taskRes.ok ? await taskRes.json() : []);
      setAttendance(attRes.ok ? await attRes.json() : []);
    } catch (err) {
      toast.error('Failed to sync student activity data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Telemetry Metrics
  const calculateTelemetry = () => {
    const totalHours = attendance.reduce((sum, r) => sum + (r.totalHours || 0), 0);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyHours = attendance
      .filter(r => new Date(r.date) >= sevenDaysAgo)
      .reduce((sum, r) => sum + (r.totalHours || 0), 0);

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

    return {
      totalHours: totalHours.toFixed(1),
      weeklyHours: weeklyHours.toFixed(1),
      streak: calculateStreak()
    };
  };

  const telemetry = calculateTelemetry();

  // ----------------------------------------------------
  // HANDLERS: JOB APPLICATIONS
  // ----------------------------------------------------
  const handleOpenAppModal = (app = null) => {
    if (app) {
      setEditingApp(app);
      setAppForm({
        companyName: app.companyName || '',
        jobRole: app.jobRole || '',
        applyDate: app.applyDate ? new Date(app.applyDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        applicationType: app.applicationType || 'Email Outreach',
        hrName: app.hrDetails?.name || '',
        hrEmail: app.hrDetails?.email || '',
        hrPhone: app.hrDetails?.phone || '',
        hrLinkedin: app.hrDetails?.linkedin || '',
        jobLink: app.jobLink || '',
        status: app.status || 'Applied',
        notes: app.notes || '',
        followUpDate: app.followUpDate ? new Date(app.followUpDate).toISOString().split('T')[0] : ''
      });
    } else {
      setEditingApp(null);
      setAppForm({
        companyName: '',
        jobRole: '',
        applyDate: new Date().toISOString().split('T')[0],
        applicationType: 'Email Outreach',
        hrName: '',
        hrEmail: '',
        hrPhone: '',
        hrLinkedin: '',
        jobLink: '',
        status: 'Applied',
        notes: '',
        followUpDate: ''
      });
    }
    setIsAppModalOpen(true);
  };

  const handleSaveApplication = async (e) => {
    e.preventDefault();
    if (!appForm.companyName.trim()) {
      toast.error('Company Name is required');
      return;
    }

    setSubmittingApp(true);
    try {
      const payload = {
        companyName: appForm.companyName.trim(),
        jobRole: appForm.jobRole.trim(),
        applyDate: appForm.applyDate,
        applicationType: appForm.applicationType,
        hrDetails: {
          name: appForm.hrName.trim(),
          email: appForm.hrEmail.trim(),
          phone: appForm.hrPhone.trim(),
          linkedin: appForm.hrLinkedin.trim()
        },
        jobLink: appForm.jobLink.trim(),
        status: appForm.status,
        notes: appForm.notes.trim(),
        followUpDate: appForm.followUpDate || null
      };

      const url = editingApp 
        ? buildApiUrl(`/job-applications/${editingApp._id}`)
        : buildApiUrl('/job-applications');
      const method = editingApp ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Saving application failed');

      toast.success(editingApp ? 'Application updated successfully!' : 'Company application logged!');
      setIsAppModalOpen(false);
      fetchAllData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingApp(false);
    }
  };

  const handleDeleteApplication = async (id) => {
    if (!window.confirm('Are you sure you want to delete this company application?')) return;
    try {
      const res = await fetch(buildApiUrl(`/job-applications/${id}`), {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (!res.ok) throw new Error('Deletion failed');
      toast.success('Application removed');
      fetchAllData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ----------------------------------------------------
  // HANDLERS: INTERVIEWS
  // ----------------------------------------------------
  const handleOpenInterviewModal = (int = null) => {
    if (int) {
      setEditingInterview(int);
      setInterviewForm({
        companyName: int.companyName || '',
        role: int.role || '',
        interviewDate: int.interviewDate ? new Date(int.interviewDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        interviewMode: int.interviewMode || 'Online',
        overallStatus: int.overallStatus || 'Attended / In Progress',
        
        aptitudeAttended: !!int.aptitudeRound?.attended,
        aptitudePlatform: int.aptitudeRound?.platformOrMode || '',
        aptitudeTopics: int.aptitudeRound?.topicsCovered || '',
        aptitudeQuestions: int.aptitudeRound?.questionsAsked || '',
        aptitudeDifficulty: int.aptitudeRound?.difficulty || 'Medium',
        aptitudeResult: int.aptitudeRound?.result || 'Pending',

        commAttended: !!int.communicationRound?.attended,
        commQuestions: int.communicationRound?.questionsAsked || '',
        commDifficulty: int.communicationRound?.difficulty || 'Medium',
        commResult: int.communicationRound?.result || 'Pending',

        techAttended: !!int.technicalRound?.attended,
        techTopics: int.technicalRound?.topicsCovered || '',
        techCodingQuestions: int.technicalRound?.questionsAsked || '',
        techDifficulty: int.technicalRound?.difficulty || 'Medium',
        techResult: int.technicalRound?.result || 'Pending',

        hrAttended: !!int.hrRound?.attended,
        hrDiscussion: int.hrRound?.questionsAsked || '',
        hrResult: int.hrRound?.result || 'Pending',

        overallExperience: int.overallExperience || '',
        tipsAndLearnings: int.tipsAndLearnings || ''
      });
    } else {
      setEditingInterview(null);
      setInterviewForm({
        companyName: '',
        role: '',
        interviewDate: new Date().toISOString().split('T')[0],
        interviewMode: 'Online',
        overallStatus: 'Attended / In Progress',
        
        aptitudeAttended: false,
        aptitudePlatform: '',
        aptitudeTopics: '',
        aptitudeQuestions: '',
        aptitudeDifficulty: 'Medium',
        aptitudeResult: 'Pending',

        commAttended: false,
        commQuestions: '',
        commDifficulty: 'Medium',
        commResult: 'Pending',

        techAttended: false,
        techTopics: '',
        techCodingQuestions: '',
        techDifficulty: 'Medium',
        techResult: 'Pending',

        hrAttended: false,
        hrDiscussion: '',
        hrResult: 'Pending',

        overallExperience: '',
        tipsAndLearnings: ''
      });
    }
    setIsInterviewModalOpen(true);
  };

  const handleSaveInterview = async (e) => {
    e.preventDefault();
    if (!interviewForm.companyName.trim()) {
      toast.error('Company Name is required');
      return;
    }

    setSubmittingInterview(true);
    try {
      const payload = {
        companyName: interviewForm.companyName.trim(),
        role: interviewForm.role.trim(),
        interviewDate: interviewForm.interviewDate,
        interviewMode: interviewForm.interviewMode,
        overallStatus: interviewForm.overallStatus,
        aptitudeRound: {
          attended: interviewForm.aptitudeAttended,
          platformOrMode: interviewForm.aptitudePlatform.trim(),
          topicsCovered: interviewForm.aptitudeTopics.trim(),
          questionsAsked: interviewForm.aptitudeQuestions.trim(),
          difficulty: interviewForm.aptitudeDifficulty,
          result: interviewForm.aptitudeResult
        },
        communicationRound: {
          attended: interviewForm.commAttended,
          questionsAsked: interviewForm.commQuestions.trim(),
          difficulty: interviewForm.commDifficulty,
          result: interviewForm.commResult
        },
        technicalRound: {
          attended: interviewForm.techAttended,
          topicsCovered: interviewForm.techTopics.trim(),
          questionsAsked: interviewForm.techCodingQuestions.trim(),
          difficulty: interviewForm.techDifficulty,
          result: interviewForm.techResult
        },
        hrRound: {
          attended: interviewForm.hrAttended,
          questionsAsked: interviewForm.hrDiscussion.trim(),
          result: interviewForm.hrResult
        },
        overallExperience: interviewForm.overallExperience.trim(),
        tipsAndLearnings: interviewForm.tipsAndLearnings.trim()
      };

      const url = editingInterview 
        ? buildApiUrl(`/interview-experiences/${editingInterview._id}`)
        : buildApiUrl('/interview-experiences');
      const method = editingInterview ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Saving interview experience failed');

      toast.success(editingInterview ? 'Interview experience updated!' : 'Interview round logged!');
      setIsInterviewModalOpen(false);
      fetchAllData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingInterview(false);
    }
  };

  const handleDeleteInterview = async (id) => {
    if (!window.confirm('Delete this interview experience record?')) return;
    try {
      const res = await fetch(buildApiUrl(`/interview-experiences/${id}`), {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (!res.ok) throw new Error('Deletion failed');
      toast.success('Interview experience removed');
      fetchAllData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ----------------------------------------------------
  // HANDLERS: DAILY TASKS
  // ----------------------------------------------------
  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskForm.taskWorkProcess.trim()) {
      toast.error('Please describe what tasks or learning you completed today');
      return;
    }

    setSubmittingTask(true);
    try {
      const res = await fetch(buildApiUrl('/daily-activities'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          companyApply: taskForm.companyApply.trim() || 'Daily Practice / Study',
          taskWorkProcess: taskForm.taskWorkProcess.trim(),
          remarks: taskForm.remarks.trim(),
          date: taskForm.date
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Task logging failed');

      toast.success('Daily task activity recorded!');
      setTaskForm({
        date: new Date().toISOString().split('T')[0],
        companyApply: '',
        taskWorkProcess: '',
        remarks: ''
      });
      fetchAllData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingTask(false);
    }
  };

  // Status Badge Colors
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Offer Received':
      case 'Selected / Offer':
      case 'Cleared':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Interview Scheduled':
      case 'Cleared / Next Round':
      case 'Shortlisted':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Mail Sent':
      case 'Under Review':
      case 'Attended / In Progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Rejected':
      case 'Not Cleared':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Filtering
  const filteredApplications = applications.filter(app => {
    const searchMatch = 
      (app.companyName || '').toLowerCase().includes(appSearch.toLowerCase()) ||
      (app.jobRole || '').toLowerCase().includes(appSearch.toLowerCase()) ||
      (app.hrDetails?.name || '').toLowerCase().includes(appSearch.toLowerCase()) ||
      (app.hrDetails?.email || '').toLowerCase().includes(appSearch.toLowerCase());
    const statusMatch = appStatusFilter === 'All' || app.status === appStatusFilter;
    return searchMatch && statusMatch;
  });

  const filteredInterviews = interviews.filter(int => {
    const searchMatch = 
      (int.companyName || '').toLowerCase().includes(interviewSearch.toLowerCase()) ||
      (int.role || '').toLowerCase().includes(interviewSearch.toLowerCase()) ||
      (int.technicalRound?.topicsCovered || '').toLowerCase().includes(interviewSearch.toLowerCase()) ||
      (int.technicalRound?.questionsAsked || '').toLowerCase().includes(interviewSearch.toLowerCase());
    const statusMatch = interviewStatusFilter === 'All' || int.overallStatus === interviewStatusFilter;
    return searchMatch && statusMatch;
  });

  const filteredTaskLogs = taskLogs.filter(t => {
    return (t.taskWorkProcess || '').toLowerCase().includes(taskSearch.toLowerCase()) ||
      (t.companyApply || '').toLowerCase().includes(taskSearch.toLowerCase());
  });

  return (
    <AppShell
      title="Daily Activity Workspace"
      subtitle="Track your company job applications, log interview round experiences, and record daily task progress."
      searchPlaceholder="Search logged activities..."
    >
      {/* Top Workspace Telemetry */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <MetricCard 
          title="Total Hours Invested" 
          value={`${telemetry.totalHours} hrs`} 
          helper="Attendance check-in/out hours"
          icon={<Clock size={22} />}
          tone="primary"
        />
        <MetricCard 
          title="Companies Applied" 
          value={`${applications.length}`} 
          helper={`${applications.filter(a => a.status === 'Interview Scheduled' || a.status === 'Shortlisted').length} shortlisted / interviews`}
          icon={<Building2 size={22} />}
          tone="success"
        />
        <MetricCard 
          title="Daily Logging Streak" 
          value={`${telemetry.streak} Days`} 
          helper="Consecutive days of attendance"
          icon={<Flame size={22} />}
          tone="warning"
        />
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 mb-6 pb-2">
        <button
          onClick={() => setActiveTab('applications')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm ${
            activeTab === 'applications'
              ? 'bg-blue-600 text-white shadow-blue-200'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Briefcase size={16} />
          <span>Company Applications ({applications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('interviews')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm ${
            activeTab === 'interviews'
              ? 'bg-blue-600 text-white shadow-blue-200'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Award size={16} />
          <span>Interview Rounds & Logs ({interviews.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm ${
            activeTab === 'tasks'
              ? 'bg-blue-600 text-white shadow-blue-200'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <BookOpen size={16} />
          <span>Daily Work & Tasks ({taskLogs.length})</span>
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: COMPANY APPLICATIONS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          {/* Action & Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-[260px]">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Search company, role, HR..."
                  value={appSearch}
                  onChange={e => setAppSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 transition"
                />
              </div>

              <select
                value={appStatusFilter}
                onChange={e => setAppStatusFilter(e.target.value)}
                className="h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 transition"
              >
                <option value="All">All Statuses</option>
                <option value="Applied">Applied</option>
                <option value="Mail Sent">Mail Sent</option>
                <option value="Under Review">Under Review</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Interview Scheduled">Interview Scheduled</option>
                <option value="Rejected">Rejected</option>
                <option value="Offer Received">Offer Received</option>
              </select>
            </div>

            <button
              onClick={() => handleOpenAppModal()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-200 transition active:scale-95"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Log Company Application</span>
            </button>
          </div>

          {/* Applications Grid */}
          {loading ? (
            <div className="flex min-h-[250px] items-center justify-center">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <SurfaceCard className="p-12 text-center text-slate-500">
              <div className="text-4xl mb-3">💼</div>
              <p className="text-base font-bold text-slate-800">No company applications found</p>
              <p className="text-xs text-slate-400 mt-1">Log the companies you've mailed or applied to today to keep track of your follow-ups.</p>
              <button
                onClick={() => handleOpenAppModal()}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs rounded-xl transition"
              >
                <Plus size={14} />
                <span>Add First Application</span>
              </button>
            </SurfaceCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredApplications.map(app => (
                <SurfaceCard key={app._id} className="p-5 flex flex-col justify-between hover:shadow-md transition border-t-4 border-t-blue-500">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="text-base font-black text-slate-900 leading-tight">{app.companyName}</h3>
                        <p className="text-xs font-bold text-blue-600 mt-0.5">{app.jobRole || 'Software Trainee'}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusBadge(app.status)}`}>
                        {app.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 mb-3">
                      <Calendar size={13} />
                      <span>Applied: {new Date(app.applyDate).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px]">{app.applicationType}</span>
                    </div>

                    {/* HR Details */}
                    {(app.hrDetails?.name || app.hrDetails?.email || app.hrDetails?.phone) && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 mb-3 text-xs">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">HR Contact</span>
                        {app.hrDetails.name && <div className="font-bold text-slate-800">{app.hrDetails.name}</div>}
                        {app.hrDetails.email && (
                          <a href={`mailto:${app.hrDetails.email}`} className="flex items-center gap-1.5 text-blue-600 hover:underline">
                            <Mail size={12} />
                            <span className="truncate">{app.hrDetails.email}</span>
                          </a>
                        )}
                        {app.hrDetails.phone && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Phone size={12} />
                            <span>{app.hrDetails.phone}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {app.notes && (
                      <p className="text-xs text-slate-600 italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 mb-3 line-clamp-2">
                        "{app.notes}"
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                    {app.jobLink ? (
                      <a 
                        href={app.jobLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink size={12} />
                        <span>Job Post</span>
                      </a>
                    ) : <span />}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenAppModal(app)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteApplication(app._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </SurfaceCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: INTERVIEW EXPERIENCES */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'interviews' && (
        <div className="space-y-6">
          {/* Action & Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-[260px]">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Search company, tech topics, questions..."
                  value={interviewSearch}
                  onChange={e => setInterviewSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 transition"
                />
              </div>

              <select
                value={interviewStatusFilter}
                onChange={e => setInterviewStatusFilter(e.target.value)}
                className="h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 transition"
              >
                <option value="All">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Attended / In Progress">Attended / In Progress</option>
                <option value="Cleared / Next Round">Cleared / Next Round</option>
                <option value="Selected / Offer">Selected / Offer</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <button
              onClick={() => handleOpenInterviewModal()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-200 transition active:scale-95"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Log Interview Experience</span>
            </button>
          </div>

          {/* Interviews List */}
          {loading ? (
            <div className="flex min-h-[250px] items-center justify-center">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : filteredInterviews.length === 0 ? (
            <SurfaceCard className="p-12 text-center text-slate-500">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-base font-bold text-slate-800">No interview experiences recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">Log questions from Aptitude, Communication, and Technical rounds so you can track your progress.</p>
              <button
                onClick={() => handleOpenInterviewModal()}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs rounded-xl transition"
              >
                <Plus size={14} />
                <span>Log First Interview</span>
              </button>
            </SurfaceCard>
          ) : (
            <div className="space-y-4">
              {filteredInterviews.map(int => {
                const isExpanded = expandedInterviewId === int._id;
                return (
                  <SurfaceCard key={int._id} className="p-5 hover:shadow-md transition">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-base font-black text-slate-900">{int.companyName}</h3>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(int.overallStatus)}`}>
                            {int.overallStatus}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                          <span>Role: <strong className="text-slate-700">{int.role || 'Software Trainee'}</strong></span>
                          <span>•</span>
                          <span>Date: <strong>{new Date(int.interviewDate).toLocaleDateString()}</strong></span>
                          <span>•</span>
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">{int.interviewMode}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedInterviewId(isExpanded ? null : int._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                        >
                          <span>{isExpanded ? 'Hide Rounds' : 'View Rounds & Questions'}</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        <button
                          onClick={() => handleOpenInterviewModal(int)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteInterview(int._id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Rounds Summary Badges */}
                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100">
                      {int.aptitudeRound?.attended && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">
                          📝 Aptitude ({int.aptitudeRound.result})
                        </span>
                      )}
                      {int.communicationRound?.attended && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg">
                          🗣️ Comm / HR ({int.communicationRound.result})
                        </span>
                      )}
                      {int.technicalRound?.attended && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
                          💻 Tech Round ({int.technicalRound.result})
                        </span>
                      )}
                      {int.hrRound?.attended && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
                          🤝 Final HR ({int.hrRound.result})
                        </span>
                      )}
                    </div>

                    {/* Expandable Round Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 bg-slate-50/50 p-4 rounded-2xl">
                        {/* Aptitude */}
                        {int.aptitudeRound?.attended && (
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                                <span>📝 Aptitude Round</span>
                              </h4>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(int.aptitudeRound.result)}`}>
                                Result: {int.aptitudeRound.result}
                              </span>
                            </div>
                            {int.aptitudeRound.topicsCovered && (
                              <p className="text-xs text-slate-700 mb-1"><strong>Topics:</strong> {int.aptitudeRound.topicsCovered}</p>
                            )}
                            {int.aptitudeRound.questionsAsked && (
                              <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 whitespace-pre-wrap">
                                <strong>Questions / Pattern:</strong><br />{int.aptitudeRound.questionsAsked}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Communication */}
                        {int.communicationRound?.attended && (
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-black text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
                                <span>🗣️ Communication / English Round</span>
                              </h4>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(int.communicationRound.result)}`}>
                                Result: {int.communicationRound.result}
                              </span>
                            </div>
                            {int.communicationRound.questionsAsked && (
                              <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 whitespace-pre-wrap">
                                <strong>Questions Asked:</strong><br />{int.communicationRound.questionsAsked}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Technical */}
                        {int.technicalRound?.attended && (
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-black text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                                <span>💻 Technical Round</span>
                              </h4>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(int.technicalRound.result)}`}>
                                Result: {int.technicalRound.result}
                              </span>
                            </div>
                            {int.technicalRound.topicsCovered && (
                              <p className="text-xs text-slate-700 mb-1"><strong>Topics:</strong> {int.technicalRound.topicsCovered}</p>
                            )}
                            {int.technicalRound.questionsAsked && (
                              <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 whitespace-pre-wrap">
                                <strong>Coding / Theory Questions Asked:</strong><br />{int.technicalRound.questionsAsked}
                              </div>
                            )}
                          </div>
                        )}

                        {/* HR Round */}
                        {int.hrRound?.attended && (
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                                <span>🤝 Managerial / Final HR Round</span>
                              </h4>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(int.hrRound.result)}`}>
                                Result: {int.hrRound.result}
                              </span>
                            </div>
                            {int.hrRound.questionsAsked && (
                              <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 whitespace-pre-wrap">
                                <strong>Discussion / Feedback:</strong><br />{int.hrRound.questionsAsked}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Learnings & Tips */}
                        {(int.overallExperience || int.tipsAndLearnings) && (
                          <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 space-y-2 text-xs">
                            {int.overallExperience && (
                              <p className="text-slate-700"><strong>Overall Experience:</strong> {int.overallExperience}</p>
                            )}
                            {int.tipsAndLearnings && (
                              <p className="text-indigo-900 font-semibold">💡 <strong>Key Learnings:</strong> {int.tipsAndLearnings}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </SurfaceCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3: DAILY WORK & TASK LOGS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'tasks' && (
        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          {/* Left Side: Activity Timeline */}
          <div className="space-y-6 order-2 lg:order-1">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">Task Log History</h2>
              
              <div className="relative w-full sm:w-[260px]">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search daily logs..." 
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-shadow" 
                />
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : filteredTaskLogs.length === 0 ? (
              <SurfaceCard className="p-12 text-center text-slate-500">
                <div className="mb-4 text-4xl">🗒️</div>
                <p className="text-lg font-semibold text-slate-900">No activity logs recorded</p>
                <p className="mt-2 text-sm max-w-sm mx-auto">
                  Submit the form on the right to log your daily study or practice tasks.
                </p>
              </SurfaceCard>
            ) : (
              <div className="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-blue-200 before:to-slate-200 space-y-6">
                {filteredTaskLogs.map(log => {
                  const logDate = new Date(log.date);

                  return (
                    <div key={log._id} className="relative group">
                      <div className="absolute -left-[23px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-500 shadow-sm transition-transform group-hover:scale-125" />

                      <SurfaceCard className="p-5 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] md:text-xs font-bold text-blue-600 uppercase tracking-widest">{logDate.toDateString()}</span>
                        </div>
                        <h4 className="text-sm md:text-base font-bold text-[#1e293b] mb-1">{log.companyApply || 'Daily Learning'}</h4>
                        <p className="text-xs md:text-sm text-slate-600 mb-2 whitespace-pre-wrap">{log.taskWorkProcess}</p>
                        {log.remarks && (
                          <p className="text-xs text-slate-400 italic">Remarks: {log.remarks}</p>
                        )}
                      </SurfaceCard>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Side: Task Form */}
          <div className="order-1 lg:order-2">
            <div className="sticky top-[100px]">
              <SurfaceCard className="p-6 md:p-8 flex flex-col border-t-[12px] border-blue-600 rounded-3xl shadow-lg relative overflow-hidden">
                <h2 className="text-xl font-black text-[#1e293b] mb-1">Log Today's Work</h2>
                <p className="text-xs text-slate-500 mb-5 font-medium">Record what problems, coding tasks, or study topics you worked on today.</p>
                
                <form onSubmit={handleSaveTask} className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">Date <span className="text-rose-500">*</span></label>
                    <input 
                      type="date" 
                      value={taskForm.date}
                      onChange={(e) => setTaskForm({...taskForm, date: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">Focus Topic / Company</label>
                    <input 
                      type="text"
                      value={taskForm.companyApply}
                      onChange={(e) => setTaskForm({...taskForm, companyApply: e.target.value})}
                      placeholder="e.g. LeetCode DSA, React Projects..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">Task & Learning Details <span className="text-rose-500">*</span></label>
                    <textarea 
                      value={taskForm.taskWorkProcess}
                      onChange={(e) => setTaskForm({...taskForm, taskWorkProcess: e.target.value})}
                      placeholder="Describe what you coded, problems solved, or concepts learned..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-blue-500 min-h-[100px] resize-y"
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={submittingTask}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition disabled:opacity-70 text-xs"
                  >
                    {submittingTask ? 'Saving...' : 'Save Task Progress'}
                  </button>
                </form>
              </SurfaceCard>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: APPLICATION CREATE / EDIT */}
      {/* ---------------------------------------------------- */}
      {isAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-xl overflow-hidden my-8">
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-slate-900">{editingApp ? 'Edit Application' : 'Log New Company Application'}</h3>
                <p className="text-xs text-slate-500">Record cold mails, job postings, and HR reach-outs</p>
              </div>
              <button 
                onClick={() => setIsAppModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveApplication} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={appForm.companyName}
                    onChange={e => setAppForm({...appForm, companyName: e.target.value})}
                    placeholder="e.g. Zoho, TCS, Freshworks"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Job Role</label>
                  <input
                    type="text"
                    value={appForm.jobRole}
                    onChange={e => setAppForm({...appForm, jobRole: e.target.value})}
                    placeholder="e.g. React Developer, Trainee"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Apply Date</label>
                  <input
                    type="date"
                    value={appForm.applyDate}
                    onChange={e => setAppForm({...appForm, applyDate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Application Mode</label>
                  <select
                    value={appForm.applicationType}
                    onChange={e => setAppForm({...appForm, applicationType: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="Email Outreach">Email Outreach / Cold Mail</option>
                    <option value="LinkedIn">LinkedIn DM / Easy Apply</option>
                    <option value="Job Portal">Job Portal (Naukri, Indeed)</option>
                    <option value="Career Site">Company Career Portal</option>
                    <option value="Referral">Employee Referral</option>
                    <option value="Campus Drive">Campus Placement Drive</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Application Status</label>
                  <select
                    value={appForm.status}
                    onChange={e => setAppForm({...appForm, status: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="Applied">Applied</option>
                    <option value="Mail Sent">Mail Sent</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Interview Scheduled">Interview Scheduled</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Offer Received">Offer Received</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Job Post Link / URL</label>
                  <input
                    type="url"
                    value={appForm.jobLink}
                    onChange={e => setAppForm({...appForm, jobLink: e.target.value})}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* HR Information Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">HR / Recruiter Info (Optional)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={appForm.hrName}
                    onChange={e => setAppForm({...appForm, hrName: e.target.value})}
                    placeholder="HR Name"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                  />
                  <input
                    type="email"
                    value={appForm.hrEmail}
                    onChange={e => setAppForm({...appForm, hrEmail: e.target.value})}
                    placeholder="HR Email (e.g. hr@company.com)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={appForm.hrPhone}
                    onChange={e => setAppForm({...appForm, hrPhone: e.target.value})}
                    placeholder="HR Phone / Mobile"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                  />
                  <input
                    type="url"
                    value={appForm.hrLinkedin}
                    onChange={e => setAppForm({...appForm, hrLinkedin: e.target.value})}
                    placeholder="HR LinkedIn Profile URL"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes & Follow-up Remarks</label>
                <textarea
                  value={appForm.notes}
                  onChange={e => setAppForm({...appForm, notes: e.target.value})}
                  placeholder="Sent portfolio and resume, followed up on LinkedIn..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-blue-500 min-h-[70px] resize-y"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAppModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApp}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 transition"
                >
                  {submittingApp ? 'Saving...' : editingApp ? 'Update Application' : 'Save Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: INTERVIEW EXPERIENCE CREATE / EDIT */}
      {/* ---------------------------------------------------- */}
      {isInterviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden my-8">
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-slate-900">{editingInterview ? 'Edit Interview Experience' : 'Log Interview Experience & Questions'}</h3>
                <p className="text-xs text-slate-500">Record Aptitude, Tech, and HR questions asked</p>
              </div>
              <button 
                onClick={() => setIsInterviewModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveInterview} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={interviewForm.companyName}
                    onChange={e => setInterviewForm({...interviewForm, companyName: e.target.value})}
                    placeholder="e.g. Amazon, Zoho"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
                  <input
                    type="text"
                    value={interviewForm.role}
                    onChange={e => setInterviewForm({...interviewForm, role: e.target.value})}
                    placeholder="e.g. Junior Web Developer"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Interview Date</label>
                  <input
                    type="date"
                    value={interviewForm.interviewDate}
                    onChange={e => setInterviewForm({...interviewForm, interviewDate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Interview Mode</label>
                  <select
                    value={interviewForm.interviewMode}
                    onChange={e => setInterviewForm({...interviewForm, interviewMode: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="Online">Online / Video Call</option>
                    <option value="In-Person">In-Person / On-Site</option>
                    <option value="Telephonic">Telephonic</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Overall Status</label>
                  <select
                    value={interviewForm.overallStatus}
                    onChange={e => setInterviewForm({...interviewForm, overallStatus: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Attended / In Progress">Attended / In Progress</option>
                    <option value="Cleared / Next Round">Cleared / Moving to Next Round</option>
                    <option value="Selected / Offer">Selected / Offer Received</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* ROUND 1: APTITUDE */}
              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={interviewForm.aptitudeAttended}
                      onChange={e => setInterviewForm({...interviewForm, aptitudeAttended: e.target.checked})}
                      className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-black text-amber-900 uppercase tracking-wider">📝 Aptitude / Online Assessment</span>
                  </label>
                  {interviewForm.aptitudeAttended && (
                    <select
                      value={interviewForm.aptitudeResult}
                      onChange={e => setInterviewForm({...interviewForm, aptitudeResult: e.target.value})}
                      className="px-2 py-1 bg-white border border-amber-200 rounded-lg text-xs font-bold text-amber-900 outline-none"
                    >
                      <option value="Pending">Result: Pending</option>
                      <option value="Cleared">Cleared</option>
                      <option value="Not Cleared">Not Cleared</option>
                    </select>
                  )}
                </div>

                {interviewForm.aptitudeAttended && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <input
                      type="text"
                      placeholder="Platform / Tool (e.g. HackerRank, Mettl, Pen & Paper)"
                      value={interviewForm.aptitudePlatform}
                      onChange={e => setInterviewForm({...interviewForm, aptitudePlatform: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-slate-800 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Topics Covered (e.g. Quants, Logical, Verbal)"
                      value={interviewForm.aptitudeTopics}
                      onChange={e => setInterviewForm({...interviewForm, aptitudeTopics: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-slate-800 outline-none"
                    />
                    <textarea
                      placeholder="Describe questions or test pattern..."
                      value={interviewForm.aptitudeQuestions}
                      onChange={e => setInterviewForm({...interviewForm, aptitudeQuestions: e.target.value})}
                      className="sm:col-span-2 w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-slate-800 outline-none min-h-[60px] resize-y"
                    />
                  </div>
                )}
              </div>

              {/* ROUND 2: COMMUNICATION */}
              <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={interviewForm.commAttended}
                      onChange={e => setInterviewForm({...interviewForm, commAttended: e.target.checked})}
                      className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-black text-purple-900 uppercase tracking-wider">🗣️ Communication / English Round</span>
                  </label>
                  {interviewForm.commAttended && (
                    <select
                      value={interviewForm.commResult}
                      onChange={e => setInterviewForm({...interviewForm, commResult: e.target.value})}
                      className="px-2 py-1 bg-white border border-purple-200 rounded-lg text-xs font-bold text-purple-900 outline-none"
                    >
                      <option value="Pending">Result: Pending</option>
                      <option value="Cleared">Cleared</option>
                      <option value="Not Cleared">Not Cleared</option>
                    </select>
                  )}
                </div>

                {interviewForm.commAttended && (
                  <div className="pt-2">
                    <textarea
                      placeholder="What was asked? (e.g. Self-introduction, JAM, Extempore, Group Discussion topic)..."
                      value={interviewForm.commQuestions}
                      onChange={e => setInterviewForm({...interviewForm, commQuestions: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs text-slate-800 outline-none min-h-[60px] resize-y"
                    />
                  </div>
                )}
              </div>

              {/* ROUND 3: TECHNICAL */}
              <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={interviewForm.techAttended}
                      onChange={e => setInterviewForm({...interviewForm, techAttended: e.target.checked})}
                      className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-black text-blue-900 uppercase tracking-wider">💻 Technical Round (Coding & Tech Questions)</span>
                  </label>
                  {interviewForm.techAttended && (
                    <select
                      value={interviewForm.techResult}
                      onChange={e => setInterviewForm({...interviewForm, techResult: e.target.value})}
                      className="px-2 py-1 bg-white border border-blue-200 rounded-lg text-xs font-bold text-blue-900 outline-none"
                    >
                      <option value="Pending">Result: Pending</option>
                      <option value="Cleared">Cleared</option>
                      <option value="Not Cleared">Not Cleared</option>
                    </select>
                  )}
                </div>

                {interviewForm.techAttended && (
                  <div className="space-y-3 pt-2">
                    <input
                      type="text"
                      placeholder="Technologies Tested (e.g. React, JavaScript, Node.js, SQL, DSA)"
                      value={interviewForm.techTopics}
                      onChange={e => setInterviewForm({...interviewForm, techTopics: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 outline-none"
                    />
                    <textarea
                      placeholder="Exact technical questions and coding challenges asked in the interview..."
                      value={interviewForm.techCodingQuestions}
                      onChange={e => setInterviewForm({...interviewForm, techCodingQuestions: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 outline-none min-h-[90px] resize-y"
                    />
                  </div>
                )}
              </div>

              {/* ROUND 4: HR / FINAL */}
              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={interviewForm.hrAttended}
                      onChange={e => setInterviewForm({...interviewForm, hrAttended: e.target.checked})}
                      className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">🤝 Final HR / Managerial Round</span>
                  </label>
                  {interviewForm.hrAttended && (
                    <select
                      value={interviewForm.hrResult}
                      onChange={e => setInterviewForm({...interviewForm, hrResult: e.target.value})}
                      className="px-2 py-1 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-emerald-900 outline-none"
                    >
                      <option value="Pending">Result: Pending</option>
                      <option value="Cleared">Cleared</option>
                      <option value="Not Cleared">Not Cleared</option>
                    </select>
                  )}
                </div>

                {interviewForm.hrAttended && (
                  <div className="pt-2">
                    <textarea
                      placeholder="Discussion details, willingness for relocation, salary discussion..."
                      value={interviewForm.hrDiscussion}
                      onChange={e => setInterviewForm({...interviewForm, hrDiscussion: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs text-slate-800 outline-none min-h-[60px] resize-y"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">💡 Key Learnings & Advice</label>
                <textarea
                  value={interviewForm.tipsAndLearnings}
                  onChange={e => setInterviewForm({...interviewForm, tipsAndLearnings: e.target.value})}
                  placeholder="What would you revise next time? What went well?"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-blue-500 min-h-[60px] resize-y"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInterviewModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInterview}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 transition"
                >
                  {submittingInterview ? 'Saving...' : editingInterview ? 'Update Interview Log' : 'Save Interview Experience'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
