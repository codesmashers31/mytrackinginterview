import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard, StatusBadge } from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import { Edit, Check, X, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';

const STATUS_OPTIONS = ['New', 'Reviewed', 'Shortlisted', 'Rejected', 'Placed'];
const ITEMS_PER_PAGE = 8;
const STANDARD_STACKS = [
  'MERN Stack',
  'Java Full Stack',
  'Python Full Stack',
  'Frontend Development',
  'QA / Testing',
  'Data Science / AI'
];

export default function SplRegistrations() {
  const [regs, setRegs] = useState([]);
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
    stack: '',
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
  const [modalStackSelect, setModalStackSelect] = useState('');
  const [modalCustomStack, setModalCustomStack] = useState('');
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

  useEffect(() => {
    fetchRegs();
  }, []);

  const filteredRegs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return regs;
    return regs.filter(reg =>
      [reg.name, reg.email, reg.mobile, reg.degree, reg.batch, reg.stack, reg.status]
        .filter(Boolean)
        .some(value => value.toString().toLowerCase().includes(query))
    );
  }, [regs, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRegs.length / ITEMS_PER_PAGE));
  const currentItems = filteredRegs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const openEditModal = (reg) => {
    setSelectedRegistration(reg);
    const isStandard = reg.stack && STANDARD_STACKS.includes(reg.stack);
    setModalStackSelect(reg.stack ? (isStandard ? reg.stack : 'Other') : '');
    setModalCustomStack(reg.stack && !isStandard ? reg.stack : '');
    setEditState({
      name: reg.name || '',
      email: reg.email || '',
      mobile: reg.mobile || '',
      degree: reg.degree || '',
      batch: reg.batch || '',
      stack: reg.stack || '',
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
    setEditState({ status: 'New', statusReason: '', grade: '', stack: '' });
    setModalStackSelect('');
    setModalCustomStack('');
  };

  const saveEdit = async () => {
    if (!selectedRegistration) return;
    try {
      const finalStack = modalStackSelect === 'Other' ? modalCustomStack.trim() : modalStackSelect;
      const payload = { ...editState, stack: finalStack };

      const res = await fetch(buildApiUrl(`/spl-registration/${selectedRegistration._id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
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
    <AppShell title="SPL Registrations" subtitle="Submitted SPL class registrations">
      <SurfaceCard className="overflow-hidden">
        <div className="space-y-4 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">SPL Registrations</h2>
              <p className="mt-1 text-xs text-slate-500 font-medium">Review, update, or delete submitted applications with pagination and search.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700">
                Total: <span className="font-bold text-slate-900">{regs.length}</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700">
                Page <span className="font-bold text-slate-900">{currentPage}</span> of <span className="font-bold text-slate-900">{totalPages}</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <input
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search registrations by name, email, mobile, degree, or status..."
              className="crm-input h-10 rounded-xl"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Name</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Mobile</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Stack</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center">
                      <div className="flex items-center justify-center gap-2 text-slate-505">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                        <span className="text-xs font-semibold">Loading registrations...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-xs font-semibold text-slate-500">
                      No matching registrations found.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((reg, index) => (
                    <tr key={reg._id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="whitespace-nowrap px-3 py-2 text-xs font-bold text-slate-900">{reg.name}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs font-semibold text-slate-750">{reg.email}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-750 font-semibold">{reg.mobile || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-750">{reg.stack || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <StatusBadge status={reg.status} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(reg)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-blue-100 bg-blue-50 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            <Edit size={11} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDelete(reg)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Trash2 size={11} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <div>
              Showing <span className="font-semibold text-slate-900">{currentItems.length}</span> of <span className="font-semibold text-slate-900">{filteredRegs.length}</span> results
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 bg-white rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft size={14} /> Previous
              </button>
              <span className="text-slate-800">Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalPages}</span></span>
              <button
                type="button"
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 bg-white rounded-lg font-bold text-slate-700 hover:bg-slate-50 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next <ArrowRight size={14} />
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
                <label className="text-sm font-medium text-slate-700">Tech Stack</label>
                <select
                  value={modalStackSelect}
                  onChange={(e) => setModalStackSelect(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select Stack</option>
                  {STANDARD_STACKS.map(stackOpt => (
                    <option key={stackOpt} value={stackOpt}>{stackOpt}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>
              {modalStackSelect === 'Other' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Custom Tech Stack</label>
                  <input
                    value={modalCustomStack}
                    onChange={(e) => setModalCustomStack(e.target.value)}
                    placeholder="Enter custom stack"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              )}
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
