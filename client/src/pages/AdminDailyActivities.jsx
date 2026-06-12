import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard, SectionTabs } from '../components/AppShell';
import { authHeaders, logout } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import { 
  Search, 
  Calendar, 
  Eye, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Building2, 
  FileText
} from 'lucide-react';

export default function AdminDailyActivities() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Modal State
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchStudents = async () => {
    try {
      const res = await fetch(buildApiUrl('/students'), {
        headers: { ...authHeaders() }
      });
      if (res.ok) {
        const data = await res.json();
        setStudentsList(data);
      }
    } catch (err) {
      console.error('Failed to load student list', err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStudentFilter !== 'All') params.append('studentId', selectedStudentFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (searchTerm) params.append('search', searchTerm);

      const res = await fetch(`${buildApiUrl('/daily-activities')}?${params.toString()}`, {
        headers: { ...authHeaders() }
      });
      
      if (res.status === 401) {
        logout();
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch daily logs');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      toast.error('Unable to retrieve daily status logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Poll for logs when filters change
  useEffect(() => {
    fetchLogs();
    setCurrentPage(1);
  }, [selectedStudentFilter, startDate, endDate]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const paginatedLogs = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStudentFilter('All');
    setStartDate('');
    setEndDate('');
  };

  return (
    <AppShell
      title="Student Daily Logs Dashboard"
      subtitle="Monitor day-to-day candidate activities and audit search / company updates."
      searchPlaceholder="Search by student name, email, or log content..."
    >
      <SectionTabs
        items={[
          { label: 'Overview', onClick: () => navigate('/dashboard') },
          { label: 'Students', onClick: () => navigate('/students') },
          { label: 'Daily Logs', active: true },
          { label: 'Eligibility', onClick: () => navigate('/eligibility') },
        ]}
      />

      {/* Toolbar / Filters */}
      <SurfaceCard className="p-5 mb-6">
        <div className="flex items-center gap-2 mb-4 text-[#1e293b] font-bold text-sm">
          <Filter size={16} />
          <span>Filter Logs</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search activity details..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold text-[#1e293b] transition-shadow" 
            />
          </div>

          {/* Student Filter */}
          <select 
            value={selectedStudentFilter} 
            onChange={(e) => setSelectedStudentFilter(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold text-[#1e293b] cursor-pointer transition-shadow"
          >
            <option value="All">All Students</option>
            {studentsList.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>

          {/* Start Date */}
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" size={14} />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold text-[#1e293b] transition-shadow" 
            />
          </div>

          {/* End Date */}
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" size={14} />
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold text-[#1e293b] transition-shadow" 
            />
          </div>
        </div>

        {(searchTerm || selectedStudentFilter !== 'All' || startDate || endDate) && (
          <div className="flex justify-end mt-4">
            <button 
              onClick={resetFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-4 py-1.5 rounded-lg border border-rose-100 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </SurfaceCard>

      {/* Logs Table */}
      <SurfaceCard className="overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-white flex items-center justify-between">
          <h3 className="text-sm md:text-base font-bold text-[#1e293b]">Student Daily Activity Updates</h3>
          <p className="text-[11px] md:text-xs font-medium text-slate-500">
            Total entries: <span className="font-bold text-slate-700">{logs.length}</span>
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="bg-[#f8fafc] border-b border-slate-100">
              <tr>
                <th className="px-5 py-2.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50/50">Student</th>
                <th className="px-5 py-2.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50/50">Date</th>
                <th className="px-5 py-2.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50/50">Company Apply</th>
                <th className="px-5 py-2.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50/50">Task / Process</th>
                <th className="px-5 py-2.5 text-right text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50/50">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent flex items-center justify-center rounded-full mx-auto"></div>
                  </td>
                </tr>
              ) : paginatedLogs.length > 0 ? (
                paginatedLogs.map(log => {
                  const logDate = new Date(log.date);
                  const studentInitials = log.studentName
                    ? log.studentName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
                    : 'ST';

                  return (
                    <tr key={log._id} className="border-b border-slate-50 hover:bg-[#f8fafc] transition-colors group">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 border border-slate-200/60 flex items-center justify-center text-xs font-bold shadow-sm">
                            {studentInitials}
                          </div>
                          <div>
                            <div className="text-[12px] md:text-[13px] font-bold text-[#1e293b]">{log.studentName}</div>
                            <div className="text-[10px] md:text-[11px] font-medium text-slate-400">{log.studentEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-[11px] md:text-[12px] font-medium text-slate-600">
                          {logDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-5 py-3 max-w-[200px]">
                        <div className="text-[12px] md:text-[13px] font-bold text-[#1e293b] truncate" title={log.companyApply}>
                          {log.companyApply || 'Company Apply'}
                        </div>
                      </td>
                      <td className="px-5 py-3 max-w-[250px]">
                        <div className="text-[11px] md:text-[12px] font-medium text-slate-700 truncate" title={log.taskWorkProcess}>
                          {log.taskWorkProcess}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button 
                          onClick={() => { setSelectedLog(log); setIsDetailOpen(true); }}
                          className="p-1.5 rounded-lg bg-indigo-50 text-[#4338ca] hover:bg-[#4338ca] hover:text-white transition-all shadow-sm"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-5 py-8 text-center text-slate-400 font-medium text-[12px]">
                    No activity logs recorded matching selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center bg-[#f8fafc]/50">
          <span className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wide">
            Page <span className="text-slate-600 px-1">{currentPage}</span> of <span className="text-slate-600 pl-1">{totalPages || 1}</span>
          </span>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </SurfaceCard>

      {/* Detail Modal */}
      {isDetailOpen && selectedLog && (
        <LogDetailModal 
          onClose={() => { setSelectedLog(null); setIsDetailOpen(false); }}
          log={selectedLog}
        />
      )}
    </AppShell>
  );
}

function LogDetailModal({ onClose, log }) {
  const logDate = new Date(log.date);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-[#f8fafc] border-b border-slate-100 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-200">
              {log.studentName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#1e293b] leading-tight">{log.studentName}</h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">{log.studentEmail}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-white text-slate-400 hover:text-slate-800 shadow-sm border border-slate-200 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Metadata Row */}
          <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Activity Date</span>
              <span className="text-sm font-extrabold text-slate-800">
                {logDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Company Apply</span>
            <div className="text-sm text-slate-800 font-bold bg-slate-50 p-4 rounded-xl border border-slate-100">
              {log.companyApply || 'N/A'}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Task / Process</span>
            <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
              {log.taskWorkProcess}
            </div>
          </div>

          {log.remarks && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remarks</span>
              <div className="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">
                {log.remarks}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
