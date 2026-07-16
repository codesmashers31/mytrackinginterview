import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Activity,
  BriefcaseBusiness,
  CheckCircle2,
  UserX,
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
  Download
} from 'lucide-react';
import { AppShell, MetricCard, SectionTabs, StatusBadge, SurfaceCard } from '../components/AppShell';
import { authHeaders, logout } from '../utils/auth';
import { buildApiUrl, cachedGet } from '../utils/api';
import { exportToExcel, exportRegularAnalyticsToExcel } from '../utils/excelExporter';

function getNormalizedYear(student) {
  let yr = student.passedOutYear;
  const lowerYr = yr ? String(yr).trim().toLowerCase() : '';
  if (!yr || lowerYr === 'need to filled' || lowerYr === 'need to filled  ' || lowerYr === 'undefined' || lowerYr === '') {
    yr = student.batch;
  }
  yr = (yr && typeof yr === 'string') ? yr.trim() : '';
  return yr || 'Not Specified';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDashboardSegment, setActiveDashboardSegment] = useState('directory');
  const [activeActivityTab, setActiveActivityTab] = useState('regular');

  // Interactive filters state
  const [filterYear, setFilterYear] = useState('All');
  const [filterGrade, setFilterGrade] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterBatch, setFilterBatch] = useState('All');

  // All student records for dynamic filters and Excel export
  const [allStudents, setAllStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  // Leave Requests state
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leavesLoading, setLeavesLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

  const fetchLeaveRequests = () => {
    fetch(buildApiUrl('/leaves'), {
      headers: { ...authHeaders() },
    })
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
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({ status, reviewerRemarks: 'Approved via Dashboard Quick Action' })
      });

      if (res.ok) {
        toast.success(`Request ${status.toLowerCase()} successfully!`);
        fetchLeaveRequests();
      } else {
        const errData = await res.json();
        toast.error(errData.message || 'Failed to review request');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error reviewing request');
    } finally {
      setSubmittingId(null);
    }
  };

  useEffect(() => {
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
  }, []);

  // Safe defaults for stats properties
  const splStats = useMemo(() => {
    return stats?.splStats || {
      total: 0,
      placed: 0,
      willing: 0,
      splNew: 0,
      splInProgress: 0,
      recent: []
    };
  }, [stats]);

  const cohortDistribution = useMemo(() => {
    return stats?.cohortDistribution || {
      regularOnly: 0,
      frontendTrack: 0,
      overlapping: 0,
      pureSpl: 0
    };
  }, [stats]);

  const passedOutYears = useMemo(() => {
    return stats?.passedOutYears || [];
  }, [stats]);

  // 1. Dynamic filtering logic
  const filteredStudents = useMemo(() => {
    return allStudents.filter(s => {
      // 1. Graduation Year Filter
      const yr = getNormalizedYear(s);
      
      if (filterYear !== 'All' && yr !== filterYear) {
        return false;
      }

      // 2. Grade Filter
      let grade = s.grade ? s.grade.trim().toUpperCase() : 'No Grade';
      if (!grade || grade === 'UNDEFINED' || grade === '') {
        grade = 'No Grade';
      }
      if (filterGrade !== 'All') {
        if (filterGrade === 'No Grade') {
          if (grade !== 'No Grade') return false;
        } else {
          if (grade !== filterGrade) return false;
        }
      }

      // 3. Student Type Filter
      const isSpl = s.studentType === 'SPL' || (s.enrollments && s.enrollments.includes('SPL'));
      const isFrontend = s.isFrontend || s.studentType === 'Frontend';
      
      if (filterType !== 'All') {
        if (filterType === 'Regular' && !s.enrollments?.includes('Regular') && s.studentType !== 'Regular') {
          return false;
        }
        if (filterType === 'Frontend' && !isFrontend) {
          return false;
        }
        if (filterType === 'SPL' && !isSpl) {
          return false;
        }
      }

      // 4. Placement Status Filter
      const status = (s.currentStatus || s.status || 'Need to filled').trim().toLowerCase();
      if (filterStatus !== 'All') {
        if (filterStatus === 'Needs Update') {
          if (status !== 'need to filled' && status !== 'new') return false;
        } else {
          if (status !== filterStatus.toLowerCase()) return false;
        }
      }

      // 5. Batch Filter
      const batch = s.batch ? s.batch.trim() : '';
      if (filterBatch !== 'All' && batch !== filterBatch) {
        return false;
      }

      return true;
    });
  }, [allStudents, filterYear, filterGrade, filterType, filterStatus, filterBatch]);

  // 2. Filter Options derivation
  const yearOptions = useMemo(() => {
    const years = allStudents.map(s => {
      return getNormalizedYear(s);
    }).filter(Boolean);
    return ['All', ...new Set(years)].sort((a, b) => {
      if (a === 'All') return -1;
      if (a === 'Not Specified') return 1;
      if (b === 'Not Specified') return -1;
      return b.localeCompare(a);
    });
  }, [allStudents]);

  const batchOptions = useMemo(() => {
    const batches = allStudents.map(s => s.batch ? s.batch.trim() : '').filter(Boolean);
    const cleanBatches = batches.filter(b => !/^\d{4}$/.test(b));
    return ['All', ...new Set(cleanBatches)].sort();
  }, [allStudents]);

  // 3. Dynamic Stats derivation based on filtered student set
  const dynamicStats = useMemo(() => {
    const defaultStats = {
      directory: {
        total: stats?.total || 0,
        placed: stats?.placed || 0,
        jobSeekers: stats?.jobSeekers || 0,
        needToFilled: stats?.needToFilled || 0,
      },
      frontend: {
        total: stats?.frontendTotal || 0,
        placed: stats?.frontendPlaced || 0,
        jobSeekers: stats?.frontendJobSeekers || 0,
      },
      spl: {
        total: splStats.total,
        placed: splStats.placed,
        willing: splStats.willing,
        splNew: splStats.splNew,
      },
      cohortDistribution: cohortDistribution,
      passedOutYears: passedOutYears,
    };

    if (allStudents.length === 0) {
      return defaultStats;
    }

    // Directory Candidates
    const directoryStudents = filteredStudents.filter(s => !s.isFrontend && (s.studentType === 'Regular' || s.enrollments?.includes('Regular')));
    const dirTotal = directoryStudents.length;
    const dirPlaced = directoryStudents.filter(s => s.currentStatus?.toLowerCase() === 'placed').length;
    const dirSeekers = directoryStudents.filter(s => s.currentStatus?.toLowerCase() === 'job seeker').length;
    const dirNeedsUpdate = directoryStudents.filter(s => s.currentStatus?.toLowerCase() === 'need to filled' || !s.currentStatus).length;

    // Frontend Candidates
    const frontendStudents = filteredStudents.filter(s => s.isFrontend || s.studentType === 'Frontend');
    const frontTotal = frontendStudents.length;
    const frontPlaced = frontendStudents.filter(s => s.currentStatus?.toLowerCase() === 'placed').length;
    const frontSeekers = frontendStudents.filter(s => s.currentStatus?.toLowerCase() === 'job seeker').length;

    // SPL Candidates
    const splStudents = filteredStudents.filter(s => s.studentType === 'SPL' || s.enrollments?.includes('SPL'));
    const splTotalCount = splStudents.length;
    const splPlacedCount = splStudents.filter(s => (s.currentStatus || s.status)?.toLowerCase() === 'placed').length;
    const splWillingCount = splStudents.filter(s => s.willingCompanyProcess).length;
    const splNewCount = splStudents.filter(s => (s.status || s.currentStatus)?.toLowerCase() === 'new' || (s.status || s.currentStatus)?.toLowerCase() === 'need to filled').length;

    // Cohort distributions
    const regOnly = filteredStudents.filter(s => !s.isFrontend && s.enrollments?.includes('Regular') && !s.enrollments?.includes('SPL')).length;
    const frontOnly = filteredStudents.filter(s => s.isFrontend || s.studentType === 'Frontend').length;
    const overlap = filteredStudents.filter(s => !s.isFrontend && s.enrollments?.includes('Regular') && s.enrollments?.includes('SPL')).length;
    const pureSpl = filteredStudents.filter(s => s.studentType === 'SPL' && !s.enrollments?.includes('Regular')).length;

    // Years distribution
    const yearsAgg = {};
    filteredStudents.forEach(s => {
      const yr = getNormalizedYear(s);

      if (!yearsAgg[yr]) {
        yearsAgg[yr] = { year: yr, regular: 0, spl: 0 };
      }

      const isSpl = s.studentType === 'SPL' || s.enrollments?.includes('SPL');
      const isRegular = !s.isFrontend && (s.studentType === 'Regular' || s.enrollments?.includes('Regular'));

      if (isRegular) yearsAgg[yr].regular += 1;
      if (isSpl) yearsAgg[yr].spl += 1;
    });

    const computedPassedOutYears = Object.values(yearsAgg).sort((a, b) => {
      if (a.year === 'Not Specified') return 1;
      if (b.year === 'Not Specified') return -1;
      return a.year.localeCompare(b.year);
    });

    return {
      directory: {
        total: dirTotal,
        placed: dirPlaced,
        jobSeekers: dirSeekers,
        needToFilled: dirNeedsUpdate,
      },
      frontend: {
        total: frontTotal,
        placed: frontPlaced,
        jobSeekers: frontSeekers,
      },
      spl: {
        total: splTotalCount,
        placed: splPlacedCount,
        willing: splWillingCount,
        splNew: splNewCount,
      },
      cohortDistribution: {
        regularOnly: regOnly,
        frontendTrack: frontOnly,
        overlapping: overlap,
        pureSpl: pureSpl,
      },
      passedOutYears: computedPassedOutYears,
    };
  }, [filteredStudents, allStudents, stats, splStats, cohortDistribution, passedOutYears]);

  // 4. UI Pivot preview data
  const uiPivotData = useMemo(() => {
    const yearsMap = {};
    
    filteredStudents.forEach(s => {
      const yr = getNormalizedYear(s);

      let grade = s.grade ? s.grade.trim().toUpperCase() : 'No Grade';
      if (!grade || grade === 'UNDEFINED' || grade === '') {
        grade = 'No Grade';
      }

      const isPlaced = (s.currentStatus && s.currentStatus.toLowerCase() === 'placed') || 
                       (s.status && s.status.toLowerCase() === 'placed');

      const isSpl = s.studentType === 'SPL' || (s.enrollments && s.enrollments.includes('SPL'));

      if (!yearsMap[yr]) {
        yearsMap[yr] = {
          year: yr,
          gradeA: 0,
          gradeB: 0,
          gradeC: 0,
          gradeOther: 0,
          total: 0,
          placed: 0,
          spl: 0
        };
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

  const regularStatsPivotData = useMemo(() => {
    const degreeYearMap = {};
    
    const regularOnlyStudents = filteredStudents.filter(s => 
      !s.isFrontend && 
      (s.studentType === 'Regular' || s.enrollments?.includes('Regular'))
    );

    regularOnlyStudents.forEach(s => {
      const yr = getNormalizedYear(s);
      const degree = s.degree ? s.degree.trim() : 'Not Specified';
      const key = `${degree} | ${yr}`;

      const isPlaced = (s.currentStatus && s.currentStatus.toLowerCase() === 'placed') || 
                       (s.status && s.status.toLowerCase() === 'placed');
      
      const isOnboard = (s.currentStatus && s.currentStatus.toLowerCase() === 'onboard') || 
                        (s.status && s.status.toLowerCase() === 'onboard');

      if (!degreeYearMap[key]) {
        degreeYearMap[key] = {
          degree: degree,
          year: yr,
          total: 0,
          placed: 0,
          onboard: 0
        };
      }

      degreeYearMap[key].total += 1;
      if (isPlaced) degreeYearMap[key].placed += 1;
      if (isOnboard) degreeYearMap[key].onboard += 1;
    });

    return Object.values(degreeYearMap).sort((a, b) => {
      const degCompare = a.degree.localeCompare(b.degree);
      if (degCompare !== 0) return degCompare;
      
      if (a.year === 'Not Specified') return 1;
      if (b.year === 'Not Specified') return -1;
      return b.year.localeCompare(a.year);
    });
  }, [filteredStudents]);

  const filteredRecent = useMemo(() => {
    if (!stats?.recent) return [];
    return stats.recent.filter(s => {
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

      const status = (s.currentStatus || 'Need to filled').trim().toLowerCase();
      if (filterStatus !== 'All') {
        if (filterStatus === 'Needs Update') {
          if (status !== 'need to filled' && status !== 'new') return false;
        } else {
          if (status !== filterStatus.toLowerCase()) return false;
        }
      }

      if (filterBatch !== 'All' && s.batch !== filterBatch) return false;

      return true;
    });
  }, [stats?.recent, filterYear, filterGrade, filterStatus, filterBatch]);

  const filteredRecentFrontend = useMemo(() => {
    if (!stats?.recentFrontend) return [];
    return stats.recentFrontend.filter(s => {
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

      const status = (s.currentStatus || 'Need to filled').trim().toLowerCase();
      if (filterStatus !== 'All') {
        if (filterStatus === 'Needs Update') {
          if (status !== 'need to filled' && status !== 'new') return false;
        } else {
          if (status !== filterStatus.toLowerCase()) return false;
        }
      }

      if (filterBatch !== 'All' && s.batch !== filterBatch) return false;

      return true;
    });
  }, [stats?.recentFrontend, filterYear, filterGrade, filterStatus, filterBatch]);

  const telemetry = useMemo(() => {
    return stats?.telemetry || {
      attendance: { checkedIn: 0, checkedOut: 0, onLeave: 0 },
      tasks: { completed: 0, pending: 0, review: 0 }
    };
  }, [stats]);

  const pipelineBreakdown = useMemo(() => {
    if (!stats) return [];

    let totalVal = dynamicStats.directory.total;
    let placedVal = dynamicStats.directory.placed;
    let seekersVal = dynamicStats.directory.jobSeekers;
    let warningVal = dynamicStats.directory.needToFilled;
    let inactiveVal = 0;

    if (activeDashboardSegment === 'frontend') {
      totalVal = dynamicStats.frontend.total;
      placedVal = dynamicStats.frontend.placed;
      seekersVal = dynamicStats.frontend.jobSeekers;
      warningVal = 0;
      inactiveVal = 0;
    } else if (activeDashboardSegment === 'spl') {
      totalVal = dynamicStats.spl.total;
      placedVal = dynamicStats.spl.placed;
      seekersVal = dynamicStats.spl.total - dynamicStats.spl.placed;
      warningVal = dynamicStats.spl.splNew;
      inactiveVal = 0;
    }

    const total = Math.max(totalVal, 1);
    return [
      { label: 'Placed', value: placedVal, tone: 'success' },
      { label: 'Active Seekers', value: seekersVal, tone: 'primary' },
      { label: 'Needs Updates', value: warningVal, tone: 'warning' },
      { label: 'Inactive / In Progress', value: inactiveVal, tone: 'info' },
    ].map(item => ({
      ...item,
      percent: Math.round((item.value / total) * 100),
    }));
  }, [stats, activeDashboardSegment, dynamicStats]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <div className="crm-surface flex items-center gap-3 px-6 py-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <AppShell
        title="Executive Dashboard"
        subtitle="Operational overview for placement performance and student engagement."
        searchPlaceholder="Search insights"
      >
        <SurfaceCard className="flex min-h-[280px] items-center justify-center p-8 text-center">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Unable to load dashboard data</h2>
            <p className="mt-2 text-sm text-slate-500">The API request failed. Please retry once the server is available.</p>
          </div>
        </SurfaceCard>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Executive Dashboard"
      subtitle="Operational overview for placement performance and student engagement."
      searchPlaceholder="Search metrics, people, or modules"
    >
      <SectionTabs
        items={[
          { label: 'Overview', active: true },
          { label: 'Student Records', onClick: () => navigate('/students') },
          { label: 'Frontend Students', onClick: () => navigate('/admin/frontend-students') },
          { label: 'Eligibility Engine', onClick: () => navigate('/eligibility') },
        ]}
      />

      {/* Interactive Filters Panel */}
      <SurfaceCard className="p-4 mb-6 border border-slate-200/60 shadow-sm bg-white/90 backdrop-blur-md rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Interactive Data Filters</h3>
            <p className="text-[10px] text-slate-500 font-medium">Filter executive analytics, distributions, and excel report data.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setFilterYear('All');
                setFilterGrade('All');
                setFilterType('All');
                setFilterStatus('All');
                setFilterBatch('All');
              }}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition"
            >
              Reset Filters
            </button>
            <button
              onClick={() => exportToExcel(filteredStudents)}
              disabled={filteredStudents.length === 0}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white rounded-lg shadow-sm transition ${filteredStudents.length === 0 ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow'}`}
            >
              <Download size={14} />
              Export Excel Report
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {/* Year Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Graduation Year</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition"
            >
              {yearOptions.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          {/* Grade Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Grade</label>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition"
            >
              <option value="All">All Grades</option>
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
              <option value="No Grade">No Grade</option>
            </select>
          </div>

          {/* Student Type Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Class / Track</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition"
            >
              <option value="All">All Tracks</option>
              <option value="Regular">Regular Directory</option>
              <option value="Frontend">Frontend Track</option>
              <option value="SPL">SPL Class Track</option>
            </select>
          </div>

          {/* Placement Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Placement Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition"
            >
              <option value="All">All Statuses</option>
              <option value="Placed">Placed</option>
              <option value="Job Seeker">Job Seeker</option>
              <option value="Needs Update">Needs Update</option>
              <option value="Inactive/Suspend">Inactive/Suspend</option>
              <option value="Interview Process">Interview Process</option>
            </select>
          </div>

          {/* Batch Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Batch Group</label>
            <select
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
              className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition"
            >
              {batchOptions.map(batch => (
                <option key={batch} value={batch}>{batch === 'All' ? 'All Batches' : batch}</option>
              ))}
            </select>
          </div>
        </div>
      </SurfaceCard>

      {/* Segment Selector tabs */}
      <div className="mb-6 flex gap-1 p-1 bg-slate-100/80 backdrop-blur-sm rounded-xl max-w-max overflow-x-auto scrollbar-none border border-slate-200/50">
        <button
          onClick={() => setActiveDashboardSegment('directory')}
          className={`whitespace-nowrap px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-205 ${activeDashboardSegment === 'directory' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/30' : 'text-slate-500 hover:text-slate-900'}`}
        >
          Directory Students
        </button>
        <button
          onClick={() => setActiveDashboardSegment('frontend')}
          className={`whitespace-nowrap px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-205 ${activeDashboardSegment === 'frontend' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/30' : 'text-slate-500 hover:text-slate-900'}`}
        >
          Frontend Track
        </button>
        <button
          onClick={() => setActiveDashboardSegment('spl')}
          className={`whitespace-nowrap px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-205 ${activeDashboardSegment === 'spl' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/30' : 'text-slate-500 hover:text-slate-900'}`}
        >
          SPL Class Track
        </button>
        <button
          onClick={() => setActiveDashboardSegment('telemetry')}
          className={`whitespace-nowrap px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-205 ${activeDashboardSegment === 'telemetry' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/30' : 'text-slate-500 hover:text-slate-900'}`}
        >
          Telemetry & Processes
        </button>
        <button
          onClick={() => setActiveDashboardSegment('analytics')}
          className={`whitespace-nowrap px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-205 ${activeDashboardSegment === 'analytics' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/30' : 'text-slate-500 hover:text-slate-900'}`}
        >
          Process Analytics & Distribution
        </button>
      </div>

      {/* Conditional Cards Area */}
      {activeDashboardSegment === 'directory' && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <MetricCard
            title="Directory Total"
            value={dynamicStats.directory.total}
            helper="All regular student profiles tracked"
            icon={<Users />}
          />
          <MetricCard
            title="Placed Students"
            value={dynamicStats.directory.placed}
            helper="Candidates marked placed successfully"
            tone="success"
            icon={<CheckCircle2 />}
          />
          <MetricCard
            title="Active Seekers"
            value={dynamicStats.directory.jobSeekers}
            helper="Regular profiles seeking roles"
            tone="primary"
            icon={<BriefcaseBusiness />}
          />
          <MetricCard
            title="Needs Updates"
            value={dynamicStats.directory.needToFilled}
            helper="Profiles missing placement status"
            tone="warning"
            icon={<Bookmark />}
          />
          <MetricCard
            title="Conversion Rate"
            value={`${dynamicStats.directory.total ? Math.round((dynamicStats.directory.placed / dynamicStats.directory.total) * 100) : 0}%`}
            helper="Directory successful placement rate"
            tone="success"
            icon={<TrendingUp />}
          />
        </div>
      )}

      {activeDashboardSegment === 'frontend' && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <MetricCard
            title="Frontend Total"
            value={dynamicStats.frontend.total}
            helper="All frontend candidates in pipeline"
            icon={<Users />}
          />
          <MetricCard
            title="Frontend Placed"
            value={dynamicStats.frontend.placed}
            helper="Frontend candidates placed"
            tone="success"
            icon={<CheckCircle2 />}
          />
          <MetricCard
            title="Active Seekers"
            value={dynamicStats.frontend.jobSeekers}
            helper="Frontend profiles looking for roles"
            tone="primary"
            icon={<BriefcaseBusiness />}
          />
          <MetricCard
            title="Placement Rate"
            value={`${dynamicStats.frontend.total ? Math.round((dynamicStats.frontend.placed / dynamicStats.frontend.total) * 100) : 0}%`}
            helper="Frontend course placement rate"
            tone="success"
            icon={<TrendingUp />}
          />
        </div>
      )}

      {activeDashboardSegment === 'spl' && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <MetricCard
            title="SPL Total Registrations"
            value={dynamicStats.spl.total}
            helper="Total SPL class students registered"
            icon={<Users />}
          />
          <MetricCard
            title="SPL Placed"
            value={dynamicStats.spl.placed}
            helper="SPL candidates successfully placed"
            tone="success"
            icon={<CheckCircle2 />}
          />
          <MetricCard
            title="Willing for Placement"
            value={dynamicStats.spl.willing}
            helper="Willing to join company process"
            tone="primary"
            icon={<Award />}
          />
          <MetricCard
            title="New Candidates"
            value={dynamicStats.spl.splNew}
            helper="Awaiting administrator review"
            tone="warning"
            icon={<Clock />}
          />
          <MetricCard
            title="SPL Conversion"
            value={`${dynamicStats.spl.total ? Math.round((dynamicStats.spl.placed / dynamicStats.spl.total) * 100) : 0}%`}
            helper="SPL course placement rate"
            tone="success"
            icon={<TrendingUp />}
          />
        </div>
      )}

      {activeDashboardSegment === 'telemetry' && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          <MetricCard
            title="Checked In Today"
            value={telemetry.attendance.checkedIn}
            helper="Students currently in office"
            tone="success"
            icon={<ShieldCheck />}
          />
          <MetricCard
            title="Checked Out"
            value={telemetry.attendance.checkedOut}
            helper="Completed shift attendance"
            tone="primary"
            icon={<Clock />}
          />
          <MetricCard
            title="On Leave Today"
            value={telemetry.attendance.onLeave}
            helper="Approved leaves/permissions"
            tone="warning"
            icon={<Calendar />}
          />
          <MetricCard
            title="Tasks Completed"
            value={telemetry.tasks.completed}
            helper="Total completed tasks"
            tone="success"
            icon={<CheckCircle2 />}
          />
          <MetricCard
            title="Tasks Pending"
            value={telemetry.tasks.pending}
            helper="Active task sheets assigned"
            tone="primary"
            icon={<Activity />}
          />
          <MetricCard
            title="Under Review"
            value={telemetry.tasks.review}
            helper="Awaiting instructor review"
            tone="warning"
            icon={<BookOpen />}
          />
        </div>
      )}

      {activeDashboardSegment === 'analytics' && (
        <div className="space-y-6">
          {/* Cohort Distribution Diagram */}
          <SurfaceCard className="p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">Chennai Center Student Distribution & Process Flow</h3>
            <p className="text-xs text-slate-500 mb-6 font-medium">Visual representation of student overlaps between the standard regular courses and the SPL class track in Chennai, India.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 relative">
              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200/60 flex flex-col justify-between min-h-[160px]">
                <div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 mb-3 uppercase tracking-wider">Regular Only</span>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Regular Directory</h4>
                  <p className="text-[10px] text-slate-550 mt-1 leading-relaxed">Students tracked in standard placement courses only.</p>
                </div>
                <p className="mt-4 text-2xl font-black text-slate-900 leading-none">{dynamicStats.cohortDistribution.regularOnly} <span className="text-[10px] font-semibold text-slate-400">students</span></p>
              </div>

              <div className="p-4 bg-emerald-55/10 rounded-2xl border border-emerald-100 flex flex-col justify-between min-h-[160px]">
                <div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 mb-3 uppercase tracking-wider">Frontend Only</span>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Frontend Track</h4>
                  <p className="text-[10px] text-slate-550 mt-1 leading-relaxed">Dedicated frontend training candidates.</p>
                </div>
                <p className="mt-4 text-2xl font-black text-slate-900 leading-none">{dynamicStats.cohortDistribution.frontendTrack} <span className="text-[10px] font-semibold text-slate-400">students</span></p>
              </div>

              {/* OVERLAP BOX */}
              <div className="p-4 bg-blue-50/30 rounded-2xl border-2 border-blue-400/50 flex flex-col justify-between min-h-[160px] relative shadow-sm ring-4 ring-blue-50/50">
                <div className="absolute -top-2 right-3 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-sm">
                  Active Overlap
                </div>
                <div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 mb-3 uppercase tracking-wider">Linked Accounts</span>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Regular + SPL Overlap</h4>
                  <p className="text-[10px] text-slate-600 mt-1 leading-relaxed font-medium">Regular students also enrolled in the SPL Class Track. Logins and profiles are unified.</p>
                </div>
                <p className="mt-4 text-2xl font-black text-blue-700 leading-none">{dynamicStats.cohortDistribution.overlapping} <span className="text-[10px] font-bold text-blue-500">students</span></p>
              </div>

              <div className="p-4 bg-amber-50/20 rounded-2xl border border-amber-200/50 flex flex-col justify-between min-h-[160px]">
                <div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 mb-3 uppercase tracking-wider">Pure SPL Track</span>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Pure SPL Registrations</h4>
                  <p className="text-[10px] text-slate-550 mt-1 leading-relaxed">SPL class candidates who do not have a regular student account.</p>
                </div>
                <p className="mt-4 text-2xl font-black text-slate-900 leading-none">{dynamicStats.cohortDistribution.pureSpl} <span className="text-[10px] font-semibold text-slate-400">students</span></p>
              </div>
            </div>
          </SurfaceCard>

          {/* Graduation Years */}
          <SurfaceCard className="p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">Chennai Graduation Year Breakdown</h3>
            <p className="text-xs text-slate-505 mb-6 font-medium">Passed out year-wise distribution of regular students and SPL class students in Chennai, India.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {dynamicStats.passedOutYears.map(item => {
                  const maxCount = Math.max(...dynamicStats.passedOutYears.map(y => (y.regular || 0) + (y.spl || 0)), 1);
                  const total = (item.regular || 0) + (item.spl || 0);
                  const regPercent = Math.round(((item.regular || 0) / maxCount) * 100);
                  const splPercent = Math.round(((item.spl || 0) / maxCount) * 100);

                  return (
                    <div key={item.year} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                        <span>Graduation Year: {item.year}</span>
                        <span>{total} combined ({item.regular || 0} Reg • {item.spl || 0} SPL)</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 flex overflow-hidden">
                        {item.regular > 0 && (
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500"
                            style={{ width: `${regPercent}%` }}
                          />
                        )}
                        {item.spl > 0 && (
                          <div 
                            className="bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                            style={{ width: `${splPercent}%` }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary Stats Card */}
              <div className="flex flex-col justify-between p-5 bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl text-white shadow-lg min-h-[300px]">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Chennai Student Summary</h4>
                  <p className="text-[10px] text-slate-550 mt-1">Key metrics distilled from the Chennai, India student database.</p>
                  
                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-xs font-semibold text-slate-400">Total Unique Candidates</span>
                      <span className="text-sm font-black text-white">{dynamicStats.cohortDistribution.regularOnly + dynamicStats.cohortDistribution.frontendTrack + dynamicStats.cohortDistribution.overlapping + dynamicStats.cohortDistribution.pureSpl}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-xs font-semibold text-slate-400">Average Placement Rate</span>
                      <span className="text-sm font-black text-emerald-400">
                        {dynamicStats.directory.total ? Math.round(((dynamicStats.directory.placed + dynamicStats.frontend.placed) / Math.max(1, dynamicStats.directory.total + dynamicStats.frontend.total)) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-xs font-semibold text-slate-400">SPL willing company process</span>
                      <span className="text-sm font-black text-amber-400">
                        {dynamicStats.spl.willing} students
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-800 text-[10px] text-slate-550 font-medium">
                  Process records are dynamically aggregated from all Student, User, and SplRegistration documents in Chennai, India.
                </div>
              </div>
            </div>
          </SurfaceCard>

          {/* Grade-based Pivot Preview Matrix */}
          <SurfaceCard className="p-6">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Grade vs. Graduation Year Pivot Matrix</h3>
                <p className="text-xs text-slate-500 font-medium">Cross-tabulation of student performance grades and graduation years matching current filters.</p>
              </div>
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-xl text-xs font-bold">
                {filteredStudents.length} Active Records
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-slate-500">Graduation Year</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-slate-500 text-center">Grade A</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-slate-500 text-center">Grade B</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-slate-500 text-center">Grade C</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-slate-500 text-center">Grade Other/None</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-slate-550 text-center bg-slate-100/50">Total Students</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-slate-500 text-center">Placed</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-slate-500 text-center">SPL Track</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-slate-500 text-center">Placement Rate</th>
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
                            <td className="px-4 py-3 text-center">{row.gradeA}</td>
                            <td className="px-4 py-3 text-center">{row.gradeB}</td>
                            <td className="px-4 py-3 text-center">{row.gradeC}</td>
                            <td className="px-4 py-3 text-center text-slate-400">{row.gradeOther}</td>
                            <td className="px-4 py-3 text-center font-bold text-slate-900 bg-slate-50/50">{row.total}</td>
                            <td className="px-4 py-3 text-center text-emerald-600 font-bold">{row.placed}</td>
                            <td className="px-4 py-3 text-center text-amber-600 font-bold">{row.spl}</td>
                            <td className="px-4 py-3 text-center font-bold">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${rate >= 75 ? 'bg-emerald-50 text-emerald-700' : rate >= 50 ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-500'}`}>
                                {rate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {/* Overall Summary Row */}
                      <tr className="bg-slate-50/80 font-bold text-slate-900 border-t border-slate-300">
                        <td className="px-4 py-3">Total (Overall)</td>
                        <td className="px-4 py-3 text-center">{uiPivotData.reduce((sum, r) => sum + r.gradeA, 0)}</td>
                        <td className="px-4 py-3 text-center">{uiPivotData.reduce((sum, r) => sum + r.gradeB, 0)}</td>
                        <td className="px-4 py-3 text-center">{uiPivotData.reduce((sum, r) => sum + r.gradeC, 0)}</td>
                        <td className="px-4 py-3 text-center text-slate-400">{uiPivotData.reduce((sum, r) => sum + r.gradeOther, 0)}</td>
                        <td className="px-4 py-3 text-center bg-slate-100/50 font-black">{uiPivotData.reduce((sum, r) => sum + r.total, 0)}</td>
                        <td className="px-4 py-3 text-center text-emerald-700 font-black">{uiPivotData.reduce((sum, r) => sum + r.placed, 0)}</td>
                        <td className="px-4 py-3 text-center text-amber-700 font-black">{uiPivotData.reduce((sum, r) => sum + r.spl, 0)}</td>
                        <td className="px-4 py-3 text-center font-black">
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
                      <td colSpan="9" className="px-4 py-8 text-center text-slate-500 font-medium bg-slate-50/50">
                        No student records match the active filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SurfaceCard>

          {/* Regular Student counts & Analytics Table */}
          <SurfaceCard className="p-6">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Regular Students Placement & Onboarding Analytics</h3>
                <p className="text-xs text-slate-500 font-medium">Breakdown of regular student counts, placed counts, and onboarded status counts by year and degree.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open(buildApiUrl('/students/export-regular-excel'), '_blank')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
                >
                  <Download size={13} />
                  Download Excel Report
                </button>
                <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0">
                  {filteredStudents.filter(s => !s.isFrontend && (s.studentType === 'Regular' || s.enrollments?.includes('Regular'))).length} Regular Records
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-slate-500">Degree</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-slate-500">Graduation Year</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-slate-500 text-center">Total Students</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-slate-500 text-center">Placed</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-slate-500 text-center">Onboarded</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-slate-500 text-center">Placement Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {regularStatsPivotData.length > 0 ? (
                    <>
                      {regularStatsPivotData.map(row => {
                        const rate = row.total > 0 ? Math.round((row.placed / row.total) * 100) : 0;
                        return (
                          <tr key={`${row.degree} | ${row.year}`} className="hover:bg-slate-50/50 transition font-medium text-slate-700">
                            <td className="px-4 py-3 font-bold text-slate-900">{row.degree}</td>
                            <td className="px-4 py-3 text-slate-650 font-bold">{row.year}</td>
                            <td className="px-4 py-3 text-center font-bold text-slate-900">{row.total}</td>
                            <td className="px-4 py-3 text-center text-emerald-600 font-bold">{row.placed}</td>
                            <td className="px-4 py-3 text-center text-blue-600 font-bold">{row.onboard}</td>
                            <td className="px-4 py-3 text-center font-bold">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${rate >= 75 ? 'bg-emerald-50 text-emerald-700' : rate >= 50 ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-500'}`}>
                                {rate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {/* Overall Summary Row */}
                      <tr className="bg-slate-50/80 font-bold text-slate-900 border-t border-slate-300">
                        <td colSpan="2" className="px-4 py-3">Total (Overall)</td>
                        <td className="px-4 py-3 text-center font-black">
                          {regularStatsPivotData.reduce((sum, r) => sum + r.total, 0)}
                        </td>
                        <td className="px-4 py-3 text-center text-emerald-700 font-black">
                          {regularStatsPivotData.reduce((sum, r) => sum + r.placed, 0)}
                        </td>
                        <td className="px-4 py-3 text-center text-blue-700 font-black">
                          {regularStatsPivotData.reduce((sum, r) => sum + r.onboard, 0)}
                        </td>
                        <td className="px-4 py-3 text-center font-black">
                          {(() => {
                            const tot = regularStatsPivotData.reduce((sum, r) => sum + r.total, 0);
                            const plc = regularStatsPivotData.reduce((sum, r) => sum + r.placed, 0);
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
                      <td colSpan="6" className="px-4 py-8 text-center text-slate-500 font-medium bg-slate-50/50">
                        No regular student records match the active filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        </div>
      )}

      {/* Main Dashboard Layout */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.8fr_1fr]">
        
        {/* Left Hand Column: Tables or Telemetry progress */}
        <div>
          {activeDashboardSegment === 'telemetry' ? (
            <div className="space-y-6">
              <SurfaceCard className="p-6">
                <h3 className="text-base font-bold text-slate-900 mb-1">Today's Office Presence Rate</h3>
                <p className="text-xs text-slate-500 mb-6 font-medium">Real-time telemetry of checked-in students relative to tracked student base.</p>
                
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-600">Checked In (Active Presence)</span>
                      <span className="text-slate-900 font-bold">
                        {telemetry.attendance.checkedIn} students ({Math.min(100, Math.round((telemetry.attendance.checkedIn / Math.max(1, dynamicStats.directory.total + dynamicStats.frontend.total)) * 100))}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100/80 overflow-hidden border border-slate-200/10">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500 shadow-[0_1px_4px_rgba(16,185,129,0.2)]" 
                        style={{ width: `${Math.min(100, Math.round((telemetry.attendance.checkedIn / Math.max(1, dynamicStats.directory.total + dynamicStats.frontend.total)) * 100))}%` }} 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-600">Checked Out (Completed Shift)</span>
                      <span className="text-slate-900 font-bold">
                        {telemetry.attendance.checkedOut} students ({Math.min(100, Math.round((telemetry.attendance.checkedOut / Math.max(1, telemetry.attendance.checkedIn || 1)) * 100))}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100/80 overflow-hidden border border-slate-200/10">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500 shadow-[0_1px_4px_rgba(59,130,246,0.2)]" 
                        style={{ width: `${Math.min(100, Math.round((telemetry.attendance.checkedOut / Math.max(1, telemetry.attendance.checkedIn || 1)) * 100))}%` }} 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-600">On Leave / Permissions Approved</span>
                      <span className="text-slate-900 font-bold">
                        {telemetry.attendance.onLeave} students ({Math.min(100, Math.round((telemetry.attendance.onLeave / Math.max(1, dynamicStats.directory.total + dynamicStats.frontend.total)) * 100))}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100/80 overflow-hidden border border-slate-200/10">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500 shadow-[0_1px_4px_rgba(245,158,11,0.2)]" 
                        style={{ width: `${Math.min(100, Math.round((telemetry.attendance.onLeave / Math.max(1, dynamicStats.directory.total + dynamicStats.frontend.total)) * 100))}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </SurfaceCard>

              <SurfaceCard className="p-6">
                <h3 className="text-base font-bold text-slate-900 mb-1">Assigned Tasks Completion Funnel</h3>
                <p className="text-xs text-slate-500 mb-6 font-medium">Aggregate status of student technical milestone performance.</p>
                
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-600">Completed Tasks</span>
                      <span className="text-slate-900 font-bold">
                        {telemetry.tasks.completed} tasks ({Math.min(100, Math.round((telemetry.tasks.completed / Math.max(1, telemetry.tasks.completed + telemetry.tasks.pending + telemetry.tasks.review)) * 100))}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100/80 overflow-hidden border border-slate-200/10">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500 shadow-[0_1px_4px_rgba(16,185,129,0.2)]" 
                        style={{ width: `${Math.min(100, Math.round((telemetry.tasks.completed / Math.max(1, telemetry.tasks.completed + telemetry.tasks.pending + telemetry.tasks.review)) * 100))}%` }} 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-600">Tasks Pending / In Progress</span>
                      <span className="text-slate-900 font-bold">
                        {telemetry.tasks.pending} tasks ({Math.min(100, Math.round((telemetry.tasks.pending / Math.max(1, telemetry.tasks.completed + telemetry.tasks.pending + telemetry.tasks.review)) * 100))}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100/80 overflow-hidden border border-slate-200/10">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500 shadow-[0_1px_4px_rgba(245,158,11,0.2)]" 
                        style={{ width: `${Math.min(100, Math.round((telemetry.tasks.pending / Math.max(1, telemetry.tasks.completed + telemetry.tasks.pending + telemetry.tasks.review)) * 100))}%` }} 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-600">Pending Evaluation Review</span>
                      <span className="text-slate-900 font-bold">
                        {telemetry.tasks.review} tasks ({Math.min(100, Math.round((telemetry.tasks.review / Math.max(1, telemetry.tasks.completed + telemetry.tasks.pending + telemetry.tasks.review)) * 100))}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100/80 overflow-hidden border border-slate-200/10">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-400 to-violet-500 rounded-full transition-all duration-500 shadow-[0_1px_4px_rgba(139,92,246,0.2)]" 
                        style={{ width: `${Math.min(100, Math.round((telemetry.tasks.review / Math.max(1, telemetry.tasks.completed + telemetry.tasks.pending + telemetry.tasks.review)) * 100))}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            </div>
          ) : activeDashboardSegment === 'spl' ? (
            <SurfaceCard className="p-5 md:p-6">
              <div className="mb-6">
                <p className="text-sm font-medium text-slate-500">SPL Class Directory</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">Recent SPL Registrations</h2>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Candidate</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Degree / City</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Tech Stack</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Willingness</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {splStats.recent.length > 0 ? (
                      splStats.recent.map(reg => (
                        <tr key={reg._id} className="transition hover:bg-slate-50">
                          <td className="px-4 py-3.5">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{reg.name}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-sm text-slate-800 font-medium">{reg.degree || 'N/A'}</p>
                            <p className="text-xs text-slate-400">{reg.city || '-'}</p>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-slate-600">{reg.stack || 'No Stack'}</td>
                          <td className="px-4 py-3.5 text-sm">
                            {reg.willingCompanyProcess ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700">Willing</span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-50 text-slate-500">Not Willing</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <StatusBadge status={reg.status} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-4 py-10 text-center text-sm text-slate-500">
                          No recent SPL class registrations available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SurfaceCard>
          ) : (
            <SurfaceCard className="p-5 md:p-6">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Recent Activity</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">Latest student updates</h2>
                </div>
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveActivityTab('regular')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeActivityTab === 'regular' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Directory Students ({dynamicStats.directory.total || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveActivityTab('frontend')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeActivityTab === 'frontend' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Frontend Students ({dynamicStats.frontend.total || 0})
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    {activeActivityTab === 'regular' ? (
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Candidate</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Degree</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Grade</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Status</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Candidate</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Batch Year</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">City</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {activeActivityTab === 'regular' ? (
                      filteredRecent.length > 0 ? (
                        filteredRecent.map(student => (
                          <tr key={student._id} className="transition hover:bg-slate-50">
                            <td className="px-4 py-3.5">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{student.name}</p>
                                <p className="text-xs text-slate-500">{student.mobile}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-sm text-slate-600">{student.degree}</td>
                            <td className="px-4 py-3.5 text-sm font-semibold">
                              {student.grade ? (
                                <span className={`inline-flex items-center justify-center h-5 w-5 rounded text-[10px] font-bold ${student.grade === 'A' ? 'bg-emerald-100 text-emerald-700' : student.grade === 'B' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {student.grade}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <StatusBadge status={student.currentStatus} />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-4 py-10 text-center text-sm text-slate-500">
                            No recent student records available.
                          </td>
                        </tr>
                      )
                    ) : (
                      filteredRecentFrontend && filteredRecentFrontend.length > 0 ? (
                        filteredRecentFrontend.map(student => (
                          <tr key={student._id} className="transition hover:bg-slate-50">
                            <td className="px-4 py-3.5">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{student.name}</p>
                                <p className="text-xs text-slate-500">{student.mobile}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-sm text-slate-600">{student.passedOutYear || 'N/A'}</td>
                            <td className="px-4 py-3.5 text-sm text-slate-600 text-right">{student.city || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-4 py-10 text-center text-sm text-slate-500">
                            No recent frontend student records available.
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </SurfaceCard>
          )}
        </div>

        {/* Right Hand Column: Pipeline Health, Leave Requests, and Notes */}
        <div className="space-y-6">
          <SurfaceCard className="p-5 md:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Pipeline Health</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">Distribution snapshot</h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <TrendingUp size={20} />
              </div>
            </div>

            <div className="space-y-4">
              {pipelineBreakdown.map(item => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <p className="text-sm font-semibold text-slate-900">{item.value}</p>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${
                        item.tone === 'success'
                          ? 'bg-emerald-500'
                          : item.tone === 'warning'
                            ? 'bg-amber-500'
                            : item.tone === 'info'
                              ? 'bg-violet-500'
                              : 'bg-blue-500'
                      }`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5 md:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Leave Approvals</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">Pending requests</h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Calendar size={20} />
              </div>
            </div>

            {leavesLoading ? (
              <div className="flex py-6 justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            ) : leaveRequests.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                All caught up! No pending requests.
              </div>
            ) : (
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                {leaveRequests.map(req => (
                  <div key={req._id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-snug">{req.studentName}</p>
                        <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">{req.studentEmail}</p>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-blue-50 text-blue-700 shrink-0">
                        {req.type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 italic">"{req.reason}"</p>

                    <div className="text-[10px] font-semibold text-slate-700 bg-white p-2 rounded-lg border border-slate-100">
                      {req.type === 'Leave' ? (
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-slate-400" />
                          {new Date(req.startDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} – {new Date(req.endDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                        </span>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-slate-400" />
                            {new Date(req.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-400 ml-4 text-[9px]">
                            <Clock size={10} className="text-slate-300" />
                            {req.startTime} – {req.endTime}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-1">
                      <button
                        type="button"
                        disabled={submittingId === req._id}
                        onClick={() => handleReviewLeave(req._id, 'Approved')}
                        className="flex-1 flex items-center justify-center gap-1 h-7 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg text-[10px] font-bold transition shadow-sm"
                      >
                        <Check size={12} />
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={submittingId === req._id}
                        onClick={() => handleReviewLeave(req._id, 'Rejected')}
                        className="flex-1 flex items-center justify-center gap-1 h-7 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-lg text-[10px] font-bold transition shadow-sm"
                      >
                        <X size={12} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>

          <SurfaceCard className="p-5 md:p-6">
            <p className="text-sm font-medium text-slate-500">System Notes</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">Today’s summary</h2>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Placement conversion</p>
                <p className="mt-1 text-sm text-slate-600">
                  {dynamicStats.directory.total ? Math.round((dynamicStats.directory.placed / dynamicStats.directory.total) * 100) : 0}% of tracked candidates are placed.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Action required</p>
                <p className="mt-1 text-sm text-slate-600">
                  {dynamicStats.directory.needToFilled} profile{dynamicStats.directory.needToFilled === 1 ? '' : 's'} still need updates from the placement team.
                </p>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </AppShell>
  );
}
