import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, CheckCircle } from 'lucide-react';
import { AppShell, SectionTabs, SurfaceCard, MetricCard } from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';

export default function CoordinatorSplClasses() {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(buildApiUrl('/spl-registration'), { headers: authHeaders() }).then(r => r.json().catch(() => [])),
      fetch(buildApiUrl('/teams'), { headers: authHeaders() }).then(r => r.json().catch(() => []))
    ])
    .then(([regData, teamData]) => {
      setRegistrations(Array.isArray(regData) ? regData : []);
      setTeams(Array.isArray(teamData) ? teamData : []);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, []);

  const filtered = registrations.filter(r =>
    !search ||
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.email?.toLowerCase().includes(search.toLowerCase()) ||
    r.batch?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <div className="crm-surface flex items-center gap-3 px-6 py-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Loading SPL classes...</p>
        </div>
      </div>
    );
  }

  const newCount = registrations.filter(r => r.status === 'New').length;
  const approvedCount = registrations.filter(r => r.status === 'Approved').length;

  return (
    <AppShell
      title="SPL Classes"
      subtitle="View and manage all SPL class registrations assigned to your group."
      searchPlaceholder="Search registrations by name, email or batch..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <SectionTabs
        items={[
          { label: 'Dashboard', onClick: () => navigate('/coordinator/dashboard') },
          { label: 'SPL Classes', active: true },
          { label: 'Eligibility', onClick: () => navigate('/coordinator/eligibility') },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        <MetricCard
          title="Total Registrations"
          value={registrations.length}
          helper="All SPL class entries"
          tone="primary"
          icon={<BookOpen size={20} />}
        />
        <MetricCard
          title="New"
          value={newCount}
          helper="Pending review"
          tone="warning"
          icon={<Clock size={20} />} // adding missing icon
        />
        <MetricCard
          title="Approved"
          value={approvedCount}
          helper="Confirmed registrations"
          tone="success"
          icon={<CheckCircle size={20} />} // adding missing icon
        />
      </div>

      <SurfaceCard className="p-5 md:p-6">
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <h2 className="text-xl font-semibold text-slate-950">
            Registration List
            <span className="ml-2 text-base font-normal text-slate-400">({filtered.length})</span>
          </h2>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-slate-500 py-8 text-center">No registrations found.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Degree</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Batch</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Team</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map(reg => (
                  <tr key={reg._id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3.5 text-sm font-semibold text-slate-900">{reg.name}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{reg.email || '—'}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{reg.degree || '—'}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{reg.batch || '—'}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">
                      {teams.find(t => t.members?.some(m => m === reg._id || m._id === reg._id)) ? (
                        <span className="font-bold text-indigo-700 bg-indigo-50/50 px-2 py-0.5 rounded text-[10px] border border-indigo-100/30">
                          {teams.find(t => t.members?.some(m => m === reg._id || m._id === reg._id))?.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs font-medium">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        reg.status === 'Approved' ? 'bg-emerald-100 text-emerald-700'
                        : reg.status === 'Rejected' ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                      }`}>
                        {reg.status || 'New'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SurfaceCard>
    </AppShell>
  );
}
