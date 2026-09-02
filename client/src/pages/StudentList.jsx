import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Download, Upload, Plus, Edit, Eye, Trash2, X, ChevronLeft, ChevronRight, ClipboardList,
  Mail, Phone, GraduationCap, Calendar, Users, Award, SlidersHorizontal, ChevronDown,
  Briefcase, TrendingUp, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { AppShell, SectionTabs, StatusBadge, SurfaceCard, MetricCard } from '../components/AppShell';
import { authHeaders, logout } from '../utils/auth';
import { buildApiUrl } from '../utils/api';

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
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const searchTimerRef = useRef(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [enrollmentFilter, setEnrollmentFilter] = useState('All');
  const [batchFilter, setBatchFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [sortBy, setSortBy] = useState('batch-asc');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [isDeleteSelectedOpen, setIsDeleteSelectedOpen] = useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    candidateInfo: true,
    classification: true,
    batch: true,
    team: false,
    placementInfo: false,
    skills: false,
    grade: true,
    status: true,
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (enrollmentFilter !== 'All') params.append('enrollment', enrollmentFilter);

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
      toast.error('Failed to load students');
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
  }, [statusFilter, enrollmentFilter]);

  const handleSearchSubmit = () => {
    setCurrentPage(1);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    fetchStudents();
  };

  useEffect(() => {
    setCurrentPage(1);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      fetchStudents();
    }, 500);
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
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
      Degree: s.degree,
      'Batch Year': s.passedOutYear,
      Batch: s.batch || '',
      Grade: s.grade || '',
      Status: s.currentStatus,
      'Status Reason': s.statusReason || '',
      Others: s.others || '',
      Company: s.companyName,
      'Package (LPA)': s.packageLpa,
      Mode: s.jobGetMode
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Candidates");
    const fileName = selectedStudentIds.length > 0 ? "Selected_Placement_Candidates.xlsx" : "Placement_Candidates.xlsx";
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

  const handleDeleteAll = async () => {
    const loadToast = toast.loading('Deleting all student records...');
    setIsDeletingAll(true);

    try {
      const res = await fetch(buildApiUrl('/students/all'), { method: 'DELETE', headers: { ...authHeaders() } });
      if (res.status === 401) {
        logout();
        return;
      }
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
      const res = await fetch(buildApiUrl('/students/upload'), {
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
      .map(student => String(student.batch || '').trim())
      .filter(Boolean)
  )]
    .filter(batch => !/frontend/i.test(batch))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const availableStatuses = [...new Set(
    students
      .map(student => String(student.currentStatus ?? '').trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  const availableYears = [...new Set(
    students
      .map(student => String(student.passedOutYear || '').trim())
      .filter(Boolean)
  )].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

  const processedStudents = useMemo(() => {
    return [...students]
      .filter(student => {
        if (batchFilter === 'All') return true;
        return String(student.batch || '').trim() === batchFilter;
      })
      .filter(student => {
        if (yearFilter === 'All') return true;
        return String(student.passedOutYear || '').trim() === yearFilter;
      })
      .filter(student => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase().trim();
        return (
          student.name?.toLowerCase().includes(term) ||
          student.mobile?.toLowerCase().includes(term) ||
          student.email?.toLowerCase().includes(term) ||
          student.batch?.toLowerCase().includes(term) ||
          student.passedOutYear?.toString().includes(term) ||
          student.city?.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') {
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        }

        if (sortBy === 'name-desc') {
          return b.name.localeCompare(a.name, undefined, { sensitivity: 'base' });
        }

        if (sortBy === 'batch-asc' || sortBy === 'batch-desc') {
          const bA = String(a.batch || '').trim();
          const bB = String(b.batch || '').trim();
          if (!bA && !bB) return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
          if (!bA) return 1;
          if (!bB) return -1;
          const cmp = bA.localeCompare(bB, undefined, { numeric: true, sensitivity: 'base' });
          return sortBy === 'batch-asc' ? cmp : -cmp;
        }
        return 0;
      });
  }, [students, batchFilter, yearFilter, searchTerm, sortBy]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(processedStudents.length / itemsPerPage));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [processedStudents.length, currentPage]);

  const totalPages = Math.ceil(processedStudents.length / itemsPerPage);
  const currentItems = processedStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const hasStudents = students.length > 0;

  const regularStats = useMemo(() => {
    const total = students.length;
    const placed = students.filter(s => String(s.currentStatus || '').toLowerCase() === 'placed').length;
    const jobSeekers = students.filter(s => String(s.currentStatus || '').toLowerCase() === 'job seeker').length;
    const inactiveOrSuspend = students.filter(s => {
      const st = String(s.currentStatus || '').toLowerCase();
      return st.includes('inactive') || st.includes('suspend');
    }).length;
    const needToFilled = students.filter(s => {
      const st = String(s.currentStatus || '').toLowerCase();
      return st === 'need to filled' || st === 'new' || !st;
    }).length;
    const placementRate = total > 0 ? ((placed / total) * 100).toFixed(1) : '0.0';
    return { total, placed, jobSeekers, inactiveOrSuspend, needToFilled, placementRate };
  }, [students]);

  return (
    <AppShell
      title="Regular Students"
      subtitle="Manage Regular Track candidate records, imports, exports, and status updates."
      searchPlaceholder="Search students, mobile number, company, or institute batch"
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      onSearchSubmit={handleSearchSubmit}
    >
            <SectionTabs
              items={[
                { label: 'Overview', onClick: () => navigate('/dashboard') },
                { label: 'Regular Students', active: true },
                { label: 'Eligibility', onClick: () => navigate('/eligibility') },
              ]}
            />

            {/* Dashboard Summary for Regular Track */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
              <MetricCard
                title="Total Regular Candidates"
                value={regularStats.total}
                helper="Enrolled in regular directory"
                icon={<Users size={18} />}
                tone="neutral"
              />
              <MetricCard
                title="Active Job Seekers"
                value={regularStats.jobSeekers}
                helper="Ready for interview drives"
                icon={<Briefcase size={18} />}
                tone="primary"
              />
              <MetricCard
                title="Inactive / Suspended"
                value={regularStats.inactiveOrSuspend}
                helper="Inactive or suspended"
                icon={<AlertCircle size={18} />}
                tone="warning"
              />
              <MetricCard
                title="Placed Candidates"
                value={regularStats.placed}
                helper="Offers accepted & placed"
                icon={<Award size={18} />}
                tone="success"
              />
              <MetricCard
                title="Placement Success Rate"
                value={`${regularStats.placementRate}%`}
                helper={`${regularStats.placed} of ${regularStats.total} candidates`}
                icon={<TrendingUp size={18} />}
                tone="success"
              />
            </div>

           {/* Toolbar */}
           <div className="mb-3 flex flex-col gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 w-full">
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
                   value={enrollmentFilter}
                   onChange={(e) => {
                     setEnrollmentFilter(e.target.value);
                     setCurrentPage(1);
                   }}
                   className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4338ca] text-[12px] md:text-[13px] font-semibold text-[#1e293b] cursor-pointer transition-shadow"
                 >
                    <option value="All">All Students</option>
                    <option value="Regular">Regular Students</option>
                    <option value="SPL">SPL Students</option>
                    <option value="Regular+SPL">Regular + SPL Students</option>
                 </select>
                 <select
                   value={batchFilter}
                   onChange={(e) => {
                     setBatchFilter(e.target.value);
                     setCurrentPage(1);
                   }}
                   className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4338ca] text-[12px] md:text-[13px] font-semibold text-[#1e293b] cursor-pointer transition-shadow"
                 >
                    <option value="All">All Institute Batches</option>
                    {availableBatches.map(batch => (
                      <option key={batch} value={batch}>{batch}</option>
                    ))}
                 </select>
                 <select
                   value={yearFilter}
                   onChange={(e) => {
                     setYearFilter(e.target.value);
                     setCurrentPage(1);
                   }}
                   className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4338ca] text-[12px] md:text-[13px] font-semibold text-[#1e293b] cursor-pointer transition-shadow"
                 >
                    <option value="All">All Graduation Years</option>
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
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
                    <option value="batch-asc">Institute Batch: Old to New</option>
                    <option value="batch-desc">Institute Batch: New to Old</option>
                    <option value="name-asc">Name: A to Z</option>
                    <option value="name-desc">Name: Z to A</option>
                 </select>
              </div>

              <div className="sm:hidden w-full mb-2">
                 <div className="relative w-full">
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search candidates, mobile, company..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearchSubmit();
                        }
                      }}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#4338ca] focus:ring-2 focus:ring-[#4338ca]/10"
                    />
                 </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                 <label className="crm-btn-secondary crm-btn-compact cursor-pointer">
                    <Upload size={16} />
                    <span>Import Excel</span>
                    <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                 </label>
                 <button onClick={handleExport} className="crm-btn-secondary crm-btn-compact">
                    <Download size={16} />
                    <span>{selectedStudentIds.length > 0 ? `Export Selected (${selectedStudentIds.length})` : 'Export All'}</span>
                 </button>
                 <button
                   onClick={() => setIsDeleteAllOpen(true)}
                   disabled={!hasStudents || loading || isDeletingAll}
                   className="px-3.5 md:px-4 py-2 md:py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-full text-[12px] md:text-sm font-semibold hover:bg-red-100 hover:border-red-300 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    <Trash2 size={16} />
                    <span>Delete All</span>
                 </button>
                 {selectedStudentIds.length > 0 && (
                    <>
                       <button
                         onClick={() => navigate('/tasks', { state: { selectedStudentIds } })}
                         className="px-3.5 md:px-4 py-2 md:py-2.5 bg-blue-50 border border-blue-200 text-blue-600 rounded-full text-[12px] md:text-sm font-semibold hover:bg-blue-100 hover:border-blue-300 transition-colors flex items-center justify-center space-x-2"
                       >
                          <ClipboardList size={16} />
                          <span>Assign Task ({selectedStudentIds.length})</span>
                       </button>
                       <button
                         onClick={() => setIsDeleteSelectedOpen(true)}
                         className="px-3.5 md:px-4 py-2 md:py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-full text-[12px] md:text-sm font-semibold hover:bg-red-100 hover:border-red-300 transition-colors flex items-center justify-center space-x-2"
                       >
                          <Trash2 size={16} />
                          <span>Delete Selected ({selectedStudentIds.length})</span>
                       </button>
                       <button
                         onClick={handleClearSelection}
                         className="px-3.5 md:px-4 py-2 md:py-2.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-full text-[12px] md:text-sm font-semibold hover:bg-slate-100 hover:border-slate-300 transition-colors flex items-center justify-center"
                       >
                          <span>Clear Selection</span>
                       </button>
                    </>
                 )}
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
              <div className="px-4 md:px-5 py-3 border-b border-slate-100 bg-white flex flex-col gap-2 md:flex-row md:items-center md:justify-between relative">
                 <div>
                    <h3 className="text-sm md:text-base font-bold text-[#1e293b]">Enrolled Candidates</h3>
                    <p className="text-[11px] md:text-xs font-medium text-slate-500">
                      Showing <span className="font-bold text-slate-700">{processedStudents.length}</span> student{processedStudents.length === 1 ? '' : 's'}
                      {batchFilter !== 'All' ? ` in ${batchFilter}` : ''}
                    </p>
                 </div>

                 {/* Column Visibility Selector */}
                 <div className="relative">
                   <button 
                     onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                     className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                   >
                     <SlidersHorizontal size={13} />
                     <span>Columns</span>
                     <ChevronDown size={12} className={`transition-transform duration-200 ${showColumnDropdown ? 'rotate-180' : ''}`} />
                   </button>

                   {showColumnDropdown && (
                     <>
                       <div className="fixed inset-0 z-10" onClick={() => setShowColumnDropdown(false)}></div>
                       <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-2">
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
                             <span>{col === 'candidateInfo' ? 'Candidate Info' : 
                                    col === 'classification' ? 'Classification' : 
                                    col === 'batch' ? 'Batch' :
                                    col === 'team' ? 'Team' :
                                    col === 'placementInfo' ? 'Placement Info' :
                                    col === 'skills' ? 'Skills' :
                                    col === 'grade' ? 'Grade' : 
                                    col === 'status' ? 'Status' : col}</span>
                           </label>
                         ))}
                       </div>
                     </>
                   )}
                 </div>
              </div>
             
             <div className="overflow-x-auto">
               <table className="w-full min-w-[720px] text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="w-10 px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={currentItems.length > 0 && currentItems.every(student => selectedStudentIds.includes(student._id))}
                          onChange={handleToggleSelectAllPage}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-3.5 w-3.5"
                        />
                      </th>
                       {visibleColumns.candidateInfo && <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Candidate Info</th>}
                       {visibleColumns.classification && <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Classification</th>}
                       {visibleColumns.batch && <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Batch</th>}
                       {visibleColumns.team && <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Team</th>}
                       {visibleColumns.placementInfo && <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Placement Info</th>}
                       {visibleColumns.skills && <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Skills</th>}
                       {visibleColumns.grade && <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">Grade</th>}
                       {visibleColumns.status && <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>}
                      <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan={2 + Object.values(visibleColumns).filter(Boolean).length} className="px-3 py-10 text-center">
                          <div className="flex items-center justify-center gap-2 text-slate-500">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                            <span className="text-xs font-semibold">Retrieving candidates...</span>
                          </div>
                        </td>
                      </tr>
                    ) : currentItems.length > 0 ? currentItems.map(student => (
                      <tr key={student._id} className="transition-all hover:bg-slate-50/70 border-l-2 border-l-transparent hover:border-l-blue-600 duration-150">
                        <td className="px-2 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student._id)}
                            onChange={() => handleToggleSelect(student._id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-3.5 w-3.5 transition-all"
                          />
                        </td>
                        {visibleColumns.candidateInfo && (
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shadow-xs shrink-0 select-none">
                                {student.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0 max-w-[130px]">
                                <p className="text-xs font-bold text-slate-800 truncate leading-tight hover:text-blue-600 transition-colors cursor-pointer" title={student.name}>{student.name}</p>
                                <p className="text-[10px] text-slate-400 truncate mt-0.5 leading-none flex items-center gap-1 font-semibold" title={student.mobile}>
                                  <Phone size={9} className="shrink-0 text-slate-400/85" />
                                  <span>{student.mobile}</span>
                                </p>
                              </div>
                            </div>
                          </td>
                        )}
                        {visibleColumns.classification && (
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-1 max-w-[110px]">
                              {student.isFrontend && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200/30">
                                  Frontend
                                </span>
                              )}
                              {(student.enrollments || []).map(enrollment => (
                                <span key={enrollment} className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                                  enrollment === 'SPL' ? 'bg-purple-50 text-purple-700 border border-purple-200/30' : 'bg-blue-50 text-blue-700 border border-blue-200/30'
                                }`}>
                                  {enrollment}
                                </span>
                              ))}
                              {(!student.enrollments || student.enrollments.length === 0) && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200/30">
                                  Regular
                                </span>
                              )}
                            </div>
                          </td>
                        )}

                        {visibleColumns.batch && (
                          <td className="px-3 py-2.5 text-xs">
                            {student.batch ? (
                              <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700 ring-1 ring-inset ring-slate-700/10">
                                {student.batch}
                              </span>
                            ) : (
                              <span className="text-slate-350">—</span>
                            )}
                          </td>
                        )}

                        {visibleColumns.team && (
                          <td className="px-3 py-2.5 text-xs">
                            <div className="flex items-center gap-1.5">
                              {teams.find(t => t.members.some(m => m._id === student._id || m === student._id)) ? (
                                <>
                                  <div className="p-1 rounded-md bg-indigo-50 text-indigo-500 shrink-0">
                                    <Users size={11} />
                                  </div>
                                  <span 
                                    className="font-bold text-indigo-700 bg-indigo-50/50 px-2 py-0.5 rounded text-[10px] border border-indigo-100/30 truncate max-w-[100px] inline-block align-middle"
                                    title={teams.find(t => t.members.some(m => m._id === student._id || m === student._id))?.name}
                                  >
                                    {teams.find(t => t.members.some(m => m._id === student._id || m === student._id))?.name}
                                  </span>
                                </>
                              ) : (
                                <span className="text-slate-400 text-[10px] font-medium pl-6">-</span>
                              )}
                            </div>
                          </td>
                        )}
                        {visibleColumns.placementInfo && (
                          <td className="px-3 py-2.5 text-xs font-semibold text-slate-600">
                            {student.companyName ? (
                              <div>
                                <p className="font-bold text-slate-700 truncate" title={student.companyName}>{student.companyName}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 leading-none">{student.packageLpa || '—'} LPA</p>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px] font-medium pl-6">-</span>
                            )}
                          </td>
                        )}
                        {visibleColumns.skills && (
                          <td className="px-3 py-2.5 text-xs text-slate-500 max-w-[120px] truncate" title={student.skills || '—'}>
                            {student.skills || '—'}
                          </td>
                        )}
                        {visibleColumns.grade && (
                          <td className="px-3 py-2.5 text-center text-xs font-semibold">
                            {student.grade ? (
                              <div className="flex items-center justify-center gap-1">
                                <Award size={11} className="text-amber-500 shrink-0 animate-pulse" />
                                <span className={`inline-flex items-center justify-center h-5 w-5 rounded-md text-[10px] font-bold ${student.grade === 'A' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/30' : student.grade === 'B' ? 'bg-blue-50 text-blue-700 border border-blue-100/30' : 'bg-amber-50 text-amber-700 border border-amber-100/30'}`}>
                                  {student.grade}
                                </span>
                              </div>
                            ) : '-'}
                          </td>
                        )}
                        {visibleColumns.status && (
                          <td className="px-3 py-2.5">
                            <StatusBadge status={student.currentStatus} />
                          </td>
                        )}
                        <td className="px-3 py-2 text-right">
                          <div className="inline-flex gap-1.5">
                            <button
                              onClick={() => { setSelectedStudent(student); setIsViewOpen(true); }}
                              className="p-1.5 text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-500 rounded-lg transition-all duration-200 border border-emerald-100 hover:border-emerald-500 hover:scale-105 active:scale-95 shadow-2xs hover:shadow-[0_4px_12px_rgba(16,185,129,0.2)] cursor-pointer"
                              title="View Details"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              onClick={() => { setSelectedStudent(student); setEditMode(true); setIsModalOpen(true); }}
                              className="p-1.5 text-blue-600 hover:text-white bg-blue-50/50 hover:bg-blue-600 rounded-lg transition-all duration-200 border border-blue-100/50 hover:border-blue-600 hover:scale-105 active:scale-95 shadow-2xs hover:shadow-[0_4px_12px_rgba(37,99,235,0.2)] cursor-pointer"
                              title="Edit Candidate"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => { setSelectedStudent(student); setIsDeleteOpen(true); }}
                              className="p-1.5 text-rose-650 hover:text-white bg-rose-50/30 hover:bg-rose-600 rounded-lg transition-all duration-200 border border-rose-100/50 hover:border-rose-600 hover:scale-105 active:scale-95 shadow-2xs hover:shadow-[0_4px_12px_rgba(225,29,72,0.2)] cursor-pointer"
                              title="Delete Candidate"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={2 + Object.values(visibleColumns).filter(Boolean).length} className="px-4 py-8 md:py-10 text-center text-slate-450 font-medium text-xs">
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
          students={students}
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

function StudentFormModal({ onClose, onRefresh, student, editMode, students }) {
  const existingDegreeOptions = [...new Set((students || []).map(s => String(s.degree || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  const defaultDegreeOptions = ['B.Tech', 'M.Tech', 'BCA', 'MCA', 'B.Sc', 'M.Sc', 'B.Com', 'M.Com', 'BBA', 'MBA'];
  const degreeOptions = existingDegreeOptions.length > 0 ? existingDegreeOptions : defaultDegreeOptions;

  const studentDegree = student?.degree ? String(student.degree).trim() : '';
  const isCustomDegree = studentDegree && !degreeOptions.includes(studentDegree);

  const [formData, setFormData] = useState({
    name: student?.name || '',
    mobile: student?.mobile || '',
    email: student?.email || '',
    degree: isCustomDegree ? 'Other' : studentDegree || '',
    customDegree: isCustomDegree ? studentDegree : '',
    passedOutYear: student?.passedOutYear || '',
    batch: student?.batch || '',
    grade: student?.grade || '',
    currentStatus: student?.currentStatus || 'Job Seeker',
    statusReason: student?.statusReason || '',
    others: student?.others || '',
    companyName: student?.companyName || '',
    packageLpa: student?.packageLpa || '',
    jobGetMode: student?.jobGetMode || '',
    studentType: student?.studentType || 'Regular',
    enrollments: student?.enrollments || (student?.studentType === 'SPL' ? ['SPL'] : ['Regular']),
    isFrontend: student?.isFrontend || student?.studentType === 'Frontend' || false,
    stack: student?.stack || '',
    willingCompanyProcess: !!student?.willingCompanyProcess,
    willing30Days: student?.willing30Days || '',
    acceptOffer: student?.acceptOffer || '',
    fullEffort: student?.fullEffort || '',
    issues: student?.issues || '',
    needMost: student?.needMost || '',
    githubLink: student?.githubLink || '',
    linkedinLink: student?.linkedinLink || ''
  });

  const [submitting, setSubmitting] = useState(false);

  const statusOptions = [
    { value: 'Job Seeker', label: 'Active Job Seeker' },
    { value: 'Placed', label: 'Placed successfully' },
    { value: 'Need to filled', label: 'Needs Updates' },
    { value: 'Interview Process', label: 'Interviewing' },
    { value: 'Inactive/Suspend', label: 'Inactive/Suspend' },
    { value: 'Not Picking the call', label: 'Not Picking the call' },
    { value: 'Not Reachable', label: 'Not Reachable' }
  ];

  const hasCurrentStatusFallback = formData.currentStatus && !statusOptions.some(option => option.value === formData.currentStatus);

  const getDegreeOptions = () => {
    return [...new Set(degreeOptions || [])];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.enrollments || formData.enrollments.length === 0) {
      toast.error('Please select at least one program enrollment (Regular or SPL)');
      return;
    }
    setSubmitting(true);
    try {
      const url = editMode 
        ? buildApiUrl(`/students/${student._id}`)
        : buildApiUrl('/students');
      
      const payload = {
        ...formData,
        degree: formData.degree === 'Other' ? formData.customDegree.trim() || '' : formData.degree
      };

      const res = await fetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
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
    } finally {
      setSubmitting(false);
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
                   <label className="crm-label">Mobile Number</label>
                   <input required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="crm-input" />
                </div>
                <div>
                   <label className="crm-label">Email Address</label>
                   <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="crm-input" />
                </div>
                <div>
                   <label className="crm-label">Academic Origin (Degree)</label>
                   <select required value={formData.degree} onChange={e => setFormData({...formData, degree: e.target.value, customDegree: e.target.value !== 'Other' ? '' : formData.customDegree})} className="crm-input">
                      <option value="">Select Origin</option>
                      {getDegreeOptions().map(deg => (
                        <option key={deg} value={deg}>{deg}</option>
                      ))}
                      <option value="Other">Other</option>
                   </select>
                </div>
                {formData.degree === 'Other' && (
                  <div>
                    <label className="crm-label">New Academic Origin</label>
                    <input
                      required
                      value={formData.customDegree}
                      onChange={e => setFormData({...formData, customDegree: e.target.value})}
                      className="crm-input"
                      placeholder="Enter new degree"
                    />
                  </div>
                )}
                <div>
                   <label className="crm-label">Batch Temporal Identifier</label>
                   <input value={formData.passedOutYear} onChange={e => setFormData({...formData, passedOutYear: e.target.value})} className="crm-input" />
                </div>
                <div>
                    <label className="crm-label">Institute Batch</label>
                    <select 
                       value={formData.batch} 
                       onChange={e => setFormData({...formData, batch: e.target.value})} 
                       className="crm-input font-medium text-slate-700"
                    >
                       <option value="">-- Select Batch --</option>
                       <option value="Batch 1">Batch 1</option>
                       <option value="Batch 2">Batch 2</option>
                       <option value="Batch 3">Batch 3</option>
                       <option value="Batch 4">Batch 4</option>
                       <option value="Batch 5">Batch 5</option>
                       <option value="Batch 6">Batch 6</option>
                       <option value="Batch 7">Batch 7</option>
                       <option value="Batch 8">Batch 8</option>
                       <option value="Batch 9">Batch 9</option>
                       <option value="Frontend Batch 1">Frontend Batch 1</option>
                       <option value="Frontend Batch 2">Frontend Batch 2</option>
                       <option value="Frontend Batch 3">Frontend Batch 3</option>
                    </select>
                 </div>
                {/* Student classification defaults to Regular */}
                <div>
                   <label className="crm-label">Student Grade</label>
                   <select value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} className="crm-input">
                      <option value="">Unassigned</option>
                      <option value="A">Grade A</option>
                      <option value="B">Grade B</option>
                      <option value="C">Grade C</option>
                   </select>
                </div>
                
                <div className="md:col-span-2 pt-3 pb-2 border-t border-b border-slate-100 mt-2">
                   <label className="crm-label mb-2">Program Enrollments</label>
                   <div className="flex flex-wrap gap-4 md:gap-6">
                      <label className="inline-flex items-center gap-2 text-[12px] md:text-[13px] font-bold text-slate-700 cursor-pointer">
                         <input
                            type="checkbox"
                            checked={formData.enrollments.includes('Regular')}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...formData.enrollments, 'Regular']
                                : formData.enrollments.filter(x => x !== 'Regular');
                              setFormData({ ...formData, enrollments: next });
                            }}
                            className="w-4 h-4 text-[#4338ca] rounded border-slate-300 focus:ring-[#4338ca]"
                         />
                         Regular Program
                      </label>
                      <label className="inline-flex items-center gap-2 text-[12px] md:text-[13px] font-bold text-slate-700 cursor-pointer">
                         <input
                            type="checkbox"
                            checked={formData.enrollments.includes('SPL')}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...formData.enrollments, 'SPL']
                                : formData.enrollments.filter(x => x !== 'SPL');
                              setFormData({ ...formData, enrollments: next });
                            }}
                            className="w-4 h-4 text-[#4338ca] rounded border-slate-300 focus:ring-[#4338ca]"
                         />
                         SPL Program (Special Placement)
                      </label>
                      <label className="inline-flex items-center gap-2 text-[12px] md:text-[13px] font-bold text-slate-700 cursor-pointer">
                         <input
                            type="checkbox"
                            checked={formData.isFrontend}
                            onChange={(e) => {
                              setFormData({ ...formData, isFrontend: e.target.checked });
                            }}
                            className="w-4 h-4 text-[#4338ca] rounded border-slate-300 focus:ring-[#4338ca]"
                         />
                         Frontend Specialization Track
                      </label>
                   </div>
                </div>
                
                <div className="md:col-span-2 pt-5 md:pt-6 border-t border-slate-100">
                   <h4 className="text-[13px] md:text-[14px] font-extrabold text-[#1e293b] mb-3 md:mb-4">Pipeline Metrics</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                      <div>
                         <label className="crm-label">Active State</label>
                         <select required value={formData.currentStatus} onChange={e => setFormData({...formData, currentStatus: e.target.value})} className="crm-input bg-slate-50">
                            {hasCurrentStatusFallback && (
                              <option value={formData.currentStatus}>{formData.currentStatus}</option>
                            )}
                            {statusOptions.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                         </select>
                      </div>

                      {['inactive', 'suspended/inactive', 'inactive/suspend'].includes(formData.currentStatus.toLowerCase()) && (
                        <div>
                           <label className="crm-label">Suspend / Inactive Reason</label>
                           <textarea
                              value={formData.statusReason}
                              onChange={e => setFormData({...formData, statusReason: e.target.value})}
                              className="crm-input min-h-[6rem] resize-none"
                              placeholder="Enter the reason for inactive or suspended status"
                              required
                           />
                        </div>
                      )}

                       <div>
                          <label className="crm-label">GitHub URL</label>
                          <input
                             type="url"
                             value={formData.githubLink}
                             onChange={e => setFormData({...formData, githubLink: e.target.value})}
                             className="crm-input"
                             placeholder="https://github.com/username"
                          />
                       </div>

                       <div>
                          <label className="crm-label">LinkedIn URL</label>
                          <input
                             type="url"
                             value={formData.linkedinLink}
                             onChange={e => setFormData({...formData, linkedinLink: e.target.value})}
                             className="crm-input"
                             placeholder="https://linkedin.com/in/username"
                          />
                       </div>

                      <div className="md:col-span-2">
                         <label className="crm-label">Other Notes</label>
                         <input
                            value={formData.others}
                            onChange={e => setFormData({...formData, others: e.target.value})}
                            className="crm-input"
                            placeholder="Add any additional notes or remarks"
                         />
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

                {formData.enrollments.includes('SPL') && (
                   <div className="md:col-span-2 pt-5 md:pt-6 border-t border-slate-100 mt-4">
                      <h4 className="text-[13px] md:text-[14px] font-extrabold text-[#1e293b] mb-3 md:mb-4">SPL Candidate Telemetry</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                          <div className="md:col-span-2">
                             <label className="crm-label">Tech Stack</label>
                             <select value={formData.stack} onChange={e => setFormData({...formData, stack: e.target.value})} className="crm-input">
                                <option value="">Select Stack</option>
                                <option value="MERN Stack">MERN Stack</option>
                                <option value="Java Full Stack">Java Full Stack</option>
                                <option value="Python Full Stack">Python Full Stack</option>
                                <option value="Frontend Development">Frontend Development</option>
                                <option value="QA / Testing">QA / Testing</option>
                                <option value="Data Science / AI">Data Science / AI</option>
                             </select>
                          </div>
                      </div>
                   </div>
                 )}
             </div>

             <div className="mt-6 md:mt-8 flex flex-col-reverse sm:flex-row justify-end gap-2.5 md:gap-3">
                <button type="button" disabled={submitting} onClick={onClose} className="crm-btn-secondary crm-btn-compact px-6 md:px-7 disabled:opacity-50">Discard</button>
                <button type="submit" disabled={submitting} className="crm-btn-primary crm-btn-compact px-6 md:px-7 flex items-center justify-center gap-2 min-w-[125px]">
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    editMode ? 'Commit Edit' : 'Append State'
                  )}
                </button>
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
                {student.email && <DetailRow label="Email Contact" val={student.email} />}
                <DetailRow label="Batch Year" val={batchYear || 'Not Added'} />
                <DetailRow label="Institute Batch" val={student.batch || 'Not Added'} />
                <DetailRow label="Grade" val={student.grade || 'Unassigned'} />
                {student.statusReason && (
                  <DetailRow label="Status Reason" val={student.statusReason} />
                )}
                {student.others && (
                  <DetailRow label="Other Notes" val={student.others} />
                )}
                {student.githubLink && (
                   <div className="flex justify-between items-center gap-3 py-1">
                      <span className="text-[12px] md:text-[14px] font-bold text-slate-400">GitHub</span>
                      <a href={student.githubLink} target="_blank" rel="noopener noreferrer" className="text-[13px] md:text-[15px] font-extrabold text-blue-600 hover:underline text-right break-all max-w-[200px]">
                         {student.githubLink}
                      </a>
                   </div>
                 )}
                 {student.linkedinLink && (
                   <div className="flex justify-between items-center gap-3 py-1">
                      <span className="text-[12px] md:text-[14px] font-bold text-slate-400">LinkedIn</span>
                      <a href={student.linkedinLink} target="_blank" rel="noopener noreferrer" className="text-[13px] md:text-[15px] font-extrabold text-blue-600 hover:underline text-right break-all max-w-[200px]">
                         {student.linkedinLink}
                      </a>
                   </div>
                 )}
                {student.currentStatus.toLowerCase() === 'placed' && (
                  <div className="pt-5 mt-5 border-t border-slate-100 space-y-3">
                     <p className="text-[11px] md:text-[13px] font-extrabold text-emerald-600 uppercase tracking-widest mb-3">Placement Telemetry</p>
                     
                     <DetailRow label="Corporate Entity" val={student.companyName || 'Classified'} />
                     <DetailRow label="Value Compensation" val={student.packageLpa ? `${student.packageLpa} LPA` : 'Undisclosed'} />
                     {student.jobGetMode && <DetailRow label="Acquisition Vector" val={student.jobGetMode} />}
                  </div>
                )}
                 {(student.enrollments?.includes('SPL') || student.studentType === 'SPL') && (
                  <div className="pt-5 mt-5 border-t border-slate-100 space-y-3">
                     <p className="text-[11px] md:text-[13px] font-extrabold text-[#4338ca] uppercase tracking-widest mb-3">SPL Telemetry</p>
                     <DetailRow label="Technical Stack" val={student.stack || 'Not Specified'} />
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

function ConfirmDeleteSelectedModal({ onClose, onConfirm, count, isDeleting }) {
   return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
       <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm text-center p-8">
          <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
             <Trash2 size={28} className="text-red-500" />
          </div>
          <h3 className="text-xl font-extrabold text-[#1e293b] mb-3">Delete Selected Candidates</h3>
          <p className="text-[15px] font-medium text-slate-500 mb-8 leading-relaxed">
             Are you sure you want to permanently delete the <strong className="text-[#1e293b]">{count}</strong> selected student record{count === 1 ? '' : 's'}? This action cannot be undone.
          </p>
          <div className="flex flex-col space-y-3">
             <button
               onClick={onConfirm}
               disabled={isDeleting}
               className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[15px] font-bold shadow-sm shadow-red-200 transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
             >
               {isDeleting ? 'Deleting Records...' : 'Confirm Delete Selected'}
             </button>
             <button
               onClick={onClose}
               disabled={isDeleting}
               className="w-full py-3.5 bg-white text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
             >
               Cancel
             </button>
          </div>
       </div>
    </div>
   );
}
