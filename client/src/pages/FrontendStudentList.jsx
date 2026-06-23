import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Download, Upload, Plus, Edit, Eye, Trash2, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { AppShell, SectionTabs, StatusBadge, SurfaceCard } from '../components/AppShell';
import { authHeaders, logout } from '../utils/auth';
import { buildApiUrl } from '../utils/api';

export default function FrontendStudentList() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [isDeleteSelectedOpen, setIsDeleteSelectedOpen] = useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('isFrontend', 'true');
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'All') params.append('status', statusFilter);

      const res = await fetch(`${buildApiUrl('/students')}?${params.toString()}`, {
        headers: { ...authHeaders() },
      });
      if (res.status === 401) {
        logout();
        return;
      }
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      toast.error('Failed to load frontend students');
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
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleToggleSelect = (id) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllPage = () => {
    const currentPageIds = currentItems.map(item => item._id);
    const allSelected = currentPageIds.every(id => selectedStudentIds.includes(id));

    if (allSelected) {
      setSelectedStudentIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      setSelectedStudentIds(prev => {
        const toAdd = currentPageIds.filter(id => !prev.includes(id));
        return [...prev, ...toAdd];
      });
    }
  };

  const handleClearSelection = () => {
    setSelectedStudentIds([]);
  };

  const handleDeleteSelected = async () => {
    setIsDeletingSelected(true);
    const loadToast = toast.loading('Deleting selected candidates...');
    try {
      const res = await fetch(buildApiUrl('/students/bulk-delete'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ ids: selectedStudentIds })
      });
      if (res.status === 401) {
        logout();
        return;
      }
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Successfully deleted selected candidates', { id: loadToast });
        setSelectedStudentIds([]);
        setIsDeleteSelectedOpen(false);
        fetchStudents();
      } else {
        toast.error(data.message || 'Bulk deletion failed', { id: loadToast });
      }
    } catch (err) {
      toast.error('Deletion error', { id: loadToast });
    } finally {
      setIsDeletingSelected(false);
    }
  };

  const handleExport = () => {
    const targetStudents = selectedStudentIds.length > 0
      ? students.filter(s => selectedStudentIds.includes(s._id))
      : students;

    const ws = XLSX.utils.json_to_sheet(targetStudents.map(s => ({
      Name: s.name,
      Mobile: s.mobile,
      Email: s.email || '',
      Batch: s.batch || '',
      'Batch Year': s.passedOutYear || '',
      City: s.city || ''
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Frontend Students");
    const fileName = selectedStudentIds.length > 0 ? "Selected_Frontend_Students.xlsx" : "Frontend_Students.xlsx";
    XLSX.writeFile(wb, fileName);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(buildApiUrl(`/students/${id}`), { method: 'DELETE', headers: { ...authHeaders() } });
      if (res.status === 401) {
        logout();
        return;
      }
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Successfully deleted');
        setSelectedStudent(null);
        setIsDeleteOpen(false);
        fetchStudents();
      } else {
        toast.error(data.message || 'Deletion failed');
      }
    } catch (err) {
      toast.error('Deletion error');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const loadToast = toast.loading('Uploading frontend records...');
    try {
      const res = await fetch(`${buildApiUrl('/students/upload')}?isFrontend=true`, {
        method: 'POST',
        headers: { ...authHeaders() },
        body: formData,
      });
      if (res.status === 401) {
        logout();
        return;
      }
      const data = await res.json();
      if (res.ok) {
        toast.success(`Imported ${data.count} frontend students`, { id: loadToast });
        fetchStudents();
      } else {
        toast.error(data.message || 'Import failed', { id: loadToast });
      }
    } catch (err) {
      toast.error('Network block during import', { id: loadToast });
    }
    e.target.value = null;
  };

  const availableStatuses = ['Job Seeker', 'Placed', 'Need to filled', 'Inactive'];

  const processedStudents = students;
  const totalPages = Math.ceil(processedStudents.length / itemsPerPage);
  const currentItems = processedStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <AppShell
      title="Frontend Student Directory"
      subtitle="Manage Frontend track records, excel bulk uploads, and location-based details."
      searchPlaceholder="Search by name, email, mobile, batch, year, city..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
    >
      <SectionTabs
        items={[
          { label: 'Overview', onClick: () => navigate('/dashboard') },
          { label: 'Students', onClick: () => navigate('/students') },
          { label: 'Frontend Students', active: true },
          { label: 'Eligibility', onClick: () => navigate('/eligibility') },
        ]}
      />

      {/* Filter & Actions Toolbar */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-[20px] border border-slate-200/85 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2 flex-1 max-w-2xl">
          {/* Visible In-Page Search Option */}
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, mobile, batch, year, city..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Status pipeline selector */}
          <div className="w-full sm:w-[200px]">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all cursor-pointer"
            >
              <option value="All">All Pipelines</option>
              {availableStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button 
            onClick={handleExport}
            className="px-3 py-2.5 text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all rounded-xl flex items-center gap-1 bg-white cursor-pointer shadow-sm"
          >
            <Download size={14} /> Export {selectedStudentIds.length > 0 ? `(${selectedStudentIds.length})` : ''}
          </button>
          
          <label className="px-3 py-2.5 text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all rounded-xl flex items-center gap-1 bg-white cursor-pointer shadow-sm">
            <Upload size={14} /> Import
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
          </label>
          
          <button 
            onClick={() => { setEditMode(false); setSelectedStudent(null); setIsModalOpen(true); }}
            className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all rounded-xl flex items-center gap-1"
          >
            <Plus size={14} /> Add Student
          </button>
        </div>
      </div>

      {selectedStudentIds.length > 0 && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-1">
          <div className="text-xs font-semibold text-blue-700">
            Selected {selectedStudentIds.length} candidate{selectedStudentIds.length > 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsDeleteSelectedOpen(true)}
              className="px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-100/50 rounded-lg transition-colors"
            >
              Delete Selected
            </button>
            <button 
              onClick={handleClearSelection}
              className="p-1 hover:bg-blue-100 rounded-lg text-blue-500 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Roster list view */}
      <SurfaceCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-12 px-4 py-3 text-center">
                  <input 
                    type="checkbox" 
                    checked={currentItems.length > 0 && currentItems.every(item => selectedStudentIds.includes(item._id))}
                    onChange={handleToggleSelectAllPage}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
                  />
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Candidate Info</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Contact</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Batch details</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Team</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Location</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      <span className="text-sm font-semibold">Retrieving Frontend candidates...</span>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center text-sm font-semibold text-slate-500">
                    No frontend student records found matching the active filters.
                  </td>
                </tr>
              ) : (
                currentItems.map(student => (
                  <tr key={student._id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="checkbox"
                        checked={selectedStudentIds.includes(student._id)}
                        onChange={() => handleToggleSelect(student._id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{student.name}</p>
                        <p className="text-xs text-slate-500 truncate">{student.email || 'No email registered'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-slate-600">
                      {student.mobile}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">
                      <div>
                        <p className="font-semibold text-slate-800">{student.batch || 'No batch'}</p>
                        <p className="text-xs text-slate-400">Class of {student.passedOutYear || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <span className="font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full text-xs">
                        {teams.find(t => t.members.some(m => m._id === student._id || m === student._id))?.name || '-'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-slate-600">
                      {student.city || '-'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex gap-1.5">
                        <button 
                          onClick={() => { setSelectedStudent(student); setIsViewOpen(true); }}
                          className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button 
                          onClick={() => { setSelectedStudent(student); setEditMode(true); setIsModalOpen(true); }}
                          className="p-1.5 text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Modify Record"
                        >
                          <Edit size={15} />
                        </button>
                        <button 
                          onClick={() => { setSelectedStudent(student); setIsDeleteOpen(true); }}
                          className="p-1.5 text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-500">
            Showing {currentItems.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, processedStudents.length)} of {processedStudents.length} entries
          </div>
          <div className="flex gap-1">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p-1))}
              disabled={currentPage === 1 || totalPages === 0}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </SurfaceCard>

      {/* Modals */}
      {isModalOpen && (
        <FrontendStudentFormModal 
          onClose={() => setIsModalOpen(false)} 
          onRefresh={fetchStudents} 
          student={selectedStudent} 
          editMode={editMode}
        />
      )}
      
      {isViewOpen && selectedStudent && (
        <FrontendStudentDetailModal 
          onClose={() => setIsViewOpen(false)} 
          student={selectedStudent} 
        />
      )}

      {isDeleteOpen && selectedStudent && (
        <ConfirmDeleteModal 
          onClose={() => setIsDeleteOpen(false)} 
          onConfirm={() => handleDelete(selectedStudent._id)}
          studentName={selectedStudent.name}
        />
      )}

      {isDeleteSelectedOpen && (
        <ConfirmDeleteSelectedModal
          onClose={() => setIsDeleteSelectedOpen(false)}
          onConfirm={handleDeleteSelected}
          count={selectedStudentIds.length}
          isDeleting={isDeletingSelected}
        />
      )}
    </AppShell>
  );
}

function FrontendStudentFormModal({ onClose, onRefresh, student, editMode }) {
  const [formData, setFormData] = useState({
    name: student?.name || '',
    email: student?.email || '',
    mobile: student?.mobile || '',
    batch: student?.batch || '',
    passedOutYear: student?.passedOutYear || '',
    city: student?.city || '',
    currentStatus: student?.currentStatus || 'Job Seeker',
    studentType: 'Frontend',
    isFrontend: true
  });

  const statusOptions = [
    { value: 'Job Seeker', label: 'Active Job Seeker' },
    { value: 'Placed', label: 'Placed successfully' },
    { value: 'Need to filled', label: 'Needs Updates' },
    { value: 'Inactive', label: 'Suspended/Inactive' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editMode 
        ? buildApiUrl(`/students/${student._id}`)
        : buildApiUrl('/students');
      
      const res = await fetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editMode ? 'Record modified' : 'Record initialized');
        onRefresh();
        onClose();
      } else {
        toast.error('Transaction rejected');
      }
    } catch (err) {
      toast.error('Network disconnect');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <h3 className="text-[#1e293b] font-extrabold text-lg md:text-xl">
            {editMode ? 'Modify Frontend Student' : 'Add Frontend Student'}
          </h3>
          <button onClick={onClose} className="p-1.5 bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-all">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh] space-y-4">
          <div>
            <label className="crm-label">Full Name</label>
            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="crm-input" placeholder="e.g. John Doe" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="crm-label">Mobile Number</label>
              <input required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="crm-input" placeholder="e.g. 9876543210" />
            </div>
            <div>
              <label className="crm-label">Email Address</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="crm-input" placeholder="e.g. john@domain.com" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="crm-label">Batch</label>
              <input value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})} className="crm-input" placeholder="e.g. Morning Batch" />
            </div>
            <div>
              <label className="crm-label">Batch Year</label>
              <input value={formData.passedOutYear} onChange={e => setFormData({...formData, passedOutYear: e.target.value})} className="crm-input" placeholder="e.g. 2024" />
            </div>
          </div>

          <div>
            <label className="crm-label">City</label>
            <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="crm-input" placeholder="e.g. Bangalore" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-colors">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FrontendStudentDetailModal({ onClose, student }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <h3 className="text-[#1e293b] font-extrabold text-lg">Candidate Profile Details</h3>
          <button onClick={onClose} className="p-1.5 bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-blue-100 text-blue-600 font-bold rounded-2xl flex items-center justify-center text-lg">
              {student.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800">{student.name}</h4>
              <p className="text-xs text-slate-400">Track: Frontend Student</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 font-medium">Email</span>
              <span className="text-slate-800 font-semibold">{student.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 font-medium">Mobile</span>
              <span className="text-slate-800 font-semibold">{student.mobile}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 font-medium">Batch</span>
              <span className="text-slate-800 font-semibold">{student.batch || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 font-medium">Passed Out Year</span>
              <span className="text-slate-800 font-semibold">{student.passedOutYear || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 font-medium">City</span>
              <span className="text-slate-800 font-semibold">{student.city || 'N/A'}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button onClick={onClose} className="px-5 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-all font-semibold">
              Dismiss Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ onClose, onConfirm, studentName }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-[24px] shadow-2xl p-6 w-full max-w-sm text-center">
        <div className="mx-auto h-12 w-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <Trash2 size={24} />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Delete student profile?</h3>
        <p className="text-sm text-slate-500 mb-6">
          Are you sure you want to delete <span className="font-semibold text-slate-800">{studentName}</span>'s profile? This action cannot be undone.
        </p>
        <div className="flex justify-center gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md transition-colors">
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteSelectedModal({ onClose, onConfirm, count, isDeleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-[24px] shadow-2xl p-6 w-full max-w-sm text-center">
        <div className="mx-auto h-12 w-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <Trash2 size={24} />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Delete selected records?</h3>
        <p className="text-sm text-slate-500 mb-6">
          Are you sure you want to delete <span className="font-semibold text-slate-800">{count}</span> selected frontend student records? This action cannot be undone.
        </p>
        <div className="flex justify-center gap-3">
          <button onClick={onClose} disabled={isDeleting} className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isDeleting} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md transition-colors flex items-center gap-2">
            {isDeleting ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
