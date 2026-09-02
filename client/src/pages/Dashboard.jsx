import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Activity,
  BriefcaseBusiness,
  CheckCircle2,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  Check,
  X,
  BookOpen,
  Award,
  ShieldCheck,
  Bookmark,
  Download,
  Briefcase,
  ExternalLink,
  Mail,
  Gamepad2,
  Sparkles,
  Layers,
  ChevronRight,
  Eye,
  Filter
} from 'lucide-react';
import { AppShell, MetricCard, SectionTabs, StatusBadge, SurfaceCard } from '../components/AppShell';
import { authHeaders, logout } from '../utils/auth';
import { buildApiUrl, cachedGet } from '../utils/api';
import { exportToExcel } from '../utils/excelExporter';

function getNormalizedYear(student) {
  let yr = student.passedOutYear;
  const lowerYr = yr ? String(yr).trim().toLowerCase() : '';
  if (!yr || lowerYr === 'need to filled' || lowerYr === 'undefined' || lowerYr === '') {
    yr = student.batch;
  }
  yr = (yr && typeof yr === 'string') ? yr.trim() : '';
  return yr || 'Not Specified';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDashboardSegment, setActiveDashboardSegment] = useState('overview'); // 'overview' | 'outreach' | 'telemetry' | 'analytics'

  // Interactive filters
  const [filterYear, setFilterYear] = useState('All');
  const [filterGrade, setFilterGrade] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterBatch, setFilterBatch] = useState('All');

  // All student records for dynamic filtering
  const [allStudents, setAllStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  // Leave Requests state
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leavesLoading, setLeavesLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

  const fetchLeaveRequests = () => {
    fetch(buildApiUrl('/leaves'), { headers: { ...authHeaders() } })
      .then(res => {
        if (res.status === 401) {
          logout();
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data)) {
          setLeaveRequests(data.filter(r => r.status === 'Pending'));
        }
        setLeavesLoading(false);
      })
      .catch(() => setLeavesLoading(false));
  };

  const handleReviewLeave = async (id, status) => {
    setSubmittingId(id);
    try {
      const res = await fetch(buildApiUrl(`/leaves/${id}/status`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ status, reviewerRemarks: 'Approved via Dashboard Quick Action' })
      });

      if (res.ok) {
        toast.success(`Leave request ${status.toLowerCase()}!`);
        fetchLeaveRequests();
      } else {
        const errData = await res.json();
        toast.error(errData.message || 'Failed to review request');
      }
    } catch (err) {
      toast.error('Error reviewing request');
    } finally {
      setSubmittingId(null);
    }
  };

  const loadDashboardStats = () => {
    cachedGet('/students/stats')
      .then(data => {
        if (data) setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    cachedGet('/students?all=true')
      .then(data => {
        if (data && Array.isArray(data)) {
          setAllStudents(data);
        }
        setStudentsLoading(false);
      })
      .catch(() => setStudentsLoading(false));

    fetchLeaveRequests();
  };

  useEffect(() => {
    loadDashboardStats();
  }, []);

  // Filtered students derivation
  const filteredStudents = useMemo(() => {
    return allStudents.filter(s => {
      const yr = getNormalizedYear(s);
      if (filterYear !== 'All' && yr !== filterYear) return false;

      let grade = s.grade ? s.grade.trim().toUpperCase() : 'No Grade';
      if (!grade || grade === 'UNDEFINED' || grade === '') grade = 'No Grade';
      if (filterGrade !== 'All') {
        if (filterGrade === 'No Grade') {
          if (grade !== 'No Grade') return false;
        } else {
          if (grade !== filterGrade) return false;
        }
      }

      const isSpl = s.studentType === 'SPL' || (s.enrollments && s.enrollments.includes('SPL'));
      const isFrontend = s.isFrontend || s.studentType === 'Frontend';
      
      if (filterType !== 'All') {
        if (filterType === 'Regular' && !s.enrollments?.includes('Regular') && s.studentType !== 'Regular') return false;
        if (filterType === 'Frontend' && !isFrontend) return false;
        if (filterType === 'SPL' && !isSpl) return false;
      }

      const status = (s.currentStatus || s.status || 'Need to filled').trim().toLowerCase();
      if (filterStatus !== 'All') {
        if (filterStatus === 'Needs Update') {
          if (status !== 'need to filled' && status !== 'new') return false;
        } else if (filterStatus === 'Inactive/Suspend') {
          if (!status.includes('inactive') && !status.includes('suspend')) return false;
        } else {
          if (status !== filterStatus.toLowerCase()) return false;
        }
      }

      const batch = s.batch ? s.batch.trim() : '';
      if (filterBatch !== 'All' && batch !== filterBatch) return false;

      return true;
    });
  }, [allStudents, filterYear, filterGrade, filterType, filterStatus, filterBatch]);

  // Options derivation
  const yearOptions = useMemo(() => {
    const years = allStudents.map(s => getNormalizedYear(s)).filter(Boolean);
    return ['All', ...new Set(years)].sort((a, b) => {
      if (a === 'All') return -1;
      if (a === 'Not Specified') return 1;
      if (b === 'Not Specified') return -1;
      return b.localeCompare(a);
    });
  }, [allStudents]);

  const batchOptions = useMemo(() => {
    const batches = allStudents.map(s => s.batch ? s.batch.trim() : '').filter(Boolean);
    return ['All', ...new Set(batches)].sort();
  }, [allStudents]);

  // Dynamic Metrics - ONLY Regular Candidates are part of the Placement Overview!
  const dynamicStats = useMemo(() => {
    if (!stats) return { total: 0, placed: 0, seekers: 0, inactive: 0, needToFilled: 0, rate: 0 };
    
    // When track filter is 'All', default strictly to Regular candidates only (excluding Frontend)
    const targetStudents = filteredStudents.filter(s => {
      if (filterType === 'All') {
        return !s.isFrontend && s.studentType !== 'Frontend';
      }
      return true;
    });

    const tot = filterType === 'All' && allStudents.length === 0 
      ? (stats.total || 0) 
      : targetStudents.length;
    const plc = filterType === 'All' && allStudents.length === 0 
      ? (stats.placed || 0) 
      : targetStudents.filter(s => (s.currentStatus || s.status)?.toLowerCase() === 'placed').length;
    const seekers = filterType === 'All' && allStudents.length === 0 
      ? (stats.jobSeekers || 0) 
      : targetStudents.filter(s => (s.currentStatus || s.status)?.toLowerCase() === 'job seeker').length;
    const inact = filterType === 'All' && allStudents.length === 0 
      ? (stats.inactiveUsers || 0) 
      : targetStudents.filter(s => {
          const st = (s.currentStatus || s.status || '').toLowerCase();
          return st.includes('inactive') || st.includes('suspend');
        }).length;
    const needsUpdate = filterType === 'All' && allStudents.length === 0 
      ? (stats.needToFilled || 0) 
      : targetStudents.filter(s => (s.currentStatus || s.status)?.toLowerCase() === 'need to filled' || !s.currentStatus).length;

    return {
      total: tot,
      placed: plc,
      seekers: seekers,
      inactive: inact,
      needToFilled: needsUpdate,
      rate: tot > 0 ? Math.round((plc / tot) * 100) : 0
    };
  }, [filteredStudents, allStudents, filterType, stats]);

  // Telemetry safe access
  const telemetry = stats?.telemetry || {
    attendance: { checkedIn: 0, checkedOut: 0, onLeave: 0 },
    tasks: { completed: 0, pending: 0, review: 0 },
    applications: { total: 0, today: 0, shortlisted: 0, recent: [] },
    interviews: { total: 0, cleared: 0, recent: [] },
    leaves: { pending: 0 },
    teams: { total: 0 },
    recentActivityLogs: []
  };

  // Pivot data for grade matrix
  const uiPivotData = useMemo(() => {
    const yearsMap = {};
    filteredStudents.forEach(s => {
      const yr = getNormalizedYear(s);
      let grade = s.grade ? s.grade.trim().toUpperCase() : 'No Grade';
      if (!grade || grade === 'UNDEFINED' || grade === '') grade = 'No Grade';

      const isPlaced = (s.currentStatus && s.currentStatus.toLowerCase() === 'placed') || 
                       (s.status && s.status.toLowerCase() === 'placed');
      const isSpl = s.studentType === 'SPL' || (s.enrollments && s.enrollments.includes('SPL'));

      if (!yearsMap[yr]) {
        yearsMap[yr] = { year: yr, gradeA: 0, gradeB: 0, gradeC: 0, gradeOther: 0, total: 0, placed: 0, spl: 0 };
      }

      yearsMap[yr].total += 1;
      if (grade === 'A') yearsMap[yr].gradeA += 1;
      else if (grade === 'B') yearsMap[yr].gradeB += 1;
      else if (grade === 'C') yearsMap[yr].gradeC += 1;
      else yearsMap[yr].gradeOther += 1;

      if (isPlaced) yearsMap[yr].placed += 1;
      if (isSpl) yearsMap[yr].spl += 1;
    });

    return Object.values(yearsMap).sort((a, b) => {
      if (a.year === 'Not Specified') return 1;
      if (b.year === 'Not Specified') return -1;
      return b.year.localeCompare(a.year);
    });
  }, [filteredStudents]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <div className="crm-surface flex items-center gap-3 px-6 py-4 rounded-2xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-bold text-slate-700">Loading live executive telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      title="Executive Command Dashboard"
      subtitle="Comprehensive real-time overview of candidate recruitment, outreach pipeline, interview intelligence, and operations."
      searchPlaceholder="Search candidates, companies, or metrics..."
    >
      <SectionTabs
        items={[
          { label: 'Overview', active: true },
          { label: 'Regular Students', onClick: () => navigate('/students') },
          { label: 'Frontend Students', onClick: () => navigate('/admin/frontend-students') },
          { label: 'SPL Class Students', onClick: () => navigate('/spl-registrations') },
          { label: 'Daily Activity Hub', onClick: () => navigate('/admin/daily-activities') },
          { label: 'Placement Eligibility', onClick: () => navigate('/placement/eligibility') },
        ]}
      />

      {/* Top Level Metric KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6">
        <MetricCard
          title="Placement Candidates"
          value={dynamicStats.total}
          helper="Regular placement pool"
          icon={<Users size={20} />}
          tone="neutral"
        />
        <MetricCard
          title="Active Job Seekers"
          value={dynamicStats.seekers}
          helper="Ready for interviews"
          tone="primary"
          icon={<BriefcaseBusiness size={20} />}
        />
        <MetricCard
          title="Inactive / Suspended"
          value={dynamicStats.inactive}
          helper="Inactive or suspended"
          tone="warning"
          icon={<AlertCircle size={20} />}
        />
        <MetricCard
          title="Placed Candidates"
          value={dynamicStats.placed}
          helper={`${dynamicStats.rate}% placement rate`}
          tone="success"
          icon={<Award size={20} />}
        />
        <MetricCard
          title="Company Outreach"
          value={telemetry.applications?.total || 0}
          helper={`${telemetry.applications?.today || 0} applied today`}
          tone="primary"
          icon={<Briefcase size={20} />}
        />
        <MetricCard
          title="Interviews Logged"
          value={telemetry.interviews?.total || 0}
          helper={`${telemetry.interviews?.cleared || 0} cleared / offers`}
          tone="neutral"
          icon={<TrendingUp size={20} />}
        />
      </div>

      {/* Filter Surface & Excel Export */}
      <SurfaceCard className="p-4 mb-6 border border-slate-200 shadow-sm bg-white rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-blue-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Dynamic Multi-Cohort Filter</h3>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              {filteredStudents.length} matching candidates
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFilterYear('All');
                setFilterGrade('All');
                setFilterType('All');
                setFilterStatus('All');
                setFilterBatch('All');
              }}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Reset
            </button>
            <button
              onClick={() => exportToExcel(filteredStudents)}
              disabled={filteredStudents.length === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-200 transition disabled:opacity-50"
            >
              <Download size={13} />
              <span>Export Filtered Excel</span>
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {/* Year Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Graduation Year</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
            >
              {yearOptions.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          {/* Grade Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Assessment Grade</label>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
            >
              <option value="All">All Grades</option>
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
              <option value="No Grade">No Grade</option>
            </select>
          </div>

          {/* Track Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Candidate Track</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
            >
              <option value="All">All Tracks</option>
              <option value="Regular">Regular Directory</option>
              <option value="Frontend">Frontend Track</option>
              <option value="SPL">SPL Class Track</option>
            </select>
          </div>

          {/* Placement Status */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Placement Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Placed">Placed</option>
              <option value="Job Seeker">Job Seeker</option>
              <option value="Needs Update">Needs Update</option>
              <option value="Inactive/Suspend">Inactive / Suspended</option>
              <option value="Interview Process">Interview Process</option>
            </select>
          </div>

          {/* Batch Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Batch Group</label>
            <select
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
            >
              {batchOptions.map(b => (
                <option key={b} value={b}>{b === 'All' ? 'All Batches' : b}</option>
              ))}
            </select>
          </div>
        </div>
      </SurfaceCard>

      {/* Main Segments Switcher */}
      <div className="mb-6 flex gap-1 p-1 bg-slate-100 rounded-2xl max-w-max border border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveDashboardSegment('overview')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeDashboardSegment === 'overview' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles size={14} />
          <span>Real-Time Activity & Outreach Feeds</span>
        </button>

        <button
          onClick={() => setActiveDashboardSegment('outreach')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeDashboardSegment === 'outreach' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Briefcase size={14} />
          <span>Recruitment & Cohort Pipeline</span>
        </button>

        <button
          onClick={() => setActiveDashboardSegment('telemetry')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeDashboardSegment === 'telemetry' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck size={14} />
          <span>Operations & Leave Approvals</span>
        </button>

        <button
          onClick={() => setActiveDashboardSegment('analytics')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeDashboardSegment === 'analytics' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers size={14} />
          <span>Cohort Analytics & Performance Matrix</span>
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SEGMENT 1: REAL-TIME OUTREACH & INTERVIEWS FEEDS */}
      {/* ---------------------------------------------------- */}
      {activeDashboardSegment === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Recent Company Applications */}
          <SurfaceCard className="p-5 md:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Briefcase size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Latest Company Outreach</h3>
                    <p className="text-[11px] text-slate-400">Applications and emails sent by students</p>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/admin/daily-activities')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight size={13} />
                </button>
              </div>

              {telemetry.applications?.recent && telemetry.applications.recent.length > 0 ? (
                <div className="space-y-3">
                  {telemetry.applications.recent.map(app => (
                    <div key={app._id} className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 transition flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-slate-900">{app.companyName}</span>
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-100 text-blue-700">
                            {app.jobRole || 'Trainee'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-600 mt-0.5">
                          Candidate: <strong className="text-slate-800">{app.studentName}</strong>
                        </p>
                        {app.hrDetails?.email && (
                          <p className="text-[11px] text-blue-600 mt-0.5 flex items-center gap-1">
                            <Mail size={11} />
                            <span>{app.hrDetails.email}</span>
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 block mb-1">
                          {app.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(app.applyDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  No recent company applications logged yet.
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Total Logged: <strong>{telemetry.applications?.total || 0}</strong></span>
              <span>Applied Today: <strong>{telemetry.applications?.today || 0}</strong></span>
            </div>
          </SurfaceCard>

          {/* Right Column: Recent Interview Experiences */}
          <SurfaceCard className="p-5 md:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Award size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Latest Interview Experiences</h3>
                    <p className="text-[11px] text-slate-400">Interview questions, rounds, and outcomes</p>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/admin/daily-activities')}
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight size={13} />
                </button>
              </div>

              {telemetry.interviews?.recent && telemetry.interviews.recent.length > 0 ? (
                <div className="space-y-3">
                  {telemetry.interviews.recent.map(int => (
                    <div key={int._id} className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 transition flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-slate-900">{int.companyName}</span>
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-purple-100 text-purple-700">
                            {int.role || 'Software Trainee'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-600 mt-0.5">
                          Candidate: <strong className="text-slate-800">{int.studentName}</strong>
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {int.aptitudeRound?.attended && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800">
                              Aptitude: {int.aptitudeRound.result}
                            </span>
                          )}
                          {int.technicalRound?.attended && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800">
                              Technical: {int.technicalRound.result}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 block mb-1">
                          {int.overallStatus}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(int.interviewDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  No interview experiences recorded yet.
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Total Interviews: <strong>{telemetry.interviews?.total || 0}</strong></span>
              <span>Cleared / Offers: <strong>{telemetry.interviews?.cleared || 0}</strong></span>
            </div>
          </SurfaceCard>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SEGMENT 2: RECRUITMENT & COHORT PIPELINE */}
      {/* ---------------------------------------------------- */}
      {activeDashboardSegment === 'outreach' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SurfaceCard className="p-5 border-l-4 border-l-blue-600">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Regular Students</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{stats?.total || 0}</div>
              <p className="text-xs text-slate-500 mt-1">{stats?.placed || 0} Placed • {stats?.jobSeekers || 0} Active Seekers</p>
            </SurfaceCard>

            <SurfaceCard className="p-5 border-l-4 border-l-emerald-600">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Frontend Track</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{stats?.frontendTotal || 0}</div>
              <p className="text-xs text-slate-500 mt-1">{stats?.frontendPlaced || 0} Placed • {stats?.frontendJobSeekers || 0} Active Seekers</p>
            </SurfaceCard>

            <SurfaceCard className="p-5 border-l-4 border-l-amber-600">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">SPL Class Candidates</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{stats?.splStats?.total || 0}</div>
              <p className="text-xs text-slate-500 mt-1">{stats?.splStats?.placed || 0} Placed • {stats?.splStats?.willing || 0} Willing Process</p>
            </SurfaceCard>

            <SurfaceCard className="p-5 border-l-4 border-l-purple-600">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Active Teams</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{telemetry.teams?.total || 0}</div>
              <p className="text-xs text-slate-500 mt-1">Multi-batch team activity pods</p>
            </SurfaceCard>
          </div>

          {/* Recent Candidate Profiles Updated */}
          <SurfaceCard className="p-6">
            <h3 className="text-sm font-black text-slate-900 mb-1">Recently Modified Candidate Records</h3>
            <p className="text-xs text-slate-400 mb-4">Latest profile alterations across regular and frontend candidate registries</p>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Candidate</th>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Degree / Course</th>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Batch</th>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {stats?.recent && stats.recent.length > 0 ? (
                    stats.recent.map(s => (
                      <tr key={s._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{s.name}</div>
                          <div className="text-[10px] text-slate-400">{s.email || s.mobile}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-700">{s.degree || 'N/A'}</td>
                        <td className="px-4 py-3 text-slate-600 font-bold">{s.batch || 'Batch 1'}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={s.currentStatus} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-slate-400">No candidate updates found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SEGMENT 3: OPERATIONS & LEAVE APPROVALS */}
      {/* ---------------------------------------------------- */}
      {activeDashboardSegment === 'telemetry' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attendance & Shift Breakdown */}
          <SurfaceCard className="p-6 lg:col-span-2 space-y-5">
            <h3 className="text-base font-black text-slate-900">Today's Office Presence & Shifts</h3>
            <p className="text-xs text-slate-400 -mt-3">Real-time telemetry of checked-in candidates and task completion</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider block">Checked In</span>
                <span className="text-3xl font-black text-emerald-700 mt-1 block">{telemetry.attendance?.checkedIn || 0}</span>
                <span className="text-[11px] text-emerald-600 font-semibold">Active in office today</span>
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-center">
                <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider block">Checked Out</span>
                <span className="text-3xl font-black text-blue-700 mt-1 block">{telemetry.attendance?.checkedOut || 0}</span>
                <span className="text-[11px] text-blue-600 font-semibold">Completed shift</span>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider block">On Leave</span>
                <span className="text-3xl font-black text-amber-700 mt-1 block">{telemetry.attendance?.onLeave || 0}</span>
                <span className="text-[11px] text-amber-600 font-semibold">Approved leaves today</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Technical Milestone Tasks</h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-emerald-600 block">{telemetry.tasks?.completed || 0}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">Completed</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-blue-600 block">{telemetry.tasks?.pending || 0}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">In Progress</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-amber-600 block">{telemetry.tasks?.review || 0}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">Under Review</span>
                </div>
              </div>
            </div>
          </SurfaceCard>

          {/* Quick Leave Approvals Widget */}
          <SurfaceCard className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Leave Approvals</h3>
                  <p className="text-[11px] text-slate-400">Pending candidate leave requests</p>
                </div>
                <span className="h-6 w-6 rounded-full bg-amber-50 text-amber-700 font-bold text-xs flex items-center justify-center border border-amber-200">
                  {leaveRequests.length}
                </span>
              </div>

              {leavesLoading ? (
                <div className="py-12 text-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto" />
                </div>
              ) : leaveRequests.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-4">
                  ✨ All caught up! No pending leave requests.
                </div>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                  {leaveRequests.map(req => (
                    <div key={req._id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{req.studentName}</p>
                          <p className="text-[10px] text-slate-400">{req.studentEmail}</p>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                          {req.type}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 italic line-clamp-2">"{req.reason}"</p>

                      <div className="flex gap-2 pt-1">
                        <button
                          disabled={submittingId === req._id}
                          onClick={() => handleReviewLeave(req._id, 'Approved')}
                          className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition shadow-sm"
                        >
                          Approve
                        </button>
                        <button
                          disabled={submittingId === req._id}
                          onClick={() => handleReviewLeave(req._id, 'Rejected')}
                          className="flex-1 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition shadow-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/attendance')}
              className="mt-4 pt-3 border-t border-slate-100 text-center text-xs font-bold text-blue-600 hover:underline block w-full"
            >
              Open Full Attendance & Leave Hub →
            </button>
          </SurfaceCard>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SEGMENT 4: COHORT ANALYTICS & MATRIX */}
      {/* ---------------------------------------------------- */}
      {activeDashboardSegment === 'analytics' && (
        <div className="space-y-6">
          {/* Grade vs Graduation Year Pivot Matrix */}
          <SurfaceCard className="p-6">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900 mb-0.5">Grade vs. Graduation Year Pivot Matrix</h3>
                <p className="text-xs text-slate-400 font-medium">Cross-tabulation of student performance grades and graduation cohorts</p>
              </div>
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-xl text-xs font-bold">
                {filteredStudents.length} Matching Records
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">Graduation Year</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500 text-center">Grade A</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500 text-center">Grade B</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500 text-center">Grade C</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500 text-center">No Grade</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-700 text-center bg-slate-100">Total Candidates</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500 text-center">Placed</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500 text-center">Placement Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {uiPivotData.length > 0 ? (
                    <>
                      {uiPivotData.map(row => {
                        const rate = row.total > 0 ? Math.round((row.placed / row.total) * 100) : 0;
                        return (
                          <tr key={row.year} className="hover:bg-slate-50 transition font-medium text-slate-700">
                            <td className="px-4 py-3 font-bold text-slate-900">{row.year}</td>
                            <td className="px-4 py-3 text-center font-bold text-emerald-600">{row.gradeA}</td>
                            <td className="px-4 py-3 text-center font-bold text-blue-600">{row.gradeB}</td>
                            <td className="px-4 py-3 text-center font-bold text-amber-600">{row.gradeC}</td>
                            <td className="px-4 py-3 text-center text-slate-400">{row.gradeOther}</td>
                            <td className="px-4 py-3 text-center font-black text-slate-900 bg-slate-50">{row.total}</td>
                            <td className="px-4 py-3 text-center text-emerald-600 font-bold">{row.placed}</td>
                            <td className="px-4 py-3 text-center font-bold">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${rate >= 75 ? 'bg-emerald-50 text-emerald-700' : rate >= 50 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                {rate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {/* Total Summary Row */}
                      <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                        <td className="px-4 py-3">Total (Overall)</td>
                        <td className="px-4 py-3 text-center text-emerald-700">{uiPivotData.reduce((sum, r) => sum + r.gradeA, 0)}</td>
                        <td className="px-4 py-3 text-center text-blue-700">{uiPivotData.reduce((sum, r) => sum + r.gradeB, 0)}</td>
                        <td className="px-4 py-3 text-center text-amber-700">{uiPivotData.reduce((sum, r) => sum + r.gradeC, 0)}</td>
                        <td className="px-4 py-3 text-center text-slate-400">{uiPivotData.reduce((sum, r) => sum + r.gradeOther, 0)}</td>
                        <td className="px-4 py-3 text-center bg-slate-200 font-black">{uiPivotData.reduce((sum, r) => sum + r.total, 0)}</td>
                        <td className="px-4 py-3 text-center text-emerald-700">{uiPivotData.reduce((sum, r) => sum + r.placed, 0)}</td>
                        <td className="px-4 py-3 text-center">
                          {(() => {
                            const tot = uiPivotData.reduce((sum, r) => sum + r.total, 0);
                            const plc = uiPivotData.reduce((sum, r) => sum + r.placed, 0);
                            const rate = tot > 0 ? Math.round((plc / tot) * 100) : 0;
                            return (
                              <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                                {rate}%
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-slate-400">No student records match filter criteria</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        </div>
      )}
    </AppShell>
  );
}
