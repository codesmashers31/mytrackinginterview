import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard, MetricCard } from '../components/AppShell';
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
  Award,
  Zap,
  ArrowRight,
  ShieldAlert,
  Check,
  X
} from 'lucide-react';

export default function StudentDailyActivity() {
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'interviews' | 'tasks'

  // Data states
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [taskLogs, setTaskLogs] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter states
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [pipelineStatusFilter, setPipelineStatusFilter] = useState('All');
  
  const [interviewSearch, setInterviewSearch] = useState('');
  const [interviewStatusFilter, setInterviewStatusFilter] = useState('All');

  const [taskSearch, setTaskSearch] = useState('');

  // Modals
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState(null);
  const [expandedPipelineId, setExpandedPipelineId] = useState(null);

  // Task Form State
  const [taskForm, setTaskForm] = useState({
    date: new Date().toISOString().split('T')[0],
    companyApply: '',
    taskWorkProcess: '',
    remarks: ''
  });
  const [submittingTask, setSubmittingTask] = useState(false);

  // Application Form State (Step 1: Company Registration)
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

  // Interview Form State (Step 2: Interview Rounds Feedback)
  const [interviewForm, setInterviewForm] = useState({
    applicationId: '',
    companyName: '',
    role: '',
    interviewDate: new Date().toISOString().split('T')[0],
    interviewMode: 'Online',
    overallStatus: 'In Process',
    
    // Aptitude
    aptitudeAttended: false,
    aptitudePlatform: '',
    aptitudeTopics: '',
    aptitudeQuestions: '',
    aptitudeDifficulty: 'Medium',
    aptitudeResult: 'Pending',
    aptitudeNotes: '',
    
    // Communication
    commAttended: false,
    commTopics: '',
    commQuestions: '',
    commDifficulty: 'Medium',
    commResult: 'Pending',
    commNotes: '',

    // Technical
    techAttended: false,
    techTopics: '',
    techCodingQuestions: '',
    techTheoryQuestions: '',
    techDifficulty: 'Medium',
    techResult: 'Pending',
    techNotes: '',

    // HR / Managerial
    hrAttended: false,
    hrDiscussion: '',
    hrResult: 'Pending',
    hrNotes: '',

    overallExperience: '',
    tipsAndLearnings: ''
  });
  const [submittingInterview, setSubmittingInterview] = useState(false);

  const fetchAllData = async () => {
    const studentId = getUserId();
    setLoading(true);
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

      const [appData, intData, taskData, attData] = await Promise.all([
        appRes.ok ? appRes.json() : [],
        intRes.ok ? intRes.json() : [],
        taskRes.ok ? taskRes.json() : [],
        attRes.ok ? attRes.json() : []
      ]);

      setApplications(Array.isArray(appData) ? appData : []);
      setInterviews(Array.isArray(intData) ? intData : []);
      setTaskLogs(Array.isArray(taskData) ? taskData : []);
      setAttendance(Array.isArray(attData) ? attData : []);
    } catch (err) {
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Telemetry Metrics calculation
  const calculateTelemetry = () => {
    let totalHours = 0;
    let weeklyHours = 0;
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    attendance.forEach(record => {
      if (record.checkIn && record.checkOut) {
        const inTime = new Date(`1970-01-01T${record.checkIn}`);
        const outTime = new Date(`1970-01-01T${record.checkOut}`);
        const diffMs = outTime - inTime;
        if (diffMs > 0) {
          const hours = diffMs / (1000 * 60 * 60);
          totalHours += hours;
          const recDate = new Date(record.date);
          if (recDate >= oneWeekAgo && recDate <= now) {
            weeklyHours += hours;
          }
        }
      }
    });

    const calculateStreak = () => {
      if (!attendance.length) return 0;
      const sorted = [...attendance].sort((a, b) => new Date(b.date) - new Date(a.date));
      let streak = 0;
      let curr = new Date();
      curr.setHours(0, 0, 0, 0);

      const latest = new Date(sorted[0].date);
      latest.setHours(0, 0, 0, 0);
      const diffLatest = (curr - latest) / (1000 * 60 * 60 * 24);
      if (diffLatest > 1) return 0;

      for (let i = 0; i < sorted.length; i++) {
        const itemDate = new Date(sorted[i].date);
        itemDate.setHours(0, 0, 0, 0);
        if (sorted[i].status === 'Present') {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    };

    return {
      totalHours: totalHours.toFixed(1),
      weeklyHours: weeklyHours.toFixed(1),
      streak: calculateStreak(),
      totalApplied: applications.length,
      inProcess: applications.filter(a => ['In Process', 'Interview Scheduled', 'Under Review', 'Shortlisted', 'Pending Feedback'].includes(a.status)).length,
      placedCount: applications.filter(a => ['Placed', 'Offer Received', 'Selected / Placed'].includes(a.status)).length
    };
  };

  const telemetry = calculateTelemetry();

  // ----------------------------------------------------
  // HANDLERS: STEP 1 - JOB / COMPANY APPLICATION
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

      toast.success(editingApp ? 'Company application updated!' : '✨ New Company Application registered!');
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
  // HANDLERS: STEP 2 - INTERVIEW ROUNDS FEEDBACK
  // ----------------------------------------------------
  const handleOpenInterviewModal = (target = null) => {
    // Target can be an existing interview record OR a job application
    if (target && target._id) {
      // Check if target is an interview record or application
      const isExistingInterview = interviews.some(i => i._id === target._id);
      
      if (isExistingInterview) {
        const int = target;
        setEditingInterview(int);
        setInterviewForm({
          applicationId: int.applicationId || '',
          companyName: int.companyName || '',
          role: int.role || '',
          interviewDate: int.interviewDate ? new Date(int.interviewDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          interviewMode: int.interviewMode || 'Online',
          overallStatus: int.overallStatus || 'In Process',
          
          aptitudeAttended: !!int.aptitudeRound?.attended,
          aptitudePlatform: int.aptitudeRound?.platformOrMode || '',
          aptitudeTopics: int.aptitudeRound?.topicsCovered || '',
          aptitudeQuestions: int.aptitudeRound?.questionsAsked || '',
          aptitudeDifficulty: int.aptitudeRound?.difficulty || 'Medium',
          aptitudeResult: int.aptitudeRound?.result || 'Pending',
          aptitudeNotes: int.aptitudeRound?.notes || '',

          commAttended: !!int.communicationRound?.attended,
          commTopics: int.communicationRound?.topicsCovered || '',
          commQuestions: int.communicationRound?.questionsAsked || '',
          commDifficulty: int.communicationRound?.difficulty || 'Medium',
          commResult: int.communicationRound?.result || 'Pending',
          commNotes: int.communicationRound?.notes || '',

          techAttended: !!int.technicalRound?.attended,
          techTopics: int.technicalRound?.topicsCovered || '',
          techCodingQuestions: int.technicalRound?.questionsAsked || '',
          techDifficulty: int.technicalRound?.difficulty || 'Medium',
          techResult: int.technicalRound?.result || 'Pending',
          techNotes: int.technicalRound?.notes || '',

          hrAttended: !!int.hrRound?.attended,
          hrDiscussion: int.hrRound?.questionsAsked || int.hrRound?.notes || '',
          hrResult: int.hrRound?.result || 'Pending',
          hrNotes: int.hrRound?.notes || '',

          overallExperience: int.overallExperience || '',
          tipsAndLearnings: int.tipsAndLearnings || ''
        });
      } else {
        // Passed an application object! Look for an existing interview for this application or initialize
        const app = target;
        const matchingInterview = interviews.find(i => 
          (i.applicationId && i.applicationId === app._id) || 
          (i.companyName && i.companyName.toLowerCase().trim() === app.companyName.toLowerCase().trim())
        );

        if (matchingInterview) {
          setEditingInterview(matchingInterview);
          setInterviewForm({
            applicationId: app._id,
            companyName: matchingInterview.companyName || app.companyName,
            role: matchingInterview.role || app.jobRole || '',
            interviewDate: matchingInterview.interviewDate ? new Date(matchingInterview.interviewDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            interviewMode: matchingInterview.interviewMode || 'Online',
            overallStatus: matchingInterview.overallStatus || 'In Process',
            
            aptitudeAttended: !!matchingInterview.aptitudeRound?.attended,
            aptitudePlatform: matchingInterview.aptitudeRound?.platformOrMode || '',
            aptitudeTopics: matchingInterview.aptitudeRound?.topicsCovered || '',
            aptitudeQuestions: matchingInterview.aptitudeRound?.questionsAsked || '',
            aptitudeDifficulty: matchingInterview.aptitudeRound?.difficulty || 'Medium',
            aptitudeResult: matchingInterview.aptitudeRound?.result || 'Pending',
            aptitudeNotes: matchingInterview.aptitudeRound?.notes || '',

            commAttended: !!matchingInterview.communicationRound?.attended,
            commTopics: matchingInterview.communicationRound?.topicsCovered || '',
            commQuestions: matchingInterview.communicationRound?.questionsAsked || '',
            commDifficulty: matchingInterview.communicationRound?.difficulty || 'Medium',
            commResult: matchingInterview.communicationRound?.result || 'Pending',
            commNotes: matchingInterview.communicationRound?.notes || '',

            techAttended: !!matchingInterview.technicalRound?.attended,
            techTopics: matchingInterview.technicalRound?.topicsCovered || '',
            techCodingQuestions: matchingInterview.technicalRound?.questionsAsked || '',
            techDifficulty: matchingInterview.technicalRound?.difficulty || 'Medium',
            techResult: matchingInterview.technicalRound?.result || 'Pending',
            techNotes: matchingInterview.technicalRound?.notes || '',

            hrAttended: !!matchingInterview.hrRound?.attended,
            hrDiscussion: matchingInterview.hrRound?.questionsAsked || matchingInterview.hrRound?.notes || '',
            hrResult: matchingInterview.hrRound?.result || 'Pending',
            hrNotes: matchingInterview.hrRound?.notes || '',

            overallExperience: matchingInterview.overallExperience || '',
            tipsAndLearnings: matchingInterview.tipsAndLearnings || ''
          });
        } else {
          // Initialize fresh interview feedback linked to this application
          setEditingInterview(null);
          setInterviewForm({
            applicationId: app._id,
            companyName: app.companyName || '',
            role: app.jobRole || '',
            interviewDate: new Date().toISOString().split('T')[0],
            interviewMode: 'Online',
            overallStatus: 'In Process',
            
            aptitudeAttended: false,
            aptitudePlatform: '',
            aptitudeTopics: '',
            aptitudeQuestions: '',
            aptitudeDifficulty: 'Medium',
            aptitudeResult: 'Pending',
            aptitudeNotes: '',

            commAttended: false,
            commTopics: '',
            commQuestions: '',
            commDifficulty: 'Medium',
            commResult: 'Pending',
            commNotes: '',

            techAttended: false,
            techTopics: '',
            techCodingQuestions: '',
            techDifficulty: 'Medium',
            techResult: 'Pending',
            techNotes: '',

            hrAttended: false,
            hrDiscussion: '',
            hrResult: 'Pending',
            hrNotes: '',

            overallExperience: '',
            tipsAndLearnings: ''
          });
        }
      }
    } else {
      setEditingInterview(null);
      setInterviewForm({
        applicationId: '',
        companyName: '',
        role: '',
        interviewDate: new Date().toISOString().split('T')[0],
        interviewMode: 'Online',
        overallStatus: 'In Process',
        
        aptitudeAttended: false,
        aptitudePlatform: '',
        aptitudeTopics: '',
        aptitudeQuestions: '',
        aptitudeDifficulty: 'Medium',
        aptitudeResult: 'Pending',
        aptitudeNotes: '',

        commAttended: false,
        commTopics: '',
        commQuestions: '',
        commDifficulty: 'Medium',
        commResult: 'Pending',
        commNotes: '',

        techAttended: false,
        techTopics: '',
        techCodingQuestions: '',
        techDifficulty: 'Medium',
        techResult: 'Pending',
        techNotes: '',

        hrAttended: false,
        hrDiscussion: '',
        hrResult: 'Pending',
        hrNotes: '',

        overallExperience: '',
        tipsAndLearnings: ''
      });
    }
    setIsInterviewModalOpen(true);
  };

  const handleSaveInterview = async (e) => {
    e.preventDefault();
    if (!interviewForm.companyName.trim()) {
      toast.error('Company name is required');
      return;
    }

    setSubmittingInterview(true);
    try {
      const payload = {
        applicationId: interviewForm.applicationId || undefined,
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
          result: interviewForm.aptitudeResult,
          notes: interviewForm.aptitudeNotes.trim()
        },
        communicationRound: {
          attended: interviewForm.commAttended,
          platformOrMode: 'Online / In-Person',
          topicsCovered: interviewForm.commTopics.trim(),
          questionsAsked: interviewForm.commQuestions.trim(),
          difficulty: interviewForm.commDifficulty,
          result: interviewForm.commResult,
          notes: interviewForm.commNotes.trim()
        },
        technicalRound: {
          attended: interviewForm.techAttended,
          platformOrMode: 'Online / In-Person',
          topicsCovered: interviewForm.techTopics.trim(),
          questionsAsked: interviewForm.techCodingQuestions.trim(),
          difficulty: interviewForm.techDifficulty,
          result: interviewForm.techResult,
          notes: interviewForm.techNotes.trim()
        },
        hrRound: {
          attended: interviewForm.hrAttended,
          platformOrMode: 'In-Person / Call',
          topicsCovered: 'HR & Management',
          questionsAsked: interviewForm.hrDiscussion.trim(),
          difficulty: 'Easy',
          result: interviewForm.hrResult,
          notes: interviewForm.hrNotes.trim()
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
      if (!res.ok) throw new Error(data.message || 'Saving interview feedback failed');

      toast.success(editingInterview ? 'Interview feedback updated!' : '🎉 Interview feedback & round logs saved!');
      setIsInterviewModalOpen(false);
      fetchAllData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingInterview(false);
    }
  };

  const handleDeleteInterview = async (id) => {
    if (!window.confirm('Delete this interview record?')) return;
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
  // HANDLERS: DAILY TASK LOGS
  // ----------------------------------------------------
  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskForm.taskWorkProcess.trim()) {
      toast.error('Task / Work description is required');
      return;
    }

    setSubmittingTask(true);
    try {
      const res = await fetch(buildApiUrl('/daily-activities'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          date: taskForm.date,
          companyApply: taskForm.companyApply.trim() || 'Daily Practice / Study',
          taskWorkProcess: taskForm.taskWorkProcess.trim(),
          remarks: taskForm.remarks.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Saving task log failed');

      toast.success('Daily task log saved!');
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

  // Helper to match interviews to applications
  const getInterviewForApp = (app) => {
    return interviews.find(i => 
      (i.applicationId && i.applicationId === app._id) || 
      (i.companyName && i.companyName.toLowerCase().trim() === app.companyName.toLowerCase().trim())
    );
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = (app.companyName || '').toLowerCase().includes(pipelineSearch.toLowerCase()) ||
                          (app.jobRole || '').toLowerCase().includes(pipelineSearch.toLowerCase()) ||
                          (app.hrDetails?.name || '').toLowerCase().includes(pipelineSearch.toLowerCase());
    
    if (pipelineStatusFilter === 'All') return matchesSearch;
    if (pipelineStatusFilter === 'Placed') return matchesSearch && ['Placed', 'Offer Received', 'Selected / Placed'].includes(app.status);
    if (pipelineStatusFilter === 'In Process') return matchesSearch && ['In Process', 'Interview Scheduled', 'Under Review', 'Shortlisted'].includes(app.status);
    if (pipelineStatusFilter === 'Pending') return matchesSearch && ['Pending Feedback', 'Mail Sent'].includes(app.status);
    if (pipelineStatusFilter === 'On Hold') return matchesSearch && app.status === 'On Hold';
    if (pipelineStatusFilter === 'Rejected') return matchesSearch && app.status === 'Rejected';
    if (pipelineStatusFilter === 'Applied') return matchesSearch && app.status === 'Applied';

    return matchesSearch && app.status === pipelineStatusFilter;
  });

  const filteredInterviews = interviews.filter(int => {
    const matchesSearch = (int.companyName || '').toLowerCase().includes(interviewSearch.toLowerCase()) ||
                          (int.role || '').toLowerCase().includes(interviewSearch.toLowerCase()) ||
                          (int.technicalRound?.topicsCovered || '').toLowerCase().includes(interviewSearch.toLowerCase()) ||
                          (int.technicalRound?.questionsAsked || '').toLowerCase().includes(interviewSearch.toLowerCase());
    
    if (interviewStatusFilter === 'All') return matchesSearch;
    return matchesSearch && int.overallStatus === interviewStatusFilter;
  });

  const filteredTasks = taskLogs.filter(t => {
    return (t.taskWorkProcess || '').toLowerCase().includes(taskSearch.toLowerCase()) ||
           (t.companyApply || '').toLowerCase().includes(taskSearch.toLowerCase());
  });

  return (
    <AppShell
      title="Company Placement Pipeline & Daily Tracker"
      subtitle="Register companies once, track interview rounds (Aptitude, Communication, Technical, Final HR), log outcomes, and record daily practice tasks."
      searchPlaceholder="Search company applications..."
    >
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total Companies Applied"
          value={`${telemetry.totalApplied}`}
          helper="Applications logged"
          tone="primary"
          icon={<Building2 size={20} />}
        />
        <MetricCard
          title="Active in Pipeline"
          value={`${telemetry.inProcess}`}
          helper="In process / Interviewing"
          tone="warning"
          icon={<Briefcase size={20} />}
        />
        <MetricCard
          title="Offers & Placements"
          value={`${telemetry.placedCount}`}
          helper="Selected / Placed offers"
          tone="success"
          icon={<Award size={20} />}
        />
        <MetricCard
          title="Daily Study Logs"
          value={`${taskLogs.length}`}
          helper={`${telemetry.totalHours} hrs clocked`}
          tone="neutral"
          icon={<Clock size={20} />}
        />
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm shrink-0 ${
            activeTab === 'pipeline'
              ? 'bg-blue-600 text-white shadow-blue-200'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Building2 size={16} />
          <span>🏢 Company Placement Pipeline ({applications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('interviews')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm shrink-0 ${
            activeTab === 'interviews'
              ? 'bg-blue-600 text-white shadow-blue-200'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <MessageSquare size={16} />
          <span>🗣️ Interview Round Experiences ({interviews.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm shrink-0 ${
            activeTab === 'tasks'
              ? 'bg-blue-600 text-white shadow-blue-200'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <FileText size={16} />
          <span>📝 Daily Practice & Task Logs ({taskLogs.length})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: COMPANY PLACEMENT PIPELINE & ROUND TRACKER         */}
      {/* ========================================================= */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          {/* Action Bar & Filters */}
          <SurfaceCard className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Search & Status Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                <div className="relative w-full sm:w-80">
                  <Search size={15} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search company, job role, HR name..."
                    value={pipelineSearch}
                    onChange={e => setPipelineSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {['All', 'In Process', 'Pending', 'On Hold', 'Placed', 'Rejected', 'Applied'].map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setPipelineStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                        pipelineStatusFilter === status
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Company Button */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenAppModal(null)}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-md shadow-blue-200 transition flex items-center gap-1.5 active:scale-95"
                >
                  <Plus size={15} />
                  <span>+ Register New Company (Step 1)</span>
                </button>
              </div>
            </div>
          </SurfaceCard>

          {/* Applications & Connected Rounds Cards */}
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading company pipeline...</div>
          ) : filteredApplications.length === 0 ? (
            <SurfaceCard className="p-12 text-center space-y-3">
              <Building2 size={36} className="mx-auto text-slate-300" />
              <h3 className="text-base font-black text-slate-800">No company applications found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Register a company you have applied to, and track its Aptitude, Communication, Technical, and HR rounds seamlessly.
              </p>
              <button
                type="button"
                onClick={() => handleOpenAppModal(null)}
                className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition"
              >
                + Register First Company Application
              </button>
            </SurfaceCard>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map(app => {
                const interview = getInterviewForApp(app);
                const isExpanded = expandedPipelineId === app._id;

                const getStatusBadge = (status) => {
                  if (['Placed', 'Offer Received', 'Selected / Placed'].includes(status)) {
                    return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-black text-xs rounded-full border border-emerald-300">🎉 Placed / Offer</span>;
                  }
                  if (status === 'Rejected') {
                    return <span className="px-3 py-1 bg-red-100 text-red-800 font-black text-xs rounded-full border border-red-300">❌ Rejected</span>;
                  }
                  if (['In Process', 'Interview Scheduled', 'Shortlisted'].includes(status)) {
                    return <span className="px-3 py-1 bg-blue-100 text-blue-800 font-black text-xs rounded-full border border-blue-300">⚡ In Process</span>;
                  }
                  if (status === 'On Hold') {
                    return <span className="px-3 py-1 bg-amber-100 text-amber-800 font-black text-xs rounded-full border border-amber-300">⏸️ On Hold</span>;
                  }
                  if (status === 'Pending Feedback') {
                    return <span className="px-3 py-1 bg-purple-100 text-purple-800 font-black text-xs rounded-full border border-purple-300">⏳ Pending Feedback</span>;
                  }
                  return <span className="px-3 py-1 bg-slate-100 text-slate-700 font-black text-xs rounded-full border border-slate-300">{status}</span>;
                };

                return (
                  <SurfaceCard key={app._id} className="p-5 space-y-4 hover:shadow-md transition">
                    {/* Header: Company Name, Role, Date, Status */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-black text-slate-900">{app.companyName}</h3>
                          <span className="text-xs font-bold text-slate-500">• {app.jobRole || 'Software Engineer'}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                            {app.applicationType}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span>Applied: {new Date(app.applyDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          {app.jobLink && (
                            <a
                              href={app.jobLink.startsWith('http') ? app.jobLink : `https://${app.jobLink}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                            >
                              <span>Job Link</span>
                              <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {getStatusBadge(app.status)}
                      </div>
                    </div>

                    {/* Stepper: Interview Rounds Progression */}
                    <div className="p-3.5 bg-slate-50/70 border border-slate-200/70 rounded-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          Interview Progression Rounds (Step 2)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenInterviewModal(app)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Zap size={12} className="text-amber-500" />
                          <span>{interview ? 'Update Round Feedback' : '+ Add Interview Feedback'}</span>
                        </button>
                      </div>

                      {/* 4-Round Badges */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {/* Aptitude */}
                        <div className={`p-2 rounded-xl border text-center text-xs ${
                          interview?.aptitudeRound?.attended
                            ? interview.aptitudeRound.result === 'Cleared'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                              : interview.aptitudeRound.result === 'Not Cleared'
                              ? 'bg-red-50 border-red-200 text-red-900 font-bold'
                              : 'bg-blue-50 border-blue-200 text-blue-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}>
                          <span className="text-[10px] block text-slate-500">Round 1: Aptitude</span>
                          <span className="font-black">
                            {interview?.aptitudeRound?.attended ? (interview.aptitudeRound.result || 'Attended') : 'Not Started'}
                          </span>
                        </div>

                        {/* Communication / GD */}
                        <div className={`p-2 rounded-xl border text-center text-xs ${
                          interview?.communicationRound?.attended
                            ? interview.communicationRound.result === 'Cleared'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                              : interview.communicationRound.result === 'Not Cleared'
                              ? 'bg-red-50 border-red-200 text-red-900 font-bold'
                              : 'bg-blue-50 border-blue-200 text-blue-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}>
                          <span className="text-[10px] block text-slate-500">Round 2: Communication</span>
                          <span className="font-black">
                            {interview?.communicationRound?.attended ? (interview.communicationRound.result || 'Attended') : 'Not Started'}
                          </span>
                        </div>

                        {/* Technical */}
                        <div className={`p-2 rounded-xl border text-center text-xs ${
                          interview?.technicalRound?.attended
                            ? interview.technicalRound.result === 'Cleared'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                              : interview.technicalRound.result === 'Not Cleared'
                              ? 'bg-red-50 border-red-200 text-red-900 font-bold'
                              : 'bg-blue-50 border-blue-200 text-blue-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}>
                          <span className="text-[10px] block text-slate-500">Round 3: Technical</span>
                          <span className="font-black">
                            {interview?.technicalRound?.attended ? (interview.technicalRound.result || 'Attended') : 'Not Started'}
                          </span>
                        </div>

                        {/* Final HR */}
                        <div className={`p-2 rounded-xl border text-center text-xs ${
                          interview?.hrRound?.attended
                            ? interview.hrRound.result === 'Cleared'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                              : interview.hrRound.result === 'Not Cleared'
                              ? 'bg-red-50 border-red-200 text-red-900 font-bold'
                              : 'bg-blue-50 border-blue-200 text-blue-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}>
                          <span className="text-[10px] block text-slate-500">Round 4: Final HR</span>
                          <span className="font-black">
                            {interview?.hrRound?.attended ? (interview.hrRound.result || 'Attended') : 'Not Started'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* HR Contact & Notes Collapsible */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
                      <div className="flex items-center gap-4 flex-wrap">
                        {app.hrDetails?.name && (
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <UserCheck size={13} className="text-blue-600" />
                            HR: {app.hrDetails.name}
                          </span>
                        )}
                        {app.hrDetails?.email && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Mail size={13} className="text-slate-400" />
                            {app.hrDetails.email}
                          </span>
                        )}
                        {app.hrDetails?.phone && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Phone size={13} className="text-slate-400" />
                            {app.hrDetails.phone}
                          </span>
                        )}
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setExpandedPipelineId(isExpanded ? null : app._id)}
                          className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <span>{isExpanded ? 'Hide Details' : 'View Audit'}</span>
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenAppModal(app)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Company Details"
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteApplication(app._id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Detail Audit View */}
                    {isExpanded && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3 animate-in fade-in">
                        {app.notes && (
                          <div>
                            <span className="font-bold text-slate-800 block mb-0.5">Application Notes:</span>
                            <p className="text-slate-600 leading-relaxed">{app.notes}</p>
                          </div>
                        )}

                        {interview && (
                          <div className="space-y-2 pt-2 border-t border-slate-200">
                            <span className="font-bold text-slate-900 block">Interview Round Questions & Feedback:</span>
                            
                            {interview.aptitudeRound?.attended && (
                              <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="font-bold text-blue-900">Aptitude:</span> {interview.aptitudeRound.topicsCovered} | Platform: {interview.aptitudeRound.platformOrMode || 'Online'}
                                {interview.aptitudeRound.questionsAsked && <p className="text-slate-600 text-[11px]">Questions: {interview.aptitudeRound.questionsAsked}</p>}
                              </div>
                            )}

                            {interview.technicalRound?.attended && (
                              <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1">
                                <span className="font-bold text-indigo-900">Technical Topics & Stack:</span> {interview.technicalRound.topicsCovered}
                                {interview.technicalRound.questionsAsked && (
                                  <p className="text-slate-700 text-[11px] font-mono whitespace-pre-line bg-slate-50 p-2 rounded-lg mt-1">
                                    {interview.technicalRound.questionsAsked}
                                  </p>
                                )}
                              </div>
                            )}

                            {interview.tipsAndLearnings && (
                              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-950">
                                <span className="font-bold">Key Learnings for Peers:</span> {interview.tipsAndLearnings}
                              </div>
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

      {/* ========================================================= */}
      {/* TAB 2: INTERVIEW ROUND EXPERIENCES & QUESTIONS            */}
      {/* ========================================================= */}
      {activeTab === 'interviews' && (
        <div className="space-y-6">
          <SurfaceCard className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search size={15} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search interview company, questions, tech stack..."
                  value={interviewSearch}
                  onChange={e => setInterviewSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <button
                type="button"
                onClick={() => handleOpenInterviewModal(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <Plus size={15} />
                <span>+ Log Interview Feedback</span>
              </button>
            </div>
          </SurfaceCard>

          {filteredInterviews.length === 0 ? (
            <SurfaceCard className="p-12 text-center text-slate-400 text-xs">
              No interview experiences logged yet. Click "+ Log Interview Feedback" or log directly from your Company Pipeline cards!
            </SurfaceCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredInterviews.map(int => (
                <SurfaceCard key={int._id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-base font-black text-slate-900">{int.companyName}</h4>
                      <span className="text-xs text-slate-500 font-bold">{int.role || 'Software Engineer'} • {int.interviewMode}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenInterviewModal(int)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteInterview(int._id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Rounds Summary Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {int.aptitudeRound?.attended && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded-md text-[10px] font-bold">
                        Aptitude: {int.aptitudeRound.result}
                      </span>
                    )}
                    {int.communicationRound?.attended && (
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-800 rounded-md text-[10px] font-bold">
                        Comm/GD: {int.communicationRound.result}
                      </span>
                    )}
                    {int.technicalRound?.attended && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded-md text-[10px] font-bold">
                        Tech: {int.technicalRound.result}
                      </span>
                    )}
                    {int.hrRound?.attended && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md text-[10px] font-bold">
                        HR: {int.hrRound.result}
                      </span>
                    )}
                  </div>

                  {int.technicalRound?.questionsAsked && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                      <span className="font-bold text-slate-800 block">Coding & Technical Questions Asked:</span>
                      <p className="text-slate-600 font-mono text-[11px] whitespace-pre-line leading-relaxed">
                        {int.technicalRound.questionsAsked}
                      </p>
                    </div>
                  )}

                  {int.tipsAndLearnings && (
                    <p className="text-xs text-amber-800 font-medium bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60">
                      💡 {int.tipsAndLearnings}
                    </p>
                  )}
                </SurfaceCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: DAILY STUDY & TASK LOGS                            */}
      {/* ========================================================= */}
      {activeTab === 'tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Submit Log Form */}
          <div>
            <SurfaceCard className="p-5 space-y-4 sticky top-6">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <FileText size={16} className="text-blue-600" />
                <span>Record Daily Task / Learning Log</span>
              </h3>

              <form onSubmit={handleSaveTask} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    value={taskForm.date}
                    onChange={e => setTaskForm({ ...taskForm, date: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Topic / Company Focus</label>
                  <input
                    type="text"
                    placeholder="e.g. React Redux state management, LeetCode Trees..."
                    value={taskForm.companyApply}
                    onChange={e => setTaskForm({ ...taskForm, companyApply: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">What did you learn & code today? *</label>
                  <textarea
                    rows={4}
                    placeholder="Describe solved problems, Git commits, concepts mastered..."
                    value={taskForm.taskWorkProcess}
                    onChange={e => setTaskForm({ ...taskForm, taskWorkProcess: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 leading-relaxed"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Remarks / Key Learnings</label>
                  <input
                    type="text"
                    placeholder="Optional remarks or blockers..."
                    value={taskForm.remarks}
                    onChange={e => setTaskForm({ ...taskForm, remarks: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingTask}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {submittingTask ? 'Saving...' : 'Save Daily Activity Log'}
                </button>
              </form>
            </SurfaceCard>
          </div>

          {/* Right: History of Task Logs */}
          <div className="lg:col-span-2 space-y-4">
            <SurfaceCard className="p-4">
              <div className="relative w-full">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search daily activity logs..."
                  value={taskSearch}
                  onChange={e => setTaskSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>
            </SurfaceCard>

            {filteredTasks.length === 0 ? (
              <SurfaceCard className="p-12 text-center text-slate-400 text-xs">
                No daily task logs recorded yet.
              </SurfaceCard>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map(log => (
                  <SurfaceCard key={log._id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-slate-900">{log.companyApply || 'Daily Learning'}</span>
                      <span className="text-slate-400 font-medium">
                        {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-medium">
                      {log.taskWorkProcess}
                    </p>
                    {log.remarks && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                        Note: {log.remarks}
                      </p>
                    )}
                  </SurfaceCard>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: REGISTER / EDIT COMPANY APPLICATION (STEP 1)     */}
      {/* ========================================================= */}
      {isAppModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">Step 1: One-Time Company Registration</span>
                <h3 className="text-base font-black text-slate-900">
                  {editingApp ? 'Edit Company Application' : 'Register New Company Application'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAppModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveApplication} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Company Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Google, Zoho, TCS, Accenture..."
                    value={appForm.companyName}
                    onChange={e => setAppForm({ ...appForm, companyName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Job Role / Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Frontend Developer, SDE-1..."
                    value={appForm.jobRole}
                    onChange={e => setAppForm({ ...appForm, jobRole: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Application Date</label>
                  <input
                    type="date"
                    value={appForm.applyDate}
                    onChange={e => setAppForm({ ...appForm, applyDate: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Application Channel</label>
                  <select
                    value={appForm.applicationType}
                    onChange={e => setAppForm({ ...appForm, applicationType: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="Email Outreach">Email Outreach</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Job Portal">Job Portal (Naukri/Indeed)</option>
                    <option value="Career Site">Company Career Site</option>
                    <option value="Campus Drive">Campus Drive</option>
                    <option value="Referral">Referral</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Recruitment Status</label>
                <select
                  value={appForm.status}
                  onChange={e => setAppForm({ ...appForm, status: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold text-blue-900"
                >
                  <option value="Applied">Applied (Initial Submission)</option>
                  <option value="Mail Sent">Mail Sent / Awaiting Response</option>
                  <option value="In Process">In Process / Interviewing</option>
                  <option value="Pending Feedback">Pending Feedback</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Placed">🎉 Placed / Offer Received</option>
                  <option value="Rejected">❌ Rejected</option>
                </select>
              </div>

              {/* Job Link & HR Details */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Job Description / Posting Link</label>
                <input
                  type="text"
                  placeholder="https://linkedin.com/jobs/view/... or career site URL"
                  value={appForm.jobLink}
                  onChange={e => setAppForm({ ...appForm, jobLink: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-black text-slate-800 block text-[11px]">HR Contact Information</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="HR Name"
                    value={appForm.hrName}
                    onChange={e => setAppForm({ ...appForm, hrName: e.target.value })}
                    className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="email"
                    placeholder="HR Email (e.g. hr@company.com)"
                    value={appForm.hrEmail}
                    onChange={e => setAppForm({ ...appForm, hrEmail: e.target.value })}
                    className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="HR Phone / Mobile"
                    value={appForm.hrPhone}
                    onChange={e => setAppForm({ ...appForm, hrPhone: e.target.value })}
                    className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="HR LinkedIn Profile URL"
                    value={appForm.hrLinkedin}
                    onChange={e => setAppForm({ ...appForm, hrLinkedin: e.target.value })}
                    className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Application Notes</label>
                <textarea
                  rows={2}
                  placeholder="Notes on resume version submitted, referral source, etc."
                  value={appForm.notes}
                  onChange={e => setAppForm({ ...appForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAppModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApp}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submittingApp ? 'Saving...' : editingApp ? 'Update Company Record' : 'Save Company Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: INTERVIEW ROUNDS FEEDBACK & EXPERIENCE (STEP 2)  */}
      {/* ========================================================= */}
      {isInterviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Step 2: Log Interview Feedback & Rounds</span>
                <h3 className="text-base font-black text-slate-900">
                  {editingInterview ? 'Update Interview Round Logs' : 'Log Interview Experience & Rounds'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsInterviewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveInterview} className="space-y-4 text-xs">
              {/* Company Selection or Entry */}
              <div className="p-3.5 bg-indigo-50/50 border border-indigo-200/60 rounded-2xl space-y-2">
                <span className="font-black text-indigo-900 block text-xs">Select Registered Company or Type Name</span>
                
                {applications.length > 0 && (
                  <div className="mb-2">
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Pick from Applied Companies:</label>
                    <select
                      value={interviewForm.applicationId || ''}
                      onChange={e => {
                        const selectedAppId = e.target.value;
                        const app = applications.find(a => a._id === selectedAppId);
                        if (app) {
                          setInterviewForm(prev => ({
                            ...prev,
                            applicationId: app._id,
                            companyName: app.companyName,
                            role: app.jobRole || prev.role
                          }));
                        } else {
                          setInterviewForm(prev => ({ ...prev, applicationId: '' }));
                        }
                      }}
                      className="w-full p-2 bg-white border border-indigo-200 rounded-xl outline-none font-bold text-slate-900"
                    >
                      <option value="">-- Choose from Registered Companies --</option>
                      {applications.map(app => (
                        <option key={app._id} value={app._id}>
                          {app.companyName} ({app.jobRole || 'Software Engineer'}) — {app.status}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Company Name *</label>
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={interviewForm.companyName}
                      onChange={e => setInterviewForm({ ...interviewForm, companyName: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Role / Designation</label>
                    <input
                      type="text"
                      placeholder="Role"
                      value={interviewForm.role}
                      onChange={e => setInterviewForm({ ...interviewForm, role: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Date, Mode & Overall Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Interview Date</label>
                  <input
                    type="date"
                    value={interviewForm.interviewDate}
                    onChange={e => setInterviewForm({ ...interviewForm, interviewDate: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Interview Mode</label>
                  <select
                    value={interviewForm.interviewMode}
                    onChange={e => setInterviewForm({ ...interviewForm, interviewMode: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                  >
                    <option value="Online">Online / Video Call</option>
                    <option value="In-Person">In-Person (Office / Campus)</option>
                    <option value="Telephonic">Telephonic Call</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Overall Company Status</label>
                  <select
                    value={interviewForm.overallStatus}
                    onChange={e => setInterviewForm({ ...interviewForm, overallStatus: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-indigo-950"
                  >
                    <option value="In Process">In Process / Scheduled</option>
                    <option value="Pending Feedback">Pending Feedback</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Placed / Selected">🎉 Placed / Selected</option>
                    <option value="Rejected">❌ Rejected</option>
                  </select>
                </div>
              </div>

              {/* ROUND 1: APTITUDE ROUND */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-black text-slate-900 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={interviewForm.aptitudeAttended}
                      onChange={e => setInterviewForm({ ...interviewForm, aptitudeAttended: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Round 1: Quantitative / Aptitude Round</span>
                  </label>

                  {interviewForm.aptitudeAttended && (
                    <select
                      value={interviewForm.aptitudeResult}
                      onChange={e => setInterviewForm({ ...interviewForm, aptitudeResult: e.target.value })}
                      className="text-[11px] p-1 bg-white border border-slate-200 rounded-lg font-bold"
                    >
                      <option value="Cleared">Cleared ✓</option>
                      <option value="Pending">Pending</option>
                      <option value="Not Cleared">Not Cleared ✕</option>
                      <option value="N/A">N/A</option>
                    </select>
                  )}
                </div>

                {interviewForm.aptitudeAttended && (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Platform (e.g. HackerRank, Mettle)"
                        value={interviewForm.aptitudePlatform}
                        onChange={e => setInterviewForm({ ...interviewForm, aptitudePlatform: e.target.value })}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Topics (e.g. Time & Work, Percentage)"
                        value={interviewForm.aptitudeTopics}
                        onChange={e => setInterviewForm({ ...interviewForm, aptitudeTopics: e.target.value })}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Questions or problem types asked in aptitude..."
                      value={interviewForm.aptitudeQuestions}
                      onChange={e => setInterviewForm({ ...interviewForm, aptitudeQuestions: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                )}
              </div>

              {/* ROUND 2: COMMUNICATION / GD ROUND */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-black text-slate-900 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={interviewForm.commAttended}
                      onChange={e => setInterviewForm({ ...interviewForm, commAttended: e.target.checked })}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span>Round 2: Communication / Group Discussion Round</span>
                  </label>

                  {interviewForm.commAttended && (
                    <select
                      value={interviewForm.commResult}
                      onChange={e => setInterviewForm({ ...interviewForm, commResult: e.target.value })}
                      className="text-[11px] p-1 bg-white border border-slate-200 rounded-lg font-bold"
                    >
                      <option value="Cleared">Cleared ✓</option>
                      <option value="Pending">Pending</option>
                      <option value="Not Cleared">Not Cleared ✕</option>
                      <option value="N/A">N/A</option>
                    </select>
                  )}
                </div>

                {interviewForm.commAttended && (
                  <div className="space-y-2 pt-1">
                    <input
                      type="text"
                      placeholder="Discussion Topics (e.g. AI impact on software jobs, Self-intro)"
                      value={interviewForm.commTopics}
                      onChange={e => setInterviewForm({ ...interviewForm, commTopics: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <textarea
                      rows={2}
                      placeholder="Speaking questions, JAM topics, or GD feedback..."
                      value={interviewForm.commQuestions}
                      onChange={e => setInterviewForm({ ...interviewForm, commQuestions: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                )}
              </div>

              {/* ROUND 3: TECHNICAL ROUND */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-black text-slate-900 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={interviewForm.techAttended}
                      onChange={e => setInterviewForm({ ...interviewForm, techAttended: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span>Round 3: Technical Coding & Theory Round</span>
                  </label>

                  {interviewForm.techAttended && (
                    <select
                      value={interviewForm.techResult}
                      onChange={e => setInterviewForm({ ...interviewForm, techResult: e.target.value })}
                      className="text-[11px] p-1 bg-white border border-slate-200 rounded-lg font-bold"
                    >
                      <option value="Cleared">Cleared ✓</option>
                      <option value="Pending">Pending</option>
                      <option value="Not Cleared">Not Cleared ✕</option>
                      <option value="N/A">N/A</option>
                    </select>
                  )}
                </div>

                {interviewForm.techAttended && (
                  <div className="space-y-2 pt-1">
                    <input
                      type="text"
                      placeholder="Tech Stack / Topics (e.g. React hooks, Node.js, MongoDB, DSA Strings)"
                      value={interviewForm.techTopics}
                      onChange={e => setInterviewForm({ ...interviewForm, techTopics: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-indigo-900"
                    />
                    <textarea
                      rows={3}
                      placeholder="Exact Coding challenges and Technical questions asked..."
                      value={interviewForm.techCodingQuestions}
                      onChange={e => setInterviewForm({ ...interviewForm, techCodingQuestions: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                )}
              </div>

              {/* ROUND 4: FINAL HR / MANAGERIAL ROUND */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-black text-slate-900 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={interviewForm.hrAttended}
                      onChange={e => setInterviewForm({ ...interviewForm, hrAttended: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span>Round 4: Final HR / Managerial Round</span>
                  </label>

                  {interviewForm.hrAttended && (
                    <select
                      value={interviewForm.hrResult}
                      onChange={e => setInterviewForm({ ...interviewForm, hrResult: e.target.value })}
                      className="text-[11px] p-1 bg-white border border-slate-200 rounded-lg font-bold"
                    >
                      <option value="Cleared">Cleared ✓</option>
                      <option value="Pending">Pending</option>
                      <option value="Not Cleared">Not Cleared ✕</option>
                      <option value="N/A">N/A</option>
                    </select>
                  )}
                </div>

                {interviewForm.hrAttended && (
                  <div className="pt-1">
                    <textarea
                      rows={2}
                      placeholder="HR questions, salary discussion, location preference notes..."
                      value={interviewForm.hrDiscussion}
                      onChange={e => setInterviewForm({ ...interviewForm, hrDiscussion: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Tips & Learnings for Peers */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Key Learnings & Guidance for Batchmates</label>
                <textarea
                  rows={2}
                  placeholder="Tips on how to crack this company, topics to focus on..."
                  value={interviewForm.tipsAndLearnings}
                  onChange={e => setInterviewForm({ ...interviewForm, tipsAndLearnings: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInterviewModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInterview}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submittingInterview ? 'Saving...' : editingInterview ? 'Update Interview Logs' : 'Save Interview Round Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
