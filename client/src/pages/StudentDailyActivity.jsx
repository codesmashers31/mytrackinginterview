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
  CheckSquare,
  FileText,
  Flame
} from 'lucide-react';

export default function StudentDailyActivity() {
  const [logs, setLogs] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    activity: '',
    companyDetails: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchWorkspaceData = async () => {
    const studentId = getUserId();
    if (!studentId) {
      toast.error('Student ID missing. Re-authenticating...');
      logout();
      return;
    }

    try {
      // Fetch activity logs, attendance, and tasks concurrently
      const [logsRes, attendanceRes, tasksRes] = await Promise.all([
        fetch(buildApiUrl('/daily-activities/my'), { headers: authHeaders() }),
        fetch(buildApiUrl(`/attendance/student/${studentId}`), { headers: authHeaders() }),
        fetch(buildApiUrl('/tasks/my/list'), { headers: authHeaders() })
      ]);

      if (logsRes.status === 401 || attendanceRes.status === 401 || tasksRes.status === 401) {
        logout();
        return;
      }

      const logsData = logsRes.ok ? await logsRes.json() : [];
      const attendanceData = attendanceRes.ok ? await attendanceRes.json() : [];
      const tasksData = tasksRes.ok ? await tasksRes.json() : [];

      setLogs(logsData);
      setAttendance(attendanceData);
      setTasks(tasksData);
    } catch (err) {
      toast.error('Failed to sync student workspace telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, []);

  const calculateTelemetry = () => {
    // 1. Total Hours Invested (from check-in/checkout attendance totalHours)
    const totalHours = attendance.reduce((sum, record) => sum + (record.totalHours || 0), 0);

    // 2. Activity Last 7 Days (attendance hours logged in the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyHours = attendance
      .filter(record => new Date(record.date) >= sevenDaysAgo)
      .reduce((sum, record) => sum + (record.totalHours || 0), 0);

    // 3. Daily Logging Streak (based on attendance records)
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
      if (diffDays > 1) return 0; // No attendance today or yesterday

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.activity.trim()) return toast.error('Please describe your activity');

    setSubmitting(true);
    try {
      const res = await fetch(buildApiUrl('/daily-activities'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');

      toast.success('Activity logged successfully!');
      
      // Reset form title and description, keep date as today
      setFormData(prev => ({
        ...prev,
        activity: '',
        companyDetails: ''
      }));

      // Reload data
      fetchWorkspaceData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const telemetry = calculateTelemetry();

  const filteredLogs = logs.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    return (
      log.activity.toLowerCase().includes(searchLower) ||
      (log.companyDetails || '').toLowerCase().includes(searchLower) ||
      new Date(log.date).toLocaleDateString().includes(searchLower)
    );
  });

  return (
    <AppShell
      title="Daily Activity Workspace"
      subtitle="Log your daily activity, search or track company details, and monitor your attendance logs."
      searchPlaceholder="Search logged activities..."
    >
      {/* Telemetry Dashboard - Populated from Attendance & Tasks */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <MetricCard 
          title="Total Hours Invested" 
          value={`${telemetry.totalHours} hrs`} 
          helper="Calculated from check-in/out attendance records"
          icon={<Clock size={22} />}
          tone="primary"
        />
        <MetricCard 
          title="Activity (Last 7 Days)" 
          value={`${telemetry.weeklyHours} hrs`} 
          helper="Study/Work hours completed in the past week"
          icon={<BookOpen size={22} />}
          tone="success"
        />
        <MetricCard 
          title="Daily Logging Streak" 
          value={`${telemetry.streak} Days`} 
          helper="Consecutive days of logged attendance"
          icon={<Flame size={22} />}
          tone="warning"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
        {/* Left Side: Activity Timeline */}
        <div className="space-y-6 order-2 lg:order-1">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">Activity History</h2>
            
            <div className="relative w-full sm:w-[260px]">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search logs..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-shadow" 
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <SurfaceCard className="p-12 text-center text-slate-500">
              <div className="mb-4 text-4xl">🗒️</div>
              <p className="text-lg font-semibold text-slate-900">No activity logs found</p>
              <p className="mt-2 text-sm max-w-sm mx-auto">
                {searchTerm ? "No logs match your search term." : "Submit the form on the right to log your first activity log."}
              </p>
            </SurfaceCard>
          ) : (
            <div className="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-blue-200 before:to-slate-200 space-y-6">
              {filteredLogs.map(log => {
                const logDate = new Date(log.date);

                return (
                  <div key={log._id} className="relative group">
                    {/* Timeline Node */}
                    <div className="absolute -left-[23px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-500 shadow-sm transition-transform group-hover:scale-125" />

                    <SurfaceCard className="p-5 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md w-fit">
                          {logDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        
                        {log.companyDetails && (
                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100/50">
                            <Building2 size={12} />
                            {log.companyDetails}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <FileText size={16} className="text-slate-400 shrink-0 mt-1" />
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{log.activity}</p>
                      </div>
                    </SurfaceCard>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Submission Form */}
        <div className="order-1 lg:order-2">
          <div className="sticky top-[100px]">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6">Log Today's Work</h2>
            
            <SurfaceCard className="p-6 border-slate-200/60 shadow-[0_16px_40px_rgba(15,23,42,0.08)] bg-white/80 backdrop-blur-md">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="crm-label">Activity Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" size={16} />
                    <input 
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="crm-input pl-11"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="crm-label">Activity Details</label>
                  <textarea
                    name="activity"
                    value={formData.activity}
                    onChange={handleInputChange}
                    placeholder="Describe what tasks or activities you performed today..."
                    className="crm-input h-32 py-3 resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="crm-label">Company Details / Search</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" size={16} />
                    <textarea 
                      name="companyDetails"
                      value={formData.companyDetails}
                      onChange={handleInputChange}
                      placeholder="e.g. Applied to SLA, searched frontend jobs..."
                      className="crm-input pl-11 py-3 min-h-[80px] resize-y"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={submitting}
                  className="crm-btn-primary w-full h-[46px] rounded-2xl font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Plus size={18} />
                      Save Log Entry
                    </>
                  )}
                </button>
              </form>
            </SurfaceCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
