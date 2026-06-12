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
    companyApply: '',
    taskWorkProcess: '',
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
    if (!formData.companyApply.trim() || !formData.taskWorkProcess.trim() || !formData.date) {
      toast.error('Company Apply, Task Work Process, and Date are required');
      return;
    }
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
      setFormData({
        companyApply: '',
        taskWorkProcess: '',
        date: new Date().toISOString().split('T')[0]
      });

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
      (log.companyApply || '').toLowerCase().includes(searchLower) ||
      (log.taskWorkProcess || '').toLowerCase().includes(searchLower) ||
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
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] md:text-xs font-bold text-blue-600 uppercase tracking-widest">{logDate.toDateString()}</span>
                      </div>
                      <h4 className="text-sm md:text-base font-bold text-[#1e293b] mb-1">{log.companyApply || 'Company Apply'}</h4>
                      <p className="text-xs md:text-sm text-slate-600 mb-2">{log.taskWorkProcess}</p>
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
            <SurfaceCard className="p-6 md:p-8 flex flex-col border-t-[12px] border-blue-600 rounded-3xl shadow-lg relative overflow-hidden max-h-[calc(100vh-120px)]">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <BookOpen size={120} />
            </div>
            <div className="shrink-0">
              <h2 className="text-xl font-black text-[#1e293b] mb-2 relative z-10">Log Today's Work</h2>
              <p className="text-sm text-slate-500 mb-6 font-medium relative z-10">Record your company applications and tasks to maintain your streak.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1 relative z-10 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
              
              {/* Date Selection */}
              <div>
                <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2">Activity Date <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm font-semibold text-[#1e293b] transition-all"
                    required
                  />
                </div>
              </div>

              {/* Company Apply */}
              <div>
                <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2">Company Apply <span className="text-rose-500">*</span></label>
                <textarea 
                  value={formData.companyApply}
                  onChange={(e) => setFormData({...formData, companyApply: e.target.value})}
                  placeholder="e.g. Google, Microsoft, Infosys..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm font-semibold text-[#1e293b] placeholder-slate-400 min-h-[80px] resize-y transition-all"
                  required
                ></textarea>
              </div>

              {/* Task Work Process */}
              <div>
                <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2">Task Work Process <span className="text-rose-500">*</span></label>
                <textarea 
                  value={formData.taskWorkProcess}
                  onChange={(e) => setFormData({...formData, taskWorkProcess: e.target.value})}
                  placeholder="Describe the tasks, interviews, or preparation completed today..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm font-medium text-[#1e293b] placeholder-slate-400 min-h-[120px] resize-y transition-all"
                  required
                ></textarea>
              </div>

                <div className="mt-auto pt-6">
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {submitting ? (
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <>
                        <Plus size={18} strokeWidth={2.5} />
                        <span>Save Daily Activity</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </SurfaceCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
