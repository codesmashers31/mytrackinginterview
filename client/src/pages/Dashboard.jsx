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
  X
} from 'lucide-react';
import { AppShell, MetricCard, SectionTabs, StatusBadge, SurfaceCard } from '../components/AppShell';
import { authHeaders, logout } from '../utils/auth';
import { buildApiUrl } from '../utils/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeActivityTab, setActiveActivityTab] = useState('regular');

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

    fetchLeaveRequests();
  }, []);

  const pipelineBreakdown = useMemo(() => {
    if (!stats) return [];

    const total = Math.max(stats.total || 0, 1);
    return [
      { label: 'Placed', value: stats.placed || 0, tone: 'success' },
      { label: 'Job Seekers', value: stats.jobSeekers || 0, tone: 'primary' },
      { label: 'Needs Update', value: stats.needToFilled || 0, tone: 'warning' },
      { label: 'Inactive Users', value: stats.inactiveUsers || 0, tone: 'info' },
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
          { label: 'Frontend Students', onClick: () => navigate('/admin/frontend-students') },
          { label: 'Eligibility Engine', onClick: () => navigate('/eligibility') },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
          title="Inactive Users"
          value={stats.inactiveUsers}
          helper="Students not responding or unreachable"
          tone="warning"
          icon={<UserX size={20} />}
        />
        <MetricCard
          title="Frontend Track"
          value={stats.frontendTotal}
          helper="All frontend candidates tracked"
          tone="primary"
          icon={<Users size={20} />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.8fr_1fr]">
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
                Directory Students ({stats.total || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveActivityTab('frontend')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeActivityTab === 'frontend' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Frontend Students ({stats.frontendTotal || 0})
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                {activeActivityTab === 'regular' ? (
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
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Grade
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Status
                    </th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Candidate
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Batch
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Batch Year
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      City
                    </th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {activeActivityTab === 'regular' ? (
                  stats.recent.length > 0 ? (
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
                      <td colSpan="5" className="px-4 py-10 text-center text-sm text-slate-500">
                        No recent student records available.
                      </td>
                    </tr>
                  )
                ) : (
                  stats.recentFrontend && stats.recentFrontend.length > 0 ? (
                    stats.recentFrontend.map(student => (
                      <tr key={student._id} className="transition hover:bg-slate-50">
                        <td className="px-4 py-3.5">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{student.name}</p>
                            <p className="text-xs text-slate-500">{student.mobile}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-600">{student.batch || 'No Batch'}</td>
                        <td className="px-4 py-3.5 text-sm text-slate-600">{student.passedOutYear || 'N/A'}</td>
                        <td className="px-4 py-3.5 text-sm text-slate-600 text-right">{student.city || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-10 text-center text-sm text-slate-500">
                        No recent frontend student records available.
                      </td>
                    </tr>
                  )
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
