import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, CheckCircle2, ClipboardList, ShieldCheck, Calendar, TrendingUp } from 'lucide-react';
import { AppShell, MetricCard, SectionTabs, SurfaceCard, StatusBadge } from '../components/AppShell';
import { authHeaders, logout } from '../utils/auth';
import { buildApiUrl, cachedGet } from '../utils/api';

export default function CoordinatorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [splClasses, setSplClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      cachedGet('/students/stats').catch(() => null),
      cachedGet('/students').catch(() => []),
      cachedGet('/spl-registration').catch(() => [])
    ]).then(([st, s, spl]) => {
      if (st) setStats(st);
      setStudents(Array.isArray(s) ? s : []);
      setSplClasses(Array.isArray(spl) ? spl : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <div className="crm-surface flex items-center gap-3 px-6 py-4 rounded-2xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-bold text-slate-700">Loading coordinator overview...</p>
        </div>
      </div>
    );
  }

  const placed = students.filter(s => (s.currentStatus || s.status) === 'Placed').length;
  const seeking = students.filter(s => (s.currentStatus || s.status) === 'Job Seeker').length;
  const checkedInToday = stats?.telemetry?.attendance?.checkedIn || 0;

  return (
    <AppShell
      title="Coordinator Operations Dashboard"
      subtitle="Monitor candidate batches, track office attendance, and supervise SPL class eligibility."
      searchPlaceholder="Search candidates or batch groups..."
    >
      <SectionTabs
        items={[
          { label: 'Overview', active: true },
          { label: 'Regular Students', onClick: () => navigate('/students') },
          { label: 'Attendance & Leaves', onClick: () => navigate('/attendance') },
          { label: 'SPL Classes', onClick: () => navigate('/coordinator/spl-classes') },
          { label: 'Eligibility', onClick: () => navigate('/coordinator/eligibility') },
        ]}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mt-2 mb-6">
        <MetricCard
          title="Total Supervised"
          value={students.length}
          helper="Candidates in directory"
          tone="primary"
          icon={<Users size={20} />}
        />
        <MetricCard
          title="Placed Candidates"
          value={placed}
          helper="Successfully placed"
          tone="success"
          icon={<CheckCircle2 size={20} />}
        />
        <MetricCard
          title="Active Job Seekers"
          value={seeking}
          helper="Actively seeking roles"
          tone="warning"
          icon={<ClipboardList size={20} />}
        />
        <MetricCard
          title="Checked In Today"
          value={checkedInToday}
          helper="Present in office today"
          tone="success"
          icon={<ShieldCheck size={20} />}
        />
        <MetricCard
          title="SPL Registrations"
          value={splClasses.length}
          helper="Enrolled in SPL track"
          tone="neutral"
          icon={<BookOpen size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SurfaceCard className="p-5 md:p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate Registry</p>
              <h2 className="text-base font-black text-slate-900">Recent Candidate Activity</h2>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl">
              {students.length} Candidates
            </span>
          </div>

          {students.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">No student records found.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">Candidate</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">Degree</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-500">Batch</th>
                    <th className="px-4 py-3 text-right font-bold uppercase tracking-wider text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {students.slice(0, 10).map(student => (
                    <tr key={student._id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{student.name}</div>
                        <div className="text-[10px] text-slate-400">{student.email || student.mobile}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-medium">{student.degree || '—'}</td>
                      <td className="px-4 py-3.5 text-slate-800 font-bold">{student.batch || 'Batch 1'}</td>
                      <td className="px-4 py-3.5 text-right">
                        <StatusBadge status={student.currentStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SurfaceCard>

        {/* Right Side: Quick Highlights */}
        <SurfaceCard className="p-5 md:p-6 space-y-4">
          <h3 className="text-sm font-black text-slate-900">Attendance & Shifts</h3>
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-1">
            <span className="text-[10px] font-black uppercase text-emerald-700 block">Office Presence</span>
            <div className="text-2xl font-black text-emerald-800">{checkedInToday} present</div>
            <p className="text-xs text-emerald-600 font-medium">Logged check-in on today's attendance roster</p>
          </div>

          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-1">
            <span className="text-[10px] font-black uppercase text-blue-700 block">SPL Class Cohort</span>
            <div className="text-2xl font-black text-blue-800">{splClasses.length} registered</div>
            <p className="text-xs text-blue-600 font-medium">Special Training & Mock Program Students</p>
          </div>

          <button
            onClick={() => navigate('/attendance')}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            Launch Attendance Management →
          </button>
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
