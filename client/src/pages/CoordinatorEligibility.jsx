import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { AppShell, SectionTabs, SurfaceCard } from '../components/AppShell';
import { authHeaders, logout } from '../utils/auth';
import { buildApiUrl } from '../utils/api';

export default function CoordinatorEligibility() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetch(buildApiUrl('/students'), { headers: authHeaders() })
      .then(r => {
        if (r.status === 401) { logout(); return []; }
        return r.json().catch(() => []);
      })
      .then(data => {
        setStudents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filters = ['All', 'Eligible', 'Not Eligible', 'Pending'];

  const getEligibility = (student) => {
    if (student.currentStatus === 'Placed' || student.currentStatus === 'Job Seeker') return 'Eligible';
    if (student.currentStatus === 'Not Eligible') return 'Not Eligible';
    return 'Pending';
  };

  const filtered = filter === 'All'
    ? students
    : students.filter(s => getEligibility(s) === filter);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <div className="crm-surface flex items-center gap-3 px-6 py-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Loading eligibility data...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      title="Eligibility Management"
      subtitle="Review and manage student eligibility for placement processes."
      searchPlaceholder="Search students"
    >
      <SectionTabs
        items={[
          { label: 'Dashboard', onClick: () => navigate('/coordinator/dashboard') },
          { label: 'SPL Classes', onClick: () => navigate('/coordinator/spl-classes') },
          { label: 'Eligibility', active: true },
        ]}
      />

      <div className="flex gap-2 flex-wrap mb-4">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
              filter === f
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <SurfaceCard className="p-5 md:p-6">
        <h2 className="text-xl font-semibold text-slate-950 mb-4">
          {filter} Students
          <span className="ml-2 text-base font-normal text-slate-400">({filtered.length})</span>
        </h2>
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-500 py-8 text-center">No students found in this category.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Degree</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Grade</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Eligibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map(student => {
                  const elig = getEligibility(student);
                  return (
                    <tr key={student._id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-semibold text-slate-900">{student.name}</p>
                        <p className="text-xs text-slate-500">{student.mobile || student.email || '—'}</p>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600">{student.degree || '—'}</td>
                      <td className="px-4 py-3.5 text-sm font-semibold">
                        {student.grade ? (
                          <span className={`inline-flex items-center justify-center h-5 w-5 rounded text-[10px] font-bold ${
                            student.grade === 'A' ? 'bg-emerald-100 text-emerald-700'
                            : student.grade === 'B' ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                          }`}>{student.grade}</span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          elig === 'Eligible' ? 'bg-emerald-100 text-emerald-700'
                          : elig === 'Not Eligible' ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}>
                          {elig === 'Eligible' ? <CheckCircle2 size={11} /> : elig === 'Not Eligible' ? <XCircle size={11} /> : <Clock size={11} />}
                          {elig}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SurfaceCard>
    </AppShell>
  );
}
