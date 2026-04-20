import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  TrendingUp,
  Users,
} from 'lucide-react';
import { AppShell, MetricCard, SectionTabs, StatusBadge, SurfaceCard } from '../components/AppShell';
import { authHeaders, logout } from '../utils/auth';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/students/stats`, {
      headers: { ...authHeaders() },
    })
      .then(async res => {
        if (res.status === 401) {
          logout();
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data) setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const pipelineBreakdown = useMemo(() => {
    if (!stats) return [];

    const total = Math.max(stats.total || 0, 1);
    return [
      { label: 'Placed', value: stats.placed || 0, tone: 'success' },
      { label: 'Job Seekers', value: stats.jobSeekers || 0, tone: 'primary' },
      { label: 'Needs Update', value: stats.needToFilled || 0, tone: 'warning' },
      { label: 'Interviewing', value: stats.interviewProcess || 0, tone: 'info' },
    ].map(item => ({
      ...item,
      percent: Math.round((item.value / total) * 100),
    }));
  }, [stats]);

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
          { label: 'Eligibility Engine', onClick: () => navigate('/eligibility') },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Candidates"
          value={stats.total}
          helper="All student profiles currently tracked"
          icon={<Users size={20} />}
        />
        <MetricCard
          title="Placed Students"
          value={stats.placed}
          helper="Candidates marked as successfully placed"
          tone="success"
          icon={<CheckCircle2 size={20} />}
        />
        <MetricCard
          title="Active Seekers"
          value={stats.jobSeekers}
          helper="Profiles actively seeking roles"
          tone="primary"
          icon={<BriefcaseBusiness size={20} />}
        />
        <MetricCard
          title="Interview Pipeline"
          value={stats.interviewProcess}
          helper="Candidates in active interviews"
          tone="warning"
          icon={<Clock3 size={20} />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.8fr_1fr]">
        <SurfaceCard className="p-5 md:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Recent Activity</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Latest student updates</h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Activity size={20} />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Candidate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Degree
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Batch
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {stats.recent.length > 0 ? (
                  stats.recent.map(student => (
                    <tr key={student._id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{student.name}</p>
                          <p className="text-xs text-slate-500">{student.mobile}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">{student.degree}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">
                        {student.batch || student.passedOutYear || 'Not added'}
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
                )}
              </tbody>
            </table>
          </div>
        </SurfaceCard>

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
            <p className="text-sm font-medium text-slate-500">System Notes</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">Today’s summary</h2>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Placement conversion</p>
                <p className="mt-1 text-sm text-slate-600">
                  {stats.total ? Math.round((stats.placed / stats.total) * 100) : 0}% of tracked candidates are placed.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Action required</p>
                <p className="mt-1 text-sm text-slate-600">
                  {stats.needToFilled} profile{stats.needToFilled === 1 ? '' : 's'} still need updates from the placement team.
                </p>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </AppShell>
  );
}
