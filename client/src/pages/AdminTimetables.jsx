import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard, MetricCard, SectionTabs } from '../components/AppShell';
import { authHeaders, logout } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import { 
  Clock, 
  Users, 
  CheckCircle2, 
  Search, 
  Filter, 
  Calendar, 
  Award, 
  Eye, 
  Code2, 
  Briefcase, 
  Moon, 
  Flame, 
  TrendingUp,
  BookOpen,
  ChevronRight
} from 'lucide-react';

export default function AdminTimetables() {
  const navigate = useNavigate();
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [batchFilter, setBatchFilter] = useState('All');

  // Inspect Modal
  const [inspectedTimetable, setInspectedTimetable] = useState(null);

  const fetchTimetables = async () => {
    try {
      const res = await fetch(buildApiUrl('/timetables/admin'), {
        headers: authHeaders()
      });

      if (res.status === 401) {
        logout();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setTimetables(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      toast.error('Failed to load student timetables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetables();
  }, []);

  // Filtered List
  const filteredTimetables = useMemo(() => {
    return timetables.filter(t => {
      if (batchFilter !== 'All' && t.batch !== batchFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = t.studentName?.toLowerCase().includes(q);
        const matchesEmail = t.studentEmail?.toLowerCase().includes(q);
        const matchesSkill = t.selectedSubjects?.some(s => s.toLowerCase().includes(q));
        if (!matchesName && !matchesEmail && !matchesSkill) return false;
      }
      return true;
    });
  }, [timetables, batchFilter, searchQuery]);

  // Derived Batches
  const batchOptions = useMemo(() => {
    const batches = timetables.map(t => t.batch).filter(Boolean);
    return ['All', ...new Set(batches)].sort();
  }, [timetables]);

  // Metrics
  const avgStudyHours = useMemo(() => {
    if (timetables.length === 0) return 0;
    const total = timetables.reduce((sum, t) => sum + (t.availableSelfStudyHours || 0), 0);
    return (total / timetables.length).toFixed(1);
  }, [timetables]);

  const avgCompletionRate = useMemo(() => {
    if (timetables.length === 0) return 0;
    const total = timetables.reduce((sum, t) => sum + (t.todayProgress?.completionRate || 0), 0);
    return Math.round(total / timetables.length);
  }, [timetables]);

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'Technical Practice':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Technical Class':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Aptitude Practice':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Communication Practice':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Theory & Concepts':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Work / College':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Sleep':
        return 'bg-slate-800 text-slate-200 border-slate-700';
      case 'Break / Meals':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <div className="crm-surface flex items-center gap-3 px-6 py-4 rounded-2xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-bold text-slate-700">Loading student study routines...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      title="Student Study Timetables & Daily Routines"
      subtitle="Monitor candidate daily time budgets, subject focuses, and task completion velocity."
      searchPlaceholder="Search candidate routines..."
    >
      <SectionTabs
        items={[
          { label: 'Overview', onClick: () => navigate('/dashboard') },
          { label: 'Regular Students', onClick: () => navigate('/students') },
          { label: 'Frontend Students', onClick: () => navigate('/admin/frontend-students') },
          { label: 'Daily Activity Logs', onClick: () => navigate('/admin/daily-activities') },
          { label: 'Study Timetables', active: true },
        ]}
      />

      {/* Top Metric KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Active Timetables"
          value={timetables.length}
          helper="Configured student study plans"
          tone="primary"
          icon={<Clock size={20} />}
        />
        <MetricCard
          title="Avg Study Allocation"
          value={`${avgStudyHours} hrs / day`}
          helper="Dedicated self-study hours"
          tone="success"
          icon={<TrendingUp size={20} />}
        />
        <MetricCard
          title="Avg Today's Progress"
          value={`${avgCompletionRate}%`}
          helper="Routines checked today"
          tone="warning"
          icon={<CheckCircle2 size={20} />}
        />
        <MetricCard
          title="Active Batches"
          value={batchOptions.length > 1 ? batchOptions.length - 1 : 1}
          helper="Tracked batch groups"
          tone="neutral"
          icon={<Users size={20} />}
        />
      </div>

      {/* Search & Batch Filters */}
      <SurfaceCard className="p-4 mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search by student name, email, or skill..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={15} className="text-slate-400" />
            <select
              value={batchFilter}
              onChange={e => setBatchFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
            >
              {batchOptions.map(b => (
                <option key={b} value={b}>{b === 'All' ? 'All Batches' : b}</option>
              ))}
            </select>
          </div>
        </div>
      </SurfaceCard>

      {/* Student Timetables Table */}
      <SurfaceCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900">Configured Student Study Plans</h3>
            <p className="text-xs text-slate-400">Total {filteredTimetables.length} candidate routines found</p>
          </div>
        </div>

        {filteredTimetables.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
            No student study timetables match your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Candidate</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Batch</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-center">Study Budget</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Target Subjects</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Today's Progress</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredTimetables.map(t => {
                  const progress = t.todayProgress || { completionRate: 0, completedCount: 0, totalCount: 0 };
                  return (
                    <tr key={t._id} className="hover:bg-slate-50 transition font-medium">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{t.studentName}</div>
                        <div className="text-[10px] text-slate-400">{t.studentEmail}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-700">{t.batch || 'Batch 1'}</span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl">
                          <Clock size={12} />
                          <span>{t.availableSelfStudyHours || 0}h / day</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {t.selectedSubjects?.slice(0, 4).map(sub => (
                            <span key={sub} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              {sub}
                            </span>
                          ))}
                          {t.selectedSubjects?.length > 4 && (
                            <span className="text-[10px] font-bold text-slate-400 self-center">
                              +{t.selectedSubjects.length - 4}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="w-36">
                          <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                            <span>{progress.completedCount} / {progress.totalCount} Slots</span>
                            <span>{progress.completionRate}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${progress.completionRate}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setInspectedTimetable(t)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-xs rounded-xl transition"
                        >
                          <Eye size={13} />
                          <span>Inspect Schedule</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SurfaceCard>

      {/* ---------------------------------------------------- */}
      {/* MODAL: INSPECT STUDENT 24H SCHEDULE */}
      {/* ---------------------------------------------------- */}
      {inspectedTimetable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900">{inspectedTimetable.studentName}'s 24-Hour Study Routine</h3>
                <p className="text-xs text-slate-400">{inspectedTimetable.studentEmail} • {inspectedTimetable.batch || 'Batch 1'}</p>
              </div>
              <button onClick={() => setInspectedTimetable(null)} className="p-1.5 text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              {/* Commitments Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Sleep & Rest</span>
                  <span className="text-sm font-black text-slate-800">{inspectedTimetable.sleepHours} hrs</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Work / College</span>
                  <span className="text-sm font-black text-slate-800">{inspectedTimetable.workOrJobHours} hrs</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Classes</span>
                  <span className="text-sm font-black text-slate-800">{Number(inspectedTimetable.technicalClassHours || 0) + Number(inspectedTimetable.communicationClassHours || 0) + Number(inspectedTimetable.aptitudeClassHours || 0)} hrs</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="text-[10px] uppercase font-bold text-blue-600 block">Dedicated Study</span>
                  <span className="text-sm font-black text-blue-900">{inspectedTimetable.availableSelfStudyHours} hrs</span>
                </div>
              </div>

              {/* Skills Tags */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">Target Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {inspectedTimetable.selectedSubjects?.map(s => (
                    <span key={s} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Time Slots List */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">Daily Schedule Slots ({inspectedTimetable.slots?.length || 0})</h4>
                <div className="space-y-2.5">
                  {inspectedTimetable.slots?.map((slot, index) => (
                    <div key={slot.id || index} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-black text-slate-900">{slot.title}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.2 rounded-full border ${getCategoryBadge(slot.category)}`}>
                            {slot.category}
                          </span>
                        </div>
                        {slot.targetDescription && (
                          <p className="text-[11px] text-slate-600 mb-1">{slot.targetDescription}</p>
                        )}
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock size={11} />
                          <span>{slot.startTime} – {slot.endTime} ({slot.durationMinutes || 60} mins)</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setInspectedTimetable(null)}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Close Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
