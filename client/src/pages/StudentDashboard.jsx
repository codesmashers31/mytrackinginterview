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
  ArrowRight
} from 'lucide-react';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaceData = async () => {
    const studentId = getUserId();
    if (!studentId) {
      toast.error('Student ID missing. Re-authenticating...');
      logout();
      return;
    }

    try {
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
      toast.error('Failed to sync dashboard telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, []);

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
    const completedTasksCount = tasks.filter(t => t.overallStatus === 'Completed').length;

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
    ...logs.map(l => ({ type: 'log', date: new Date(l.date), title: 'Daily Log Created', desc: l.activity, id: l._id })),
    ...attendance.filter(a => a.checkInTime).map(a => ({ type: 'attendance', date: new Date(a.date), title: 'Attendance Marked', desc: `Status: ${a.status} ${a.totalHours ? `(${a.totalHours} hrs)` : ''}`, id: a._id })),
    ...tasks.filter(t => t.overallStatus === 'Completed').map(t => ({ type: 'task', date: new Date(t.createdAt), title: 'Task Completed', desc: t.title, id: t._id }))
  ].sort((a, b) => b.date - a.date).slice(0, 5);

  return (
    <AppShell
      title="Student Dashboard"
      subtitle="Overview of your tasks, attendance, and daily logs."
    >
      <div className="grid gap-6 md:grid-cols-3 mb-8">
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
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left Side: Activity Feed */}
        <div className="space-y-6">
          <SurfaceCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Activity size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
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
                    <div className="mt-1">
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

        {/* Right Side: Quick Actions */}
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
            </div>
          </SurfaceCard>
        </div>
      </div>
    </AppShell>
  );
}
