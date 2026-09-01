import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  BriefcaseBusiness,
  CheckCircle2,
  TrendingUp,
  Users,
  Briefcase,
  Award,
  Sparkles,
  ChevronRight,
  Mail,
  ExternalLink
} from 'lucide-react';
import { AppShell, MetricCard, SectionTabs, StatusBadge, SurfaceCard } from '../components/AppShell';
import { authHeaders, logout } from '../utils/auth';
import { buildApiUrl } from '../utils/api';

export default function PlacementDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(buildApiUrl('/students/stats'), {
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

  const telemetry = stats?.telemetry || {
    applications: { total: 0, today: 0, shortlisted: 0, recent: [] },
    interviews: { total: 0, cleared: 0, recent: [] }
  };

  const pipelineBreakdown = useMemo(() => {
    if (!stats) return [];

    const total = Math.max(stats.total || 0, 1);
    const placed = stats.placed || 0;
    const seekers = stats.jobSeekers || 0;

    return [
      { label: 'Placed Candidates', value: placed, tone: 'success' },
      { label: 'Active Job Seekers', value: seekers, tone: 'primary' },
      { label: 'Needs Updates', value: stats.needToFilled || 0, tone: 'warning' },
      { label: 'Inactive / Suspended', value: stats.inactiveUsers || 0, tone: 'info' },
    ].map(item => ({
      ...item,
      percent: Math.round((item.value / total) * 100),
    }));
  }, [stats]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <div className="crm-surface flex items-center gap-3 px-6 py-4 rounded-2xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-bold text-slate-700">Loading placement workspace...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <AppShell
        title="Placement Dashboard"
        subtitle="Operational overview for placement performance and candidate tracking."
        searchPlaceholder="Search insights"
      >
        <SurfaceCard className="flex min-h-[280px] items-center justify-center p-8 text-center">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Unable to load placement data</h2>
            <p className="mt-2 text-sm text-slate-500">The server request failed. Please refresh the page.</p>
          </div>
        </SurfaceCard>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Placement Executive Dashboard"
      subtitle="Operational hub for tracking placements, candidate drives, company applications, and interview velocity."
      searchPlaceholder="Search candidate profiles or companies..."
    >
      <SectionTabs
        items={[
          { label: 'Overview', active: true },
          { label: 'Placement Eligibility Engine', onClick: () => navigate('/placement/eligibility') },
          { label: 'SPL Class Hub', onClick: () => navigate('/placement/spl-classes') },
        ]}
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6">
        <MetricCard
          title="Placement Candidates"
          value={stats.total || 0}
          helper="Regular placement pool"
          icon={<Users size={20} />}
          tone="neutral"
        />
        <MetricCard
          title="Placed Students"
          value={stats.placed || 0}
          helper="Regular placed candidates"
          tone="success"
          icon={<CheckCircle2 size={20} />}
        />
        <MetricCard
          title="Active Seekers"
          value={stats.jobSeekers || 0}
          helper="Regular job seekers"
          tone="primary"
          icon={<BriefcaseBusiness size={20} />}
        />
        <MetricCard
          title="Applications Sent"
          value={telemetry.applications?.total || 0}
          helper={`${telemetry.applications?.today || 0} applied today`}
          tone="primary"
          icon={<Briefcase size={20} />}
        />
        <MetricCard
          title="Interviews Logged"
          value={telemetry.interviews?.total || 0}
          helper={`${telemetry.interviews?.cleared || 0} cleared / offers`}
          tone="warning"
          icon={<Award size={20} />}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${stats.total ? Math.round(((stats.placed || 0) / Math.max(1, stats.total)) * 100) : 0}%`}
          helper="Regular placement rate"
          tone="success"
          icon={<TrendingUp size={20} />}
        />
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-6">
        
        {/* Left Side: Recent Applications & Interview Feeds */}
        <div className="space-y-6">
          {/* Recent Applications Feed */}
          <SurfaceCard className="p-5 md:p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Briefcase size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Recent Candidate Company Applications</h3>
                  <p className="text-[11px] text-slate-400">Live outreach logged by candidates</p>
                </div>
              </div>
            </div>

            {telemetry.applications?.recent && telemetry.applications.recent.length > 0 ? (
              <div className="space-y-3">
                {telemetry.applications.recent.map(app => (
                  <div key={app._id} className="p-3.5 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-100 transition flex items-start justify-between gap-3">
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
              <div className="py-8 text-center text-xs text-slate-400">
                No recent company applications logged yet.
              </div>
            )}
          </SurfaceCard>

          {/* Recent Candidates Updated */}
          <SurfaceCard className="p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Latest Candidate Profiles</h3>
                <p className="text-[11px] text-slate-400">Recently modified student records</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Candidate</th>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Degree</th>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Grade</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {stats.recent && stats.recent.length > 0 ? (
                    stats.recent.map(student => (
                      <tr key={student._id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-bold text-slate-900">{student.name}</td>
                        <td className="px-4 py-3 text-slate-600 font-medium">{student.degree || '—'}</td>
                        <td className="px-4 py-3 font-bold text-blue-600">{student.grade || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <StatusBadge status={student.currentStatus} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-slate-400">No recent student records available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        </div>

        {/* Right Side: Pipeline Health & Summary */}
        <div className="space-y-6">
          <SurfaceCard className="p-5 md:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pipeline Health</p>
                <h2 className="mt-1 text-base font-black text-slate-900">Placement Distribution</h2>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <TrendingUp size={18} />
              </div>
            </div>

            <div className="space-y-4">
              {pipelineBreakdown.map(item => (
                <div key={item.label}>
                  <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700">{item.label}</span>
                    <span className="text-slate-900 font-bold">{item.value} ({item.percent}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
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

          <SurfaceCard className="p-5 md:p-6 space-y-4">
            <h3 className="text-sm font-black text-slate-900">Quick Actions</h3>
            <button
              onClick={() => navigate('/placement/eligibility')}
              className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100/80 rounded-xl text-blue-700 font-bold text-xs transition"
            >
              <span>Launch Eligibility Matching Engine</span>
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => navigate('/placement/spl-classes')}
              className="w-full flex items-center justify-between p-3 bg-amber-50 hover:bg-amber-100/80 rounded-xl text-amber-800 font-bold text-xs transition"
            >
              <span>Manage SPL Class Candidates ({stats.splStats?.total || 0})</span>
              <ChevronRight size={14} />
            </button>
          </SurfaceCard>
        </div>
      </div>
    </AppShell>
  );
}
