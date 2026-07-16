import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, CheckCircle2, ClipboardList } from 'lucide-react';
import { AppShell, MetricCard, SectionTabs, SurfaceCard } from '../components/AppShell';
import { authHeaders, logout } from '../utils/auth';
import { buildApiUrl, cachedGet } from '../utils/api';

export default function CoordinatorDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [splClasses, setSplClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      cachedGet('/students').catch(() => []),
      cachedGet('/spl-registration').catch(() => [])
    ]).then(([s, spl]) => {
      setStudents(Array.isArray(s) ? s : []);
      setSplClasses(Array.isArray(spl) ? spl : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

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

  const placed = students.filter(s => s.currentStatus === 'Placed').length;
  const seeking = students.filter(s => s.currentStatus === 'Job Seeker').length;

  return (
    <AppShell
      title="Coordinator Dashboard"
      subtitle="Manage students, SPL classes, and eligibility for your placement group."
      searchPlaceholder="Search students or classes"
    >
      <SectionTabs
        items={[
          { label: 'Overview', active: true },
          { label: 'SPL Classes', onClick: () => navigate('/coordinator/spl-classes') },
          { label: 'Eligibility', onClick: () => navigate('/coordinator/eligibility') },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 mt-2">
        <MetricCard
          title="Total Students"
          value={students.length}
          helper="All students under your supervision"
          tone="primary"
          icon={<Users size={20} />}
        />
        <MetricCard
          title="Placed"
          value={placed}
          helper="Students successfully placed"
          tone="success"
          icon={<CheckCircle2 size={20} />}
        />
        <MetricCard
          title="Job Seekers"
          value={seeking}
          helper="Actively seeking placement"
          tone="warning"
          icon={<ClipboardList size={20} />}
        />
        <MetricCard
          title="SPL Registrations"
          value={splClasses.length}
          helper="Total SPL class entries"
          tone="info"
          icon={<BookOpen size={20} />}
        />
      </div>

      <div className="mt-6">
        <SurfaceCard className="p-5 md:p-6">
          <p className="text-sm font-medium text-slate-500 mb-1">Student List</p>
          <h2 className="text-xl font-semibold text-slate-950 mb-4">All students under supervision</h2>
          {students.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">No student records found.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Degree</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {students.slice(0, 10).map(student => (
                    <tr key={student._id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-3.5 text-sm font-semibold text-slate-900">{student.name}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">{student.degree || '—'}</td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          student.currentStatus === 'Placed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : student.currentStatus === 'Job Seeker'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {student.currentStatus || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
