import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Download, Upload, Plus, Edit, Eye, Trash2, X, ChevronLeft, ChevronRight,
  User, Mail, Phone, GraduationCap, Calendar, Users, MapPin, SlidersHorizontal, ChevronDown
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
  const searchTimerRef = useRef(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [batchFilter, setBatchFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [sortBy, setSortBy] = useState('batch-asc');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [isDeleteSelectedOpen, setIsDeleteSelectedOpen] = useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    candidateInfo: true,
    contact: true,
    degree: true,
    grade: true,
    stack: true,
    team: false,
    location: true,
    status: false,
  });

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

  const uniqueBatches = useMemo(() => {
    const batches = students
      .map(s => String(s.batch || '').trim())
      .filter(Boolean);
    return ['All', ...new Set(batches)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [students]);

  const uniqueYears = useMemo(() => {
    const years = students
      .map(s => String(s.passedOutYear || '').trim())
      .filter(Boolean);
    return ['All', ...new Set(years)].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  }, [students]);

  useEffect(() => {
    setCurrentPage(1);
  }, [batchFilter, yearFilter]);

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
      Degree: s.degree || '',
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

  const availableStatuses = ['Job Seeker', 'Placed', 'Need to filled', 'Inactive/Suspend'];

  const processedStudents = useMemo(() => {
    return [...students]
      .filter(student => {
        if (searchTerm) {
          const term = searchTerm.toLowerCase().trim();
          const matchesSearch = (
            student.name?.toLowerCase().includes(term) ||
            student.mobile?.toLowerCase().includes(term) ||
            student.email?.toLowerCase().includes(term) ||
            student.batch?.toLowerCase().includes(term) ||
            student.passedOutYear?.toString().includes(term) ||
            student.city?.toLowerCase().includes(term)
          );
          if (!matchesSearch) return false;
        }

        if (batchFilter !== 'All') {
          if (String(student.batch || '').trim() !== batchFilter) return false;
        }

        if (yearFilter !== 'All') {
          if (String(student.passedOutYear || '').trim() !== yearFilter) return false;
        }

        return true;
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
  }, [students, searchTerm, batchFilter, yearFilter, sortBy]);
  const totalPages = Math.ceil(processedStudents.length / itemsPerPage);
  const currentItems = processedStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <AppShell
      title="Frontend Student Directory"
      subtitle="Manage Frontend track records, excel bulk uploads, and location-based details."
      searchPlaceholder="Search by name, email, mobile, batch, year, city..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      onSearchSubmit={handleSearchSubmit}
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
      <div className="mb-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 bg-white p-4 rounded-[20px] border border-slate-200/85 shadow-sm">
        <div className="flex flex-col md:flex-row gap-2 flex-1 flex-wrap">
          {/* Visible In-Page Search Option */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, mobile, batch, year, city..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchSubmit();
                }
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
          <div className="w-full md:w-[160px]">
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

          {/* Batch Selector */}
          <div className="w-full md:w-[150px]">
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all cursor-pointer"
            >
              <option value="All">All Batches</option>
              {uniqueBatches.filter(b => b !== 'All').map(batch => (
                <option key={batch} value={batch}>{batch}</option>
              ))}
            </select>
          </div>

          {/* Batch Year Selector */}
          <div className="w-full md:w-[120px]">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all cursor-pointer"
            >
              <option value="All">All Years</option>
              {uniqueYears.filter(y => y !== 'All').map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Sorting selector */}
          <div className="w-full md:w-[160px]">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all cursor-pointer"
            >
              <option value="batch-asc">Batch: 1 to 9 (Asc)</option>
              <option value="batch-desc">Batch: 9 to 1 (Desc)</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
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
        <div className="px-4 md:px-5 py-3 border-b border-slate-100 bg-white flex flex-col gap-2 md:flex-row md:items-center md:justify-between relative">
           <div>
              <h3 className="text-sm md:text-base font-bold text-[#1e293b]">Enrolled Candidates</h3>
              <p className="text-[11px] md:text-xs font-medium text-slate-500">
                Showing <span className="font-bold text-slate-700">{processedStudents.length}</span> student{processedStudents.length === 1 ? '' : 's'}
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
                               col === 'contact' ? 'Contact' : 
                               col === 'degree' ? 'Degree' : 
                               col === 'grade' ? 'Grade' :
                               col === 'stack' ? 'Tech Stack' :
                               col === 'team' ? 'Team' :
                               col === 'location' ? 'Location' : 
                               col === 'status' ? 'Status' : col}</span>
                     </label>
                   ))}
                 </div>
               </>
             )}
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-10 px-2 py-2 text-center">
                  <input 
                    type="checkbox" 
                    checked={currentItems.length > 0 && currentItems.every(item => selectedStudentIds.includes(item._id))}
                    onChange={handleToggleSelectAllPage}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-3.5 w-3.5"
                  />
                </th>
                {visibleColumns.candidateInfo && <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Candidate Info</th>}
                {visibleColumns.contact && <th className="hidden sm:table-cell px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Contact</th>}
                {visibleColumns.degree && <th className="hidden sm:table-cell px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Degree</th>}
                {visibleColumns.grade && <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">Grade</th>}
                {visibleColumns.stack && <th className="hidden sm:table-cell px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Tech Stack</th>}
                {visibleColumns.team && <th className="hidden sm:table-cell px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Team</th>}
                {visibleColumns.location && <th className="hidden md:table-cell px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</th>}
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
                      <span className="text-sm font-semibold">Retrieving Frontend candidates...</span>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={2 + Object.values(visibleColumns).filter(Boolean).length} className="px-3 py-10 text-center text-xs font-semibold text-slate-500">
                    No frontend student records found matching the active filters.
                  </td>
                </tr>
              ) : (
                currentItems.map(student => (
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
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.contact && (
                      <td className="hidden sm:table-cell px-3 py-2.5 text-xs font-semibold text-slate-600">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <div className="p-1 rounded-md bg-slate-100/80 text-slate-500 shrink-0">
                            <Phone size={10} />
                          </div>
                          <span className="truncate max-w-[90px] block" title={student.mobile}>{student.mobile}</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.degree && (
                      <td className="hidden sm:table-cell px-3 py-2.5 text-xs font-semibold text-slate-655">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <div className="p-1 rounded-md bg-slate-100/80 text-slate-500 shrink-0">
                            <GraduationCap size={11} />
                          </div>
                          <span className="truncate max-w-[90px] block font-bold text-slate-700" title={student.degree || '—'}>{student.degree || '—'}</span>
                        </div>
                      </td>
                    )}

                    {visibleColumns.grade && (
                      <td className="px-3 py-2.5 text-center">
                        {student.grade ? (
                          <span className={`inline-flex items-center justify-center h-5 w-5 rounded-md text-[10px] font-bold ${student.grade === 'A' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/30' : student.grade === 'B' ? 'bg-blue-50 text-blue-700 border border-blue-100/30' : 'bg-amber-50 text-amber-700 border border-amber-100/30'}`}>
                            {student.grade}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium text-[10px]">—</span>
                        )}
                      </td>
                    )}

                    {visibleColumns.stack && (
                      <td className="hidden sm:table-cell px-3 py-2.5 text-xs text-slate-650">
                        <span className="font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[10px]">
                          {student.stack || 'Frontend Development'}
                        </span>
                      </td>
                    )}

                    {visibleColumns.team && (
                      <td className="hidden sm:table-cell px-3 py-2.5 text-xs">
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
                    {visibleColumns.location && (
                      <td className="hidden md:table-cell px-3 py-2.5 text-xs font-semibold text-slate-600">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <div className="p-1 rounded-md bg-slate-100/80 text-slate-500 shrink-0">
                            <MapPin size={11} />
                          </div>
                          <span className="truncate max-w-[90px] block font-bold text-slate-700" title={student.city || '-'}>{student.city || '-'}</span>
                        </div>
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
                          title="Modify Record"
                        >
                          <Edit size={13} />
                        </button>
                        <button 
                          onClick={() => { setSelectedStudent(student); setIsDeleteOpen(true); }}
                          className="p-1.5 text-rose-650 hover:text-white bg-rose-50/30 hover:bg-rose-600 rounded-lg transition-all duration-200 border border-rose-100/50 hover:border-rose-600 hover:scale-105 active:scale-95 shadow-2xs hover:shadow-[0_4px_12px_rgba(225,29,72,0.2)] cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 size={13} />
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
  const defaultDegreeOptions = ['B.Tech', 'M.Tech', 'BCA', 'MCA', 'B.Sc', 'M.Sc', 'B.Com', 'M.Com', 'BBA', 'MBA'];
  const studentDegree = student?.degree ? String(student.degree).trim() : '';
  const isCustomDegree = studentDegree && !defaultDegreeOptions.includes(studentDegree);

  const [formData, setFormData] = useState({
    name: student?.name || '',
    email: student?.email || '',
    mobile: student?.mobile || '',
    degree: isCustomDegree ? 'Other' : studentDegree || '',
    customDegree: isCustomDegree ? studentDegree : '',
    batch: student?.batch || '',
    passedOutYear: student?.passedOutYear || '',
    city: student?.city || '',
    currentStatus: student?.currentStatus || 'Job Seeker',
    grade: student?.grade || '',
    stack: student?.stack || '',
    statusReason: student?.statusReason || '',
    others: student?.others || '',
    companyName: student?.companyName || '',
    packageLpa: student?.packageLpa || '',
    jobGetMode: student?.jobGetMode || '',
    githubLink: student?.githubLink || '',
    linkedinLink: student?.linkedinLink || '',
    studentType: 'Frontend',
    isFrontend: true
  });

  const [submitting, setSubmitting] = useState(false);

  const statusOptions = [
    { value: 'Job Seeker', label: 'Active Job Seeker' },
    { value: 'Placed', label: 'Placed successfully' },
    { value: 'Need to filled', label: 'Needs Updates' },
    { value: 'Inactive/Suspend', label: 'Inactive/Suspend' }
  ];

  const hasCurrentStatusFallback = formData.currentStatus && !statusOptions.some(option => option.value === formData.currentStatus);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editMode 
        ? buildApiUrl(`/students/${student._id}`)
        : buildApiUrl('/students');
      
      const payload = {
        ...formData,
        degree: formData.degree === 'Other' ? formData.customDegree.trim() || '' : formData.degree
      };
      delete payload.customDegree;

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
              <label className="crm-label">Degree</label>
              <select 
                required 
                value={formData.degree} 
                onChange={e => setFormData({...formData, degree: e.target.value, customDegree: e.target.value !== 'Other' ? '' : formData.customDegree})} 
                className="crm-input"
              >
                <option value="">Select Degree</option>
                {defaultDegreeOptions.map(deg => (
                  <option key={deg} value={deg}>{deg}</option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>
            {formData.degree === 'Other' ? (
              <div>
                <label className="crm-label">Specify Degree</label>
                <input
                  required
                  value={formData.customDegree}
                  onChange={e => setFormData({...formData, customDegree: e.target.value})}
                  className="crm-input"
                  placeholder="e.g. B.Sc CS"
                />
              </div>
            ) : (
              <div>
                <label className="crm-label">City</label>
                <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="crm-input" placeholder="e.g. Bangalore" />
              </div>
            )}
          </div>

          {formData.degree === 'Other' && (
            <div>
              <label className="crm-label">City</label>
              <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="crm-input" placeholder="e.g. Bangalore" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="crm-label">Batch</label>
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
            <div>
              <label className="crm-label">Batch Year</label>
              <input value={formData.passedOutYear} onChange={e => setFormData({...formData, passedOutYear: e.target.value})} className="crm-input" placeholder="e.g. 2024" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="crm-label">Student Grade</label>
              <select value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} className="crm-input">
                <option value="">Unassigned</option>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
              </select>
            </div>
            <div>
              <label className="crm-label">Tech Stack</label>
              <select value={formData.stack} onChange={e => setFormData({...formData, stack: e.target.value})} className="crm-input">
                <option value="">Select Stack</option>
                <option value="MERN Stack">MERN Stack</option>
                <option value="Frontend Development">Frontend Development</option>
                <option value="React.js">React.js</option>
                <option value="Angular">Angular</option>
                <option value="Vue.js">Vue.js</option>
                <option value="Next.js">Next.js</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="HTML / CSS / JavaScript">HTML / CSS / JavaScript</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-[13px] md:text-[14px] font-extrabold text-[#1e293b] mb-3">Pipeline Metrics</h4>
            <div className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div>
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
                <div className="grid grid-cols-2 gap-4">
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

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" disabled={submitting} onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 min-w-[120px]">
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
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

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-blue-100 text-blue-600 font-bold rounded-2xl flex items-center justify-center text-lg">
              {student.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800">{student.name}</h4>
              <p className="text-xs text-slate-400">Track: Frontend Student</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-[14px]">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Active State</span>
              <StatusBadge status={student.currentStatus} />
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
              <span className="text-slate-400 font-medium">Degree</span>
              <span className="text-slate-800 font-semibold">{student.degree || 'N/A'}</span>
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
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 font-medium">Grade</span>
              <span className="text-slate-800 font-semibold">{student.grade || 'Unassigned'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 font-medium">Tech Stack</span>
              <span className="text-slate-800 font-semibold">{student.stack || 'Frontend Development'}</span>
            </div>
            {student.statusReason && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-medium">Status Reason</span>
                <span className="text-slate-800 font-semibold text-right max-w-[200px] break-words">{student.statusReason}</span>
              </div>
            )}
            {student.others && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-medium">Other Notes</span>
                <span className="text-slate-800 font-semibold text-right max-w-[200px] break-words">{student.others}</span>
              </div>
            )}
            {student.githubLink && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-medium">GitHub</span>
                <a href={student.githubLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold break-all max-w-[200px] text-right">
                  {student.githubLink}
                </a>
              </div>
            )}
            {student.linkedinLink && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-medium">LinkedIn</span>
                <a href={student.linkedinLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold break-all max-w-[200px] text-right">
                  {student.linkedinLink}
                </a>
              </div>
            )}
            {student.currentStatus?.toLowerCase() === 'placed' && (
              <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                 <p className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-widest mb-2">Placement Telemetry</p>
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-400 font-medium">Corporate Entity</span>
                   <span className="text-slate-800 font-semibold">{student.companyName || 'Classified'}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-400 font-medium">Value Compensation</span>
                   <span className="text-slate-800 font-semibold">{student.packageLpa ? `${student.packageLpa} LPA` : 'Undisclosed'}</span>
                 </div>
                 {student.jobGetMode && (
                   <div className="flex justify-between text-sm">
                     <span className="text-slate-400 font-medium">Acquisition Vector</span>
                     <span className="text-slate-800 font-semibold">{student.jobGetMode}</span>
                   </div>
                 )}
              </div>
            )}
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
