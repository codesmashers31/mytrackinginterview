import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard, StatusBadge } from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import { Edit, Check, X, Trash2, ArrowLeft, ArrowRight, SlidersHorizontal, ChevronDown, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

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
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    mobile: true,
    degree: false,
    batch: true,
    passedOutYear: true,
    stack: true,
    willingness: false,
    grade: false,
    status: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [editState, setEditState] = useState({
    name: '',
    email: '',
    mobile: '',
    degree: '',
    batch: '',
    passedOutYear: '',
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

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(regs.map(r => ({
      Name: r.name || '',
      Email: r.email || '',
      Mobile: r.mobile || '',
      Degree: r.degree || '',
      Batch: r.batch || '',
      'Batch Year': r.passedOutYear || '',
      City: r.city || '',
      Skills: r.skills || '',
      Stack: r.stack || '',
      'Willing Company Process': r.willingCompanyProcess ? 'Yes' : 'No',
      'Willing 30 Days': r.willing30Days || '',
      'Accept Offer': r.acceptOffer || '',
      'Full Effort': r.fullEffort || '',
      Issues: r.issues || '',
      'Need Most': r.needMost || '',
      Status: r.status || 'New',
      'Status Reason': r.statusReason || '',
      Grade: r.grade || '',
      IP: r.ip || '',
      'User Agent': r.userAgent || '',
      'Created At': r.createdAt ? new Date(r.createdAt).toLocaleString() : ''
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SPL Registrations");
    XLSX.writeFile(wb, "SPL_Registrations.xlsx");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const loadToast = toast.loading('Uploading SPL registrations...');
    try {
      const res = await fetch(buildApiUrl('/spl-registration/upload'), {
        method: 'POST',
        headers: { ...authHeaders() },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Imported successfully', { id: loadToast });
        fetchRegs();
      } else {
        toast.error(data.message || 'Import failed', { id: loadToast });
      }
    } catch (err) {
      toast.error('Network error during import', { id: loadToast });
    }
  };

  useEffect(() => {
    fetchRegs();
  }, []);

  const filteredRegs = useMemo(() => {
    let result = regs;
    if (typeFilter === 'regular') {
      result = result.filter(reg => reg.isMergedStudent === true);
    } else if (typeFilter === 'direct') {
      result = result.filter(reg => reg.isMergedStudent === false);
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) return result;
    return result.filter(reg =>
      [reg.name, reg.email, reg.mobile, reg.degree, reg.batch, reg.stack, reg.status]
        .filter(Boolean)
        .some(value => value.toString().toLowerCase().includes(query))
    );
  }, [regs, searchQuery, typeFilter]);

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
      passedOutYear: reg.passedOutYear || '',
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
    setEditState({ status: 'New', statusReason: '', grade: '', stack: '', batch: '', passedOutYear: '' });
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

              {/* Column Visibility Selector */}
              <div className="relative">
                <button 
                  onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <SlidersHorizontal size={13} />
                  <span>Columns</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${showColumnDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showColumnDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowColumnDropdown(false)}></div>
                    <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-2 text-left">
                      <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1.5">
                        Toggle Columns
                      </div>
                      {Object.keys(visibleColumns).map((col) => (
                        <label key={col} className="flex items-center px-3 py-1.5 hover:bg-slate-50 cursor-pointer select-none text-xs font-medium text-slate-700 gap-2">
                          <input 
                            type="checkbox"
                            checked={visibleColumns[col]}
                            onChange={() => setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }))}
                            className="rounded border-slate-350 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                          />
                          <span>{col === 'name' ? 'Name' : 
                                 col === 'mobile' ? 'Mobile' : 
                                 col === 'degree' ? 'Degree' :
                                 col === 'batch' ? 'Cohort Batch' :
                                 col === 'passedOutYear' ? 'Batch Year' :
                                 col === 'willingness' ? 'Willingness' :
                                 col === 'grade' ? 'Grade' :
                                 col === 'stack' ? 'Stack' : 
                                 col === 'status' ? 'Status' : col}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button 
                type="button"
                onClick={handleExport}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download size={13} />
                <span>Export Excel</span>
              </button>

              <label 
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Upload size={13} />
                <span>Import Excel</span>
                <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <input
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search registrations by name, email, mobile, degree, or status..."
                className="crm-input h-10 rounded-xl"
              />
            </div>
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 min-w-[180px]"
            >
              <option value="all">All Registrations</option>
              <option value="regular">Regular Students (SPL)</option>
              <option value="direct">Direct SPL Only</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  {visibleColumns.name && <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Name</th>}
                  {visibleColumns.mobile && <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Mobile</th>}
                  {visibleColumns.degree && <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Degree</th>}
                  {visibleColumns.batch && <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Cohort Batch</th>}
                  {visibleColumns.passedOutYear && <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Batch Year</th>}
                  {visibleColumns.stack && <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Stack</th>}
                  {visibleColumns.willingness && <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Willingness</th>}
                  {visibleColumns.grade && <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Grade</th>}
                  {visibleColumns.status && <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>}
                  <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={1 + Object.values(visibleColumns).filter(Boolean).length} className="px-3 py-10 text-center">
                      <div className="flex items-center justify-center gap-2 text-slate-505">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                        <span className="text-xs font-semibold">Loading registrations...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={1 + Object.values(visibleColumns).filter(Boolean).length} className="px-3 py-10 text-center text-xs font-semibold text-slate-500">
                      No matching registrations found.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((reg, index) => (
                    <tr key={reg._id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    {visibleColumns.name && <td className="whitespace-nowrap px-3 py-2 text-xs font-bold text-slate-900">{reg.name}</td>}
                    {visibleColumns.mobile && <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-750 font-semibold">{reg.mobile || '—'}</td>}
                    {visibleColumns.degree && <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-750">{reg.degree || '—'}</td>}
                    {visibleColumns.batch && <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-750 font-medium">{reg.batch || '—'}</td>}
                    {visibleColumns.passedOutYear && <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-750 font-medium">{reg.passedOutYear || '—'}</td>}
                    {visibleColumns.stack && <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-750">{reg.stack || '—'}</td>}
                      {visibleColumns.willingness && (
                        <td className="whitespace-nowrap px-3 py-2 text-xs">
                          {reg.willingCompanyProcess ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">Willing</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 font-medium text-[10px]">Not Willing</span>
                          )}
                        </td>
                      )}
                      {visibleColumns.grade && <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-750 font-bold">{reg.grade || '—'}</td>}
                      {visibleColumns.status && (
                        <td className="whitespace-nowrap px-3 py-2">
                          <StatusBadge status={reg.status} />
                        </td>
                      )}
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
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Update Student Registration</h3>
                <p className="mt-2 text-sm text-slate-500 font-medium">Update student profile info, cohort batch, stack, status, and performance grades for {selectedRegistration.name}.</p>
              </div>
              <button type="button" onClick={closeEditModal} className="rounded-full bg-slate-100 p-2 text-slate-650 transition hover:bg-slate-200 hover:text-slate-900">
                <X size={18} />
              </button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  value={editState.name}
                  onChange={(e) => setEditState(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Email Address</label>
                <input
                  type="email"
                  value={editState.email}
                  onChange={(e) => setEditState(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Mobile */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Mobile Number</label>
                <input
                  type="text"
                  value={editState.mobile}
                  onChange={(e) => setEditState(prev => ({ ...prev, mobile: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Degree */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Degree</label>
                <input
                  type="text"
                  value={editState.degree}
                  onChange={(e) => setEditState(prev => ({ ...prev, degree: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Batch */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Cohort Batch</label>
                <input
                  type="text"
                  value={editState.batch}
                  onChange={(e) => setEditState(prev => ({ ...prev, batch: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Batch Year */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Batch Year</label>
                <input
                  type="text"
                  value={editState.passedOutYear}
                  onChange={(e) => setEditState(prev => ({ ...prev, passedOutYear: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Tech Stack Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Technology Stack</label>
                <select
                  value={modalStackSelect}
                  onChange={(e) => setModalStackSelect(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select Stack</option>
                  {STANDARD_STACKS.map(stack => (
                    <option key={stack} value={stack}>{stack}</option>
                  ))}
                  <option value="Other">Other (Custom)</option>
                </select>
              </div>

              {/* Custom Stack input */}
              {modalStackSelect === 'Other' && (
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Custom Stack Name</label>
                  <input
                    type="text"
                    value={modalCustomStack}
                    onChange={(e) => setModalCustomStack(e.target.value)}
                    placeholder="Enter custom stack name..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              )}

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Status</label>
                <select
                  value={editState.status}
                  onChange={(e) => setEditState(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Grade */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Performance Grade</label>
                <input
                  type="text"
                  value={editState.grade}
                  onChange={(e) => setEditState(prev => ({ ...prev, grade: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g. A+, B"
                />
              </div>

              {/* Status Reason */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Status Reason / Grader Notes</label>
                <textarea
                  value={editState.statusReason}
                  onChange={(e) => setEditState(prev => ({ ...prev, statusReason: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  rows={2}
                  placeholder="Notes regarding status, placement, or performance..."
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
