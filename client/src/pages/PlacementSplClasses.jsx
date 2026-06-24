import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard, StatusBadge, SectionTabs } from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import { Edit, Check, X, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';

const STATUS_OPTIONS = ['New', 'Reviewed', 'Shortlisted', 'Rejected', 'Placed'];
const ITEMS_PER_PAGE = 8;

export default function PlacementSplClasses() {
  const navigate = useNavigate();
  const [regs, setRegs] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [editState, setEditState] = useState({
    name: '',
    email: '',
    mobile: '',
    degree: '',
    batch: '',
    willingCompanyProcess: false,
    willing30Days: '',
    acceptOffer: '',
    fullEffort: '',
    issues: '',
    needMost: '',
    status: 'New',
    statusReason: '',
    grade: '',
  });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchRegs = async () => {
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl('/spl-registration'), { headers: { ...authHeaders() } });
      if (!res.ok) throw new Error('Failed to load registrations');
      const data = await res.json();
      setRegs(data);
    } catch (err) {
      toast.error('Could not load registrations');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch(buildApiUrl('/teams'), { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    }
  };

  useEffect(() => {
    fetchRegs();
    fetchTeams();
  }, []);

  const filteredRegs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return regs;
    return regs.filter(reg =>
      [reg.name, reg.email, reg.mobile, reg.degree, reg.batch, reg.status]
        .filter(Boolean)
        .some(value => value.toString().toLowerCase().includes(query))
    );
  }, [regs, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRegs.length / ITEMS_PER_PAGE));
  const currentItems = filteredRegs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const openEditModal = (reg) => {
    setSelectedRegistration(reg);
    setEditState({
      name: reg.name || '',
      email: reg.email || '',
      mobile: reg.mobile || '',
      degree: reg.degree || '',
      batch: reg.batch || '',
      willingCompanyProcess: !!reg.willingCompanyProcess,
      willing30Days: reg.willing30Days || '',
      acceptOffer: reg.acceptOffer || '',
      fullEffort: reg.fullEffort || '',
      issues: reg.issues || '',
      needMost: reg.needMost || '',
      status: reg.status || 'New',
      statusReason: reg.statusReason || '',
      grade: reg.grade || '',
    });
  };

  const closeEditModal = () => {
    setSelectedRegistration(null);
    setEditState({ status: 'New', statusReason: '', grade: '' });
  };

  const saveEdit = async () => {
    if (!selectedRegistration) return;
    try {
      const res = await fetch(buildApiUrl(`/spl-registration/${selectedRegistration._id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(editState),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || 'Update failed');
      }
      const updated = await res.json();
      setRegs(prev => prev.map(item => (item._id === updated._id ? updated : item)));
      toast.success('Registration updated');
      closeEditModal();
    } catch (err) {
      toast.error(err.message || 'Update failed');
    }
  };

  const confirmDelete = (reg) => {
    setDeleteTarget(reg);
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  const deleteRegistration = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(buildApiUrl(`/spl-registration/${deleteTarget._id}`), {
        method: 'DELETE',
        headers: { ...authHeaders() },
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || 'Delete failed');
      }
      setRegs(prev => prev.filter(item => item._id !== deleteTarget._id));
      toast.success('Registration removed');
      cancelDelete();
    } catch (err) {
      toast.error(err.message || 'Could not delete registration');
    }
  };

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <AppShell title="Placement SPL Classes" subtitle="View and manage SPL class registrations">
      <SectionTabs
        items={[
          { label: 'Overview', onClick: () => navigate('/placement/dashboard') },
          { label: 'Eligibility Engine', onClick: () => navigate('/placement/eligibility') },
          { label: 'SPL Classes', active: true },
        ]}
      />
      <SurfaceCard>
        <div className="space-y-6 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">SPL Registrations</h2>
              <p className="mt-1 text-sm text-slate-500">Review, update, or delete submitted applications with pagination and search.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Total applications: <span className="font-semibold text-slate-900">{regs.length}</span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Showing page <span className="font-semibold text-slate-900">{currentPage}</span> of <span className="font-semibold text-slate-900">{totalPages}</span>
              </div>
            </div>
          </div>

            <div className="relative col-span-1 lg:col-span-2">
              <input
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search registrations by name, email, mobile, degree, or status"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none shadow-sm transition focus:border-slate-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="sticky top-0 border-b border-slate-200 px-4 py-4 text-left font-semibold">Name</th>
                  <th className="sticky top-0 border-b border-slate-200 px-4 py-4 text-left font-semibold">Email</th>
                  <th className="sticky top-0 border-b border-slate-200 px-4 py-4 text-left font-semibold">Mobile</th>
                  <th className="sticky top-0 border-b border-slate-200 px-4 py-4 text-left font-semibold">Team</th>
                  <th className="sticky top-0 border-b border-slate-200 px-4 py-4 text-left font-semibold">Status</th>
                  <th className="sticky top-0 border-b border-slate-200 px-4 py-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-500">Loading registrations ...</td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-500">No matching registrations found.</td>
                  </tr>
                ) : (
                  currentItems.map((reg, index) => (
                    <tr key={reg._id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-900">{reg.name}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">{reg.email}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">{reg.mobile || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-4">
                        {teams.find(t => t.members?.some(m => m === reg._id || m._id === reg._id)) ? (
                          <span className="font-bold text-indigo-700 bg-indigo-50/50 px-2 py-0.5 rounded text-[10px] border border-indigo-100/30">
                            {teams.find(t => t.members?.some(m => m === reg._id || m._id === reg._id))?.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-medium">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4"><StatusBadge status={reg.status} /></td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(reg)}
                            className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                          >
                            <Edit size={14} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDelete(reg)}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <div>
              Showing <span className="font-semibold text-slate-900">{currentItems.length}</span> of <span className="font-semibold text-slate-900">{filteredRegs.length}</span> results
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft size={16} /> Previous
              </button>
              <span className="text-sm text-slate-800">Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span></span>
              <button
                type="button"
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </SurfaceCard>

      {selectedRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Update registration</h3>
                <p className="mt-2 text-sm text-slate-600">Update the status and reason for {selectedRegistration.name}.</p>
              </div>
              <button type="button" onClick={closeEditModal} className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900">
                <X size={18} />
              </button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <select
                  value={editState.status}
                  onChange={(e) => setEditState(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Reason (optional)</label>
                <input
                  value={editState.statusReason}
                  onChange={(e) => setEditState(prev => ({ ...prev, statusReason: e.target.value }))}
                  placeholder="Enter an optional reason"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Name</label>
                <input
                  value={editState.name}
                  onChange={(e) => setEditState(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={editState.email}
                  onChange={(e) => setEditState(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Mobile</label>
                <input
                  value={editState.mobile}
                  onChange={(e) => setEditState(prev => ({ ...prev, mobile: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Degree</label>
                <input
                  value={editState.degree}
                  onChange={(e) => setEditState(prev => ({ ...prev, degree: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Batch</label>
                <input
                  value={editState.batch}
                  onChange={(e) => setEditState(prev => ({ ...prev, batch: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={editState.willingCompanyProcess}
                    onChange={(e) => setEditState(prev => ({ ...prev, willingCompanyProcess: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Willing Company Process
                </label>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Will you attend 30 days?</label>
                <select
                  value={editState.willing30Days}
                  onChange={(e) => setEditState(prev => ({ ...prev, willing30Days: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Offer acceptance</label>
                <select
                  value={editState.acceptOffer}
                  onChange={(e) => setEditState(prev => ({ ...prev, acceptOffer: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Full effort</label>
                <select
                  value={editState.fullEffort}
                  onChange={(e) => setEditState(prev => ({ ...prev, fullEffort: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Issues</label>
                <textarea
                  value={editState.issues}
                  onChange={(e) => setEditState(prev => ({ ...prev, issues: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  rows={3}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Need most</label>
                <textarea
                  value={editState.needMost}
                  onChange={(e) => setEditState(prev => ({ ...prev, needMost: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  rows={3}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <select
                  value={editState.status}
                  onChange={(e) => setEditState(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Grade (Optional)</label>
                <select
                  value={editState.grade}
                  onChange={(e) => setEditState(prev => ({ ...prev, grade: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">None</option>
                  <option value="A">Grade A</option>
                  <option value="B">Grade B</option>
                  <option value="C">Grade C</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Status reason</label>
                <input
                  value={editState.statusReason}
                  onChange={(e) => setEditState(prev => ({ ...prev, statusReason: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Delete registration</h3>
                <p className="mt-2 text-sm text-slate-600">This will permanently remove the registration for {deleteTarget.name}.</p>
              </div>
              <button type="button" onClick={cancelDelete} className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900">
                <X size={18} />
              </button>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelDelete}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteRegistration}
                className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Delete registration
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
