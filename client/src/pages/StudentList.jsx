import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Download, Upload, Plus, Edit, Eye, Trash2, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { AppShell, SectionTabs, StatusBadge, SurfaceCard } from '../components/AppShell';

function formatBatchYear(year) {
  const value = String(year ?? '').trim();
  return /^\d{4}$/.test(value) ? `'${value.slice(-2)}` : '';
}

function getValidBatchYear(year) {
  const value = String(year ?? '').trim();
  return /^\d{4}$/.test(value) ? value : '';
}

export default function StudentList() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [batchFilter, setBatchFilter] = useState('All');
  const [sortBy, setSortBy] = useState('batch-desc');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'All') params.append('status', statusFilter);

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/students?${params.toString()}`);
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(students.map(s => ({
      Name: s.name,
      Mobile: s.mobile,
      Degree: s.degree,
      'Batch Year': s.passedOutYear,
      Batch: s.batch || '',
      Status: s.currentStatus,
      Company: s.companyName,
      'Package (LPA)': s.packageLpa,
      'Mode': s.jobGetMode
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Candidates");
    XLSX.writeFile(wb, "Placement_Candidates.xlsx");
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/students/${id}`, { method: 'DELETE' });
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

  const handleDeleteAll = async () => {
    const loadToast = toast.loading('Deleting all student records...');
    setIsDeletingAll(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/students/all`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        toast.success(
          data.deletedCount
            ? `Deleted ${data.deletedCount} student records`
            : 'No student records were found to delete',
          { id: loadToast }
        );
        setIsDeleteAllOpen(false);
        setCurrentPage(1);
        setSelectedStudent(null);
        fetchStudents();
      } else {
        toast.error(data.message || 'Delete all failed', { id: loadToast });
      }
    } catch (err) {
      toast.error('Delete all request failed', { id: loadToast });
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const loadToast = toast.loading('Uploading records...');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/students/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Imported ${data.count} candidates`, { id: loadToast });
        fetchStudents();
      } else {
        toast.error(data.message || 'Import failed', { id: loadToast });
      }
    } catch (err) {
      toast.error('Network block during import', { id: loadToast });
    }
    e.target.value = null;
  };

  const availableBatches = [...new Set(
    students
      .map(student => getValidBatchYear(student.passedOutYear))
      .filter(Boolean)
  )].sort((a, b) => Number(b) - Number(a));

  const availableStatuses = [...new Set(
    students
      .map(student => String(student.currentStatus ?? '').trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  const processedStudents = [...students]
    .filter(student => {
      if (batchFilter === 'All') return true;
      return getValidBatchYear(student.passedOutYear) === batchFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }

      if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name, undefined, { sensitivity: 'base' });
      }

      const yearA = getValidBatchYear(a.passedOutYear);
      const yearB = getValidBatchYear(b.passedOutYear);

      if (!yearA && !yearB) {
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }

      if (!yearA) return 1;
      if (!yearB) return -1;

      return sortBy === 'batch-asc'
        ? Number(yearA) - Number(yearB)
        : Number(yearB) - Number(yearA);
    });

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(processedStudents.length / itemsPerPage));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [processedStudents.length, currentPage]);

  const totalPages = Math.ceil(processedStudents.length / itemsPerPage);
  const currentItems = processedStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const hasStudents = students.length > 0;

  return (
    <AppShell
      title="Student Directory"
      subtitle="Manage candidate records, imports, exports, and placement status updates."
      searchPlaceholder="Search students, mobile, company, or batch"
    >
           <SectionTabs
             items={[
               { label: 'Overview', onClick: () => navigate('/dashboard') },
               { label: 'Students', active: true },
               { label: 'Eligibility', onClick: () => navigate('/eligibility') },
             ]}
           />

           {/* Toolbar */}
           <div className="mb-3 flex flex-col gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 w-full">
                 <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 md:top-3 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search candidates..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4338ca] focus:border-[#4338ca] text-[12px] md:text-[13px] font-medium transition-shadow" 
                    />
                 </div>
                 <select 
                   value={statusFilter} 
                   onChange={(e) => setStatusFilter(e.target.value)}
                   className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4338ca] text-[12px] md:text-[13px] font-semibold text-[#1e293b] cursor-pointer transition-shadow"
                 >
                    <option value="All">All Pipelines</option>
                    {availableStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                 </select>
                 <select
                   value={batchFilter}
                   onChange={(e) => {
                     setBatchFilter(e.target.value);
                     setCurrentPage(1);
                   }}
                   className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4338ca] text-[12px] md:text-[13px] font-semibold text-[#1e293b] cursor-pointer transition-shadow"
                 >
                    <option value="All">All Batches</option>
                    {availableBatches.map(batch => (
                      <option key={batch} value={batch}>Batch {batch}</option>
                    ))}
                 </select>
                 <select
                   value={sortBy}
                   onChange={(e) => {
                     setSortBy(e.target.value);
                     setCurrentPage(1);
                   }}
                   className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4338ca] text-[12px] md:text-[13px] font-semibold text-[#1e293b] cursor-pointer transition-shadow"
                 >
                    <option value="batch-desc">Batch: New to Old</option>
                    <option value="batch-asc">Batch: Old to New</option>
                    <option value="name-asc">Name: A to Z</option>
                    <option value="name-desc">Name: Z to A</option>
                 </select>
              </div>

              <div className="flex flex-wrap gap-1.5">
                 <label className="crm-btn-secondary crm-btn-compact cursor-pointer">
                    <Upload size={16} />
                    <span>Import Excel</span>
                    <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                 </label>
                 <button onClick={handleExport} className="crm-btn-secondary crm-btn-compact">
                    <Download size={16} />
                    <span>Export</span>
                 </button>
                 <button
                   onClick={() => setIsDeleteAllOpen(true)}
                   disabled={!hasStudents || loading || isDeletingAll}
                   className="px-3.5 md:px-4 py-2 md:py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-full text-[12px] md:text-sm font-semibold hover:bg-red-100 hover:border-red-300 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    <Trash2 size={16} />
                    <span>Delete All</span>
                 </button>
                 <button 
                   onClick={() => { setEditMode(false); setSelectedStudent(null); setIsModalOpen(true); }}
                   className="crm-btn-primary crm-btn-compact"
                 >
                    <Plus size={16} />
                    <span>Add Entity</span>
                 </button>
              </div>
           </div>

           {/* Master Table */}
           <SurfaceCard className="overflow-hidden">
             <div className="px-4 md:px-5 py-3 border-b border-slate-100 bg-white flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <h3 className="text-sm md:text-base font-bold text-[#1e293b]">All Candidates</h3>
                <p className="text-[11px] md:text-xs font-medium text-slate-500">
                  Showing <span className="font-bold text-slate-700">{processedStudents.length}</span> candidate{processedStudents.length === 1 ? '' : 's'}
                  {batchFilter !== 'All' ? ` in Batch ${batchFilter}` : ''}
                </p>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full min-w-[720px] text-left">
                 <thead className="bg-[#f8fafc] border-b border-slate-100">
                   <tr>
                     <th className="px-3 py-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50/50">Name</th>
                     <th className="px-3 py-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50/50">Mobile</th>
                     <th className="px-3 py-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50/50">Degree</th>
                     <th className="px-3 py-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50/50">Batch Year</th>
                     <th className="px-3 py-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50/50">Batch</th>
                     <th className="px-3 py-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50/50">Status</th>
                     <th className="px-3 py-2 text-right text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50/50">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="bg-white">
                   {loading ? (
                     <tr>
                       <td colSpan="7" className="px-4 py-8 md:py-10 text-center">
                          <div className="animate-spin h-8 w-8 border-4 border-[#4338ca] border-t-transparent flex items-center justify-center rounded-full mx-auto mb-4"></div>
                       </td>
                     </tr>
                   ) : currentItems.length > 0 ? currentItems.map(student => (
                     <tr key={student._id} className="border-b border-slate-50 hover:bg-[#f8fafc] transition-colors group">
                       <td className="px-3 py-2.5">
                          <div className="text-[12px] md:text-[13px] font-bold text-[#1e293b] whitespace-nowrap">{student.name}</div>
                       </td>
                       <td className="px-3 py-2.5">
                          <div className="text-[11px] md:text-[12px] font-medium text-slate-600 whitespace-nowrap">{student.mobile}</div>
                       </td>
                       <td className="px-3 py-2.5">
                          <div className="text-[11px] md:text-[12px] font-medium text-slate-600 whitespace-nowrap">{student.degree}</div>
                       </td>
                       <td className="px-3 py-2.5">
                          <div className="text-[11px] md:text-[12px] font-medium text-slate-600 whitespace-nowrap">
                            {getValidBatchYear(student.passedOutYear) || 'Not Added'}
                          </div>
                       </td>
                       <td className="px-3 py-2.5">
                          <div className="text-[11px] md:text-[12px] font-medium text-slate-600 whitespace-nowrap">{student.batch || '-'}</div>
                       </td>
                       <td className="px-3 py-2.5">
                          <StatusBadge status={student.currentStatus} />
                       </td>
                       <td className="px-3 py-2.5 text-right">
                          <div className="flex justify-end space-x-2">
                            <button 
                              onClick={() => { setSelectedStudent(student); setIsViewOpen(true); }} 
                              className="p-1.5 rounded-lg bg-indigo-50 text-[#4338ca] hover:bg-[#4338ca] hover:text-white transition-all shadow-sm"
                              title="View Details"
                            >
                               <Eye size={14} />
                            </button>
                            <button 
                              onClick={() => { setSelectedStudent(student); setEditMode(true); setIsModalOpen(true); }} 
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                              title="Edit Candidate"
                            >
                               <Edit size={14} />
                            </button>
                            <button 
                              onClick={() => { setSelectedStudent(student); setIsDeleteOpen(true); }} 
                              className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                              title="Delete Candidate"
                            >
                               <Trash2 size={14} />
                            </button>
                          </div>
                       </td>
                     </tr>
                   )) : (
                     <tr>
                       <td colSpan="7" className="px-4 py-8 md:py-10 text-center text-slate-400 font-medium text-[12px]">
                          No records matched search parameters
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
             
             <div className="px-4 md:px-6 py-3 border-t border-slate-100 flex flex-col gap-2 sm:flex-row justify-between sm:items-center bg-[#f8fafc]/50">
                <span className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                   Page <span className="text-slate-600 px-1">{currentPage}</span> of <span className="text-slate-600 pl-1">{totalPages || 1}</span>
                </span>
                <div className="flex space-x-2">
                   <button 
                     onClick={() => setCurrentPage(p => Math.max(1, p-1))}
                     disabled={currentPage === 1}
                     className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                   ><ChevronLeft size={14} /></button>
                   <button 
                     onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
                     disabled={currentPage === totalPages || totalPages === 0}
                     className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                   ><ChevronRight size={14} /></button>
                </div>
             </div>
           </SurfaceCard>

      {/* Modals Linker */}
      {isModalOpen && (
        <StudentFormModal 
          onClose={() => setIsModalOpen(false)} 
          onRefresh={fetchStudents} 
          student={selectedStudent} 
          editMode={editMode}
        />
      )}
      
      {isViewOpen && (
        <StudentDetailModal 
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

      {isDeleteAllOpen && (
        <ConfirmDeleteAllModal
          onClose={() => {
            if (!isDeletingAll) setIsDeleteAllOpen(false);
          }}
          onConfirm={handleDeleteAll}
          count={students.length}
          isDeletingAll={isDeletingAll}
        />
      )}
    </AppShell>
  );
}

function StudentFormModal({ onClose, onRefresh, student, editMode }) {
  const [formData, setFormData] = useState({
    name: student?.name || '',
    mobile: student?.mobile || '',
    degree: student?.degree || '',
    passedOutYear: student?.passedOutYear || '',
    batch: student?.batch || '',
    currentStatus: student?.currentStatus || 'Job seeker',
    companyName: student?.companyName || '',
    packageLpa: student?.packageLpa || '',
    jobGetMode: student?.jobGetMode || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editMode 
        ? `${import.meta.env.VITE_API_BASE_URL}/students/${student._id}` 
        : `${import.meta.env.VITE_API_BASE_URL}/students`;
      
      const res = await fetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
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
       <div className="bg-white rounded-[20px] md:rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden">
          <div className="px-5 md:px-8 py-4 md:py-5 border-b border-slate-100 flex justify-between items-center bg-white">
             <h3 className="text-[#1e293b] font-extrabold text-lg md:text-xl">{editMode ? 'Modify Entity' : 'New Candidate Entity'}</h3>
             <button onClick={onClose} className="p-1.5 md:p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-all"><X size={16} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 md:p-7 overflow-y-auto max-h-[78vh]">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 md:gap-y-6 gap-x-4 md:gap-x-5">
                <div>
                   <label className="crm-label">Identifier (Name)</label>
                   <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="crm-input" />
                </div>
                <div>
                   <label className="crm-label">Communications Node</label>
                   <input required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="crm-input" />
                </div>
                <div>
                   <label className="crm-label">Academic Origin (Degree)</label>
                   <select required value={formData.degree} onChange={e => setFormData({...formData, degree: e.target.value})} className="crm-input">
                      <option value="">Select Origin</option>
                      {editMode && student?.degree && !['B.Tech', 'M.Tech', 'BCA', 'MCA', 'B.Sc', 'M.Sc', 'B.Com', 'M.Com', 'BBA', 'MBA', 'Other'].includes(student.degree) && (
                         <option value={student.degree}>{student.degree}</option>
                      )}
                      <option value="B.Tech">B.Tech</option>
                      <option value="M.Tech">M.Tech</option>
                      <option value="BCA">BCA</option>
                      <option value="MCA">MCA</option>
                      <option value="B.Sc">B.Sc</option>
                      <option value="M.Sc">M.Sc</option>
                      <option value="B.Com">B.Com</option>
                      <option value="M.Com">M.Com</option>
                      <option value="BBA">BBA</option>
                      <option value="MBA">MBA</option>
                      <option value="Other">Other</option>
                   </select>
                </div>
                <div>
                   <label className="crm-label">Batch Temporal Identifier</label>
                   <input value={formData.passedOutYear} onChange={e => setFormData({...formData, passedOutYear: e.target.value})} className="crm-input" />
                </div>
                <div>
                   <label className="crm-label">Batch</label>
                   <input value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})} className="crm-input" placeholder="2024-A / Morning / Section A" />
                </div>
                
                <div className="md:col-span-2 pt-5 md:pt-6 border-t border-slate-100">
                   <h4 className="text-[13px] md:text-[14px] font-extrabold text-[#1e293b] mb-3 md:mb-4">Pipeline Metrics</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                      <div>
                         <label className="crm-label">Active State</label>
                         <select required value={formData.currentStatus} onChange={e => setFormData({...formData, currentStatus: e.target.value})} className="crm-input bg-slate-50">
                            <option value="Job seeker">Active Job Seeker</option>
                            <option value="Placed">Placed successfully</option>
                            <option value="Need to filled">Needs Updates</option>
                            <option value="Interview process">Interviewing</option>
                            <option value="Inactive">Suspended/Inactive</option>
                         </select>
                      </div>

                      {formData.currentStatus.toLowerCase() === 'placed' && (
                        <div>
                           <label className="crm-label">Deployment Vector</label>
                           <select value={formData.jobGetMode} onChange={e => setFormData({...formData, jobGetMode: e.target.value})} className="crm-input bg-indigo-50 border-indigo-200 text-[#4338ca]">
                              <option value="">Select Vector</option>
                              <option value="Self Placed">Self Placed</option>
                              <option value="SLA">SLA Origin</option>
                              <option value="On Campus">On Campus Drive</option>
                           </select>
                        </div>
                      )}
                      
                      {formData.currentStatus.toLowerCase() === 'placed' && (
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                           <div>
                              <label className="crm-label">Acquiring Architecture (Company)</label>
                              <input value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="crm-input bg-[#dcfce7] border-[#bbf7d0]" />
                           </div>
                           <div>
                              <label className="crm-label">Value Remuneration (LPA)</label>
                              <input value={formData.packageLpa} onChange={e => setFormData({...formData, packageLpa: e.target.value})} className="crm-input bg-[#dcfce7] border-[#bbf7d0]" />
                           </div>
                        </div>
                      )}
                   </div>
                </div>
             </div>

             <div className="mt-6 md:mt-8 flex flex-col-reverse sm:flex-row justify-end gap-2.5 md:gap-3">
                <button type="button" onClick={onClose} className="crm-btn-secondary crm-btn-compact px-6 md:px-7">Discard</button>
                <button type="submit" className="crm-btn-primary crm-btn-compact px-6 md:px-7">{editMode ? 'Commit Edit' : 'Append State'}</button>
             </div>
          </form>
       </div>
    </div>
  );
}

function StudentDetailModal({ onClose, student }) {
   if (!student) return null;
   const batchYear = getValidBatchYear(student.passedOutYear);
   return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
       <div className="bg-white rounded-[20px] md:rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden">
          <div className="p-5 md:p-7 pb-4 md:pb-5 bg-[#f8fafc] border-b border-slate-100 flex justify-between items-start">
             <div className="flex items-center">
                 <div className="h-11 w-11 md:h-14 md:w-14 rounded-[14px] md:rounded-[16px] bg-white border border-slate-200 flex items-center justify-center text-[#4338ca] text-lg md:text-2xl font-black shadow-sm">
                     {student.name.charAt(0).toUpperCase()}
                 </div>
                 <div className="ml-3 md:ml-4">
                    <h3 className="text-xl md:text-2xl font-extrabold text-[#1e293b] leading-tight">{student.name}</h3>
                    <p className="text-[12px] md:text-[14px] font-semibold text-slate-500 mt-1">
                      {student.degree}
                      {batchYear ? ` • Batch Year ${batchYear}` : ''}
                      {student.batch ? ` • ${student.batch}` : ''}
                    </p>
                 </div>
             </div>
             <button onClick={onClose} className="p-1.5 md:p-2 rounded-full bg-white text-slate-400 hover:text-slate-800 shadow-sm border border-slate-200 transition-colors"><X size={15} /></button>
          </div>

          <div className="p-5 md:p-7">
             <div className="flex items-center justify-between mb-5 md:mb-6 p-4 md:p-5 bg-white border border-slate-100 rounded-[14px] md:rounded-[16px] shadow-sm">
                 <span className="text-[11px] md:text-[13px] font-bold text-slate-400 uppercase tracking-widest">State Vector</span>
                 <StatusBadge status={student.currentStatus} />
             </div>

             <div className="space-y-3">
                <DetailRow label="Phone Contact" val={student.mobile} />
                <DetailRow label="Batch Year" val={batchYear || 'Not Added'} />
                <DetailRow label="Batch" val={student.batch || 'Not Added'} />
                
                {student.currentStatus.toLowerCase() === 'placed' && (
                  <div className="pt-5 mt-5 border-t border-slate-100 space-y-3">
                     <p className="text-[11px] md:text-[13px] font-extrabold text-emerald-600 uppercase tracking-widest mb-3">Placement Telemetry</p>
                     
                     <DetailRow label="Corporate Entity" val={student.companyName || 'Classified'} />
                     <DetailRow label="Value Compensation" val={student.packageLpa ? `${student.packageLpa} LPA` : 'Undisclosed'} />
                     {student.jobGetMode && <DetailRow label="Acquisition Vector" val={student.jobGetMode} />}
                  </div>
                )}
             </div>
          </div>
          
       </div>
    </div>
   );
}

function DetailRow({ label, val }) {
   return (
      <div className="flex justify-between items-center gap-3 py-1">
         <span className="text-[12px] md:text-[14px] font-bold text-slate-400">{label}</span>
         <span className="text-[13px] md:text-[15px] font-extrabold text-[#1e293b] text-right">{val}</span>
      </div>
   );
}

function ConfirmDeleteModal({ onClose, onConfirm, studentName }) {
   return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
       <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm text-center p-8">
          <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
             <Trash2 size={28} className="text-red-500" />
          </div>
          <h3 className="text-xl font-extrabold text-[#1e293b] mb-3">Irreversible Purge</h3>
          <p className="text-[15px] font-medium text-slate-500 mb-8 leading-relaxed">System is requesting authorization to permanently delete <strong className="text-[#1e293b]">{studentName}</strong> from active memory blocks.</p>
          <div className="flex flex-col space-y-3">
             <button onClick={onConfirm} className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[15px] font-bold shadow-sm shadow-red-200 transition-colors mt-2">Confirm Data Purge</button>
             <button onClick={onClose} className="w-full py-3.5 bg-white text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors">Abort Procedure</button>
          </div>
       </div>
    </div>
   );
}

function ConfirmDeleteAllModal({ onClose, onConfirm, count, isDeletingAll }) {
   return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
       <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md text-center p-8">
          <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
             <Trash2 size={28} className="text-red-500" />
          </div>
          <h3 className="text-xl font-extrabold text-[#1e293b] mb-3">Delete All Candidate Data</h3>
          <p className="text-[15px] font-medium text-slate-500 mb-8 leading-relaxed">
            This will permanently remove <strong className="text-[#1e293b]">{count}</strong> student record{count === 1 ? '' : 's'} from MongoDB. This action cannot be undone.
          </p>
          <div className="flex flex-col space-y-3">
             <button
               onClick={onConfirm}
               disabled={isDeletingAll}
               className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[15px] font-bold shadow-sm shadow-red-200 transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
             >
               {isDeletingAll ? 'Deleting Records...' : 'Confirm Delete All'}
             </button>
             <button
               onClick={onClose}
               disabled={isDeletingAll}
               className="w-full py-3.5 bg-white text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
             >
               Cancel
             </button>
          </div>
       </div>
    </div>
   );
}
