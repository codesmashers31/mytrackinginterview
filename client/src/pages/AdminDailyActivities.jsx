import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { AppShell, SurfaceCard, MetricCard, SectionTabs } from '../components/AppShell';
import { authHeaders, logout } from '../utils/auth';
import { buildApiUrl, cachedGet } from '../utils/api';
import { 
  Search, 
  Calendar, 
  Eye, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Building2, 
  FileText,
  Briefcase,
  Award,
  Download,
  Mail,
  Phone,
  ExternalLink,
  Code2,
  BookOpen,
  UserCheck,
  Sparkles
} from 'lucide-react';

export default function AdminDailyActivities() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'interviews' | 'tasks'

  // Data states
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [taskLogs, setTaskLogs] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState('All');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modals
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchStudents = async () => {
    try {
      const data = await cachedGet('/students');
      setStudentsList(data || []);
    } catch (err) {
      console.error('Failed to load student list', err);
    }
  };

  const fetchAllAdminData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStudentFilter !== 'All') params.append('studentId', selectedStudentFilter);
      if (selectedBatchFilter !== 'All') params.append('batch', selectedBatchFilter);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (searchTerm) params.append('search', searchTerm);

      const [appRes, intRes, taskRes] = await Promise.all([
        fetch(`${buildApiUrl('/job-applications')}?${params.toString()}`, { headers: authHeaders() }),
        fetch(`${buildApiUrl('/interview-experiences')}?${params.toString()}`, { headers: authHeaders() }),
        fetch(`${buildApiUrl('/daily-activities')}?${params.toString()}`, { headers: authHeaders() })
      ]);

      if (appRes.status === 401 || intRes.status === 401 || taskRes.status === 401) {
        logout();
        return;
      }

      setApplications(appRes.ok ? await appRes.json() : []);
      setInterviews(intRes.ok ? await intRes.json() : []);
      setTaskLogs(taskRes.ok ? await taskRes.json() : []);
    } catch (err) {
      toast.error('Unable to retrieve student activity records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchAllAdminData();
    setCurrentPage(1);
  }, [selectedStudentFilter, selectedBatchFilter, statusFilter, startDate, endDate]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAllAdminData();
      setCurrentPage(1);
    }, 450);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStudentFilter('All');
    setSelectedBatchFilter('All');
    setStatusFilter('All');
    setStartDate('');
    setEndDate('');
  };

  // Distinct batches for filter
  const batchOptions = Array.from(
    new Set(studentsList.map(s => s.batch).filter(Boolean))
  ).sort();

  // Excel Export Handler
  const exportToExcel = () => {
    let exportData = [];
    let fileName = 'Student_Activities.xlsx';

    if (activeTab === 'applications') {
      fileName = 'Student_Company_Applications.xlsx';
      exportData = applications.map(app => ({
        'Student Name': app.studentName,
        'Student Email': app.studentEmail,
        'Batch': app.batch || 'N/A',
        'Company Name': app.companyName,
        'Job Role': app.jobRole || 'N/A',
        'Apply Date': new Date(app.applyDate).toLocaleDateString(),
        'Application Mode': app.applicationType,
        'Status': app.status,
        'HR Name': app.hrDetails?.name || '',
        'HR Email': app.hrDetails?.email || '',
        'HR Phone': app.hrDetails?.phone || '',
        'HR LinkedIn': app.hrDetails?.linkedin || '',
        'Job URL': app.jobLink || '',
        'Notes': app.notes || ''
      }));
    } else if (activeTab === 'interviews') {
      fileName = 'Student_Interview_Experiences.xlsx';
      exportData = interviews.map(int => ({
        'Student Name': int.studentName,
        'Student Email': int.studentEmail,
        'Batch': int.batch || 'N/A',
        'Company Name': int.companyName,
        'Role': int.role || 'N/A',
        'Interview Date': new Date(int.interviewDate).toLocaleDateString(),
        'Interview Mode': int.interviewMode,
        'Overall Status': int.overallStatus,
        'Aptitude Attended': int.aptitudeRound?.attended ? 'Yes' : 'No',
        'Aptitude Result': int.aptitudeRound?.result || 'N/A',
        'Aptitude Topics': int.aptitudeRound?.topicsCovered || '',
        'Aptitude Qs': int.aptitudeRound?.questionsAsked || '',
        'Communication Attended': int.communicationRound?.attended ? 'Yes' : 'No',
        'Communication Result': int.communicationRound?.result || 'N/A',
        'Communication Qs': int.communicationRound?.questionsAsked || '',
        'Technical Attended': int.technicalRound?.attended ? 'Yes' : 'No',
        'Technical Result': int.technicalRound?.result || 'N/A',
        'Tech Topics': int.technicalRound?.topicsCovered || '',
        'Tech Questions / Coding': int.technicalRound?.questionsAsked || '',
        'HR Round Attended': int.hrRound?.attended ? 'Yes' : 'No',
        'HR Discussion': int.hrRound?.questionsAsked || '',
        'Learnings & Tips': int.tipsAndLearnings || ''
      }));
    } else {
      fileName = 'Student_Daily_Task_Logs.xlsx';
      exportData = taskLogs.map(log => ({
        'Student Name': log.studentName,
        'Student Email': log.studentEmail,
        'Date': new Date(log.date).toLocaleDateString(),
        'Topic / Company': log.companyApply,
        'Task Work Process': log.taskWorkProcess,
        'Remarks': log.remarks || ''
      }));
    }

    if (exportData.length === 0) {
      toast.error('No data available to export');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Records');
    XLSX.writeFile(wb, fileName);
    toast.success(`Exported ${exportData.length} records to Excel!`);
  };

  // Status Badge Colors
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Offer Received':
      case 'Selected / Offer':
      case 'Cleared':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Interview Scheduled':
      case 'Cleared / Next Round':
      case 'Shortlisted':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Mail Sent':
      case 'Under Review':
      case 'Attended / In Progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Rejected':
      case 'Not Cleared':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Active dataset based on tab
  const currentList = activeTab === 'applications' ? applications : activeTab === 'interviews' ? interviews : taskLogs;
  const totalPages = Math.ceil(currentList.length / itemsPerPage);
  const paginatedList = currentList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <AppShell
      title="Student Daily Activity Hub"
      subtitle="Audit day-to-day candidate job applications, interview round experiences, and task progress."
      searchPlaceholder="Search candidates, companies, HRs, or questions..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
    >
      <SectionTabs
        items={[
          { label: 'Overview', onClick: () => navigate('/dashboard') },
          { label: 'Regular Students', onClick: () => navigate('/students') },
          { label: 'Activity Hub', active: true },
          { label: 'Eligibility', onClick: () => navigate('/placement/eligibility') },
        ]}
      />

      {/* Top Metrics Cards */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <MetricCard
          title="Total Applications"
          value={`${applications.length}`}
          helper="Company applications logged"
          icon={<Briefcase size={22} />}
          tone="primary"
        />
        <MetricCard
          title="Interviews Logged"
          value={`${interviews.length}`}
          helper="Attended interview rounds"
          icon={<Award size={22} />}
          tone="success"
        />
        <MetricCard
          title="Offers / Cleared"
          value={`${interviews.filter(i => i.overallStatus === 'Selected / Offer' || i.overallStatus === 'Cleared / Next Round').length}`}
          helper="Successful rounds & offers"
          icon={<Sparkles size={22} />}
          tone="warning"
        />
        <MetricCard
          title="Daily Task Logs"
          value={`${taskLogs.length}`}
          helper="Study & practice entries"
          icon={<BookOpen size={22} />}
          tone="neutral"
        />
      </div>

      {/* Navigation Tabs & Excel Export Button */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setActiveTab('applications'); setCurrentPage(1); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm ${
              activeTab === 'applications'
                ? 'bg-blue-600 text-white shadow-blue-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Briefcase size={16} />
            <span>Job Applications ({applications.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('interviews'); setCurrentPage(1); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm ${
              activeTab === 'interviews'
                ? 'bg-blue-600 text-white shadow-blue-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Award size={16} />
            <span>Interview Experiences ({interviews.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('tasks'); setCurrentPage(1); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all shadow-sm ${
              activeTab === 'tasks'
                ? 'bg-blue-600 text-white shadow-blue-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <BookOpen size={16} />
            <span>Daily Task Logs ({taskLogs.length})</span>
          </button>
        </div>

        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition active:scale-95"
        >
          <Download size={15} />
          <span>Export {activeTab === 'applications' ? 'Applications' : activeTab === 'interviews' ? 'Interviews' : 'Tasks'} to Excel</span>
        </button>
      </div>

      {/* Filter Surface */}
      <SurfaceCard className="p-5 mb-6">
        <div className="flex items-center gap-2 mb-3 text-slate-800 font-bold text-xs">
          <Filter size={15} />
          <span>Filter Records</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Student Filter */}
          <select 
            value={selectedStudentFilter} 
            onChange={(e) => setSelectedStudentFilter(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
          >
            <option value="All">All Students</option>
            {studentsList.map(s => (
              <option key={s._id} value={s._id}>{s.name} ({s.batch || 'Regular'})</option>
            ))}
          </select>

          {/* Batch Filter */}
          <select 
            value={selectedBatchFilter} 
            onChange={(e) => setSelectedBatchFilter(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
          >
            <option value="All">All Batches</option>
            {batchOptions.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Status Filter (applicable for applications and interviews) */}
          {activeTab !== 'tasks' ? (
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
            >
              <option value="All">All Statuses</option>
              {activeTab === 'applications' ? (
                <>
                  <option value="Applied">Applied</option>
                  <option value="Mail Sent">Mail Sent</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Interview Scheduled">Interview Scheduled</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Offer Received">Offer Received</option>
                </>
              ) : (
                <>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Attended / In Progress">Attended / In Progress</option>
                  <option value="Cleared / Next Round">Cleared / Next Round</option>
                  <option value="Selected / Offer">Selected / Offer</option>
                  <option value="Rejected">Rejected</option>
                </>
              )}
            </select>
          ) : <div />}

          {/* Start Date */}
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" size={14} />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500" 
            />
          </div>

          {/* End Date */}
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" size={14} />
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500" 
            />
          </div>
        </div>

        {(searchTerm || selectedStudentFilter !== 'All' || selectedBatchFilter !== 'All' || statusFilter !== 'All' || startDate || endDate) && (
          <div className="flex justify-end mt-3">
            <button 
              onClick={resetFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition"
            >
              Clear Filters
            </button>
          </div>
        )}
      </SurfaceCard>

      {/* ---------------------------------------------------- */}
      {/* TAB 1 TABLE: JOB APPLICATIONS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'applications' && (
        <SurfaceCard className="overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-white flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Student Company Applications & Outreach</h3>
            <p className="text-xs font-medium text-slate-500">
              Total entries: <span className="font-bold text-slate-700">{applications.length}</span>
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-[#f8fafc] border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Candidate</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Company & Role</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Apply Date</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Mode</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">HR Contact</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-right text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-12 text-center">
                      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
                    </td>
                  </tr>
                ) : paginatedList.length > 0 ? (
                  paginatedList.map(app => (
                    <tr key={app._id} className="border-b border-slate-50 hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3">
                        <div className="font-bold text-xs text-slate-900">{app.studentName}</div>
                        <div className="text-[10px] text-slate-400">{app.studentEmail}</div>
                        {app.batch && <span className="inline-block mt-0.5 text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">{app.batch}</span>}
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-black text-xs text-slate-900">{app.companyName}</div>
                        <div className="text-[11px] font-medium text-blue-600">{app.jobRole || 'Software Trainee'}</div>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600 font-medium">
                        {new Date(app.applyDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          {app.applicationType}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {app.hrDetails?.name || app.hrDetails?.email ? (
                          <div className="text-xs">
                            <div className="font-bold text-slate-800">{app.hrDetails.name || 'HR Recruiter'}</div>
                            {app.hrDetails.email && <div className="text-[10px] text-blue-600 truncate max-w-[150px]">{app.hrDetails.email}</div>}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusBadge(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button 
                          onClick={() => setSelectedApp(app)}
                          className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white transition shadow-sm"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-5 py-8 text-center text-slate-400 text-xs">
                      No company applications found matching the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="text-xs font-bold text-slate-400">
              Page <span className="text-slate-700">{currentPage}</span> of <span className="text-slate-700">{totalPages || 1}</span>
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </SurfaceCard>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2 TABLE: INTERVIEW EXPERIENCES */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'interviews' && (
        <SurfaceCard className="overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-white flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Student Interview Rounds & Question Insights</h3>
            <p className="text-xs font-medium text-slate-500">
              Total entries: <span className="font-bold text-slate-700">{interviews.length}</span>
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-[#f8fafc] border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Candidate</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Company & Role</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Mode</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Rounds Cleared / Attended</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Overall Status</th>
                  <th className="px-5 py-3 text-right text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-12 text-center">
                      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
                    </td>
                  </tr>
                ) : paginatedList.length > 0 ? (
                  paginatedList.map(int => (
                    <tr key={int._id} className="border-b border-slate-50 hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3">
                        <div className="font-bold text-xs text-slate-900">{int.studentName}</div>
                        <div className="text-[10px] text-slate-400">{int.studentEmail}</div>
                        {int.batch && <span className="inline-block mt-0.5 text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">{int.batch}</span>}
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-black text-xs text-slate-900">{int.companyName}</div>
                        <div className="text-[11px] font-medium text-blue-600">{int.role || 'Junior Developer'}</div>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600 font-medium">
                        {new Date(int.interviewDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-slate-600">
                        {int.interviewMode}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {int.aptitudeRound?.attended && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              Apt: {int.aptitudeRound.result}
                            </span>
                          )}
                          {int.communicationRound?.attended && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                              Comm: {int.communicationRound.result}
                            </span>
                          )}
                          {int.technicalRound?.attended && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                              Tech: {int.technicalRound.result}
                            </span>
                          )}
                          {int.hrRound?.attended && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              HR: {int.hrRound.result}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusBadge(int.overallStatus)}`}>
                          {int.overallStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button 
                          onClick={() => setSelectedInterview(int)}
                          className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white transition shadow-sm"
                          title="View Round Questions"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-5 py-8 text-center text-slate-400 text-xs">
                      No interview experience logs found matching selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="text-xs font-bold text-slate-400">
              Page <span className="text-slate-700">{currentPage}</span> of <span className="text-slate-700">{totalPages || 1}</span>
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </SurfaceCard>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3 TABLE: DAILY TASK LOGS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'tasks' && (
        <SurfaceCard className="overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-white flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Student Daily Practice & Task Logs</h3>
            <p className="text-xs font-medium text-slate-500">
              Total entries: <span className="font-bold text-slate-700">{taskLogs.length}</span>
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead className="bg-[#f8fafc] border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Candidate</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Topic / Company</th>
                  <th className="px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Task Work Process</th>
                  <th className="px-5 py-3 text-right text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-12 text-center">
                      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
                    </td>
                  </tr>
                ) : paginatedList.length > 0 ? (
                  paginatedList.map(task => (
                    <tr key={task._id} className="border-b border-slate-50 hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3">
                        <div className="font-bold text-xs text-slate-900">{task.studentName}</div>
                        <div className="text-[10px] text-slate-400">{task.studentEmail}</div>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600 font-medium">
                        {new Date(task.date).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-xs font-bold text-slate-800">
                        {task.companyApply || 'Daily Practice'}
                      </td>
                      <td className="px-5 py-3 max-w-[280px]">
                        <div className="text-xs text-slate-600 truncate" title={task.taskWorkProcess}>
                          {task.taskWorkProcess}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button 
                          onClick={() => setSelectedTask(task)}
                          className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white transition shadow-sm"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-5 py-8 text-center text-slate-400 text-xs">
                      No daily task logs recorded matching selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="text-xs font-bold text-slate-400">
              Page <span className="text-slate-700">{currentPage}</span> of <span className="text-slate-700">{totalPages || 1}</span>
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </SurfaceCard>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: APPLICATION DETAIL */}
      {/* ---------------------------------------------------- */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-slate-900">{selectedApp.companyName}</h3>
                <p className="text-xs font-bold text-blue-600">{selectedApp.jobRole || 'Software Trainee'}</p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Candidate</span>
                  <span className="font-bold text-slate-800">{selectedApp.studentName} ({selectedApp.studentEmail})</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Applied Date</span>
                  <span className="font-bold text-slate-800">{new Date(selectedApp.applyDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* HR Information */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 block">HR / Recruiter Details</span>
                <div className="font-bold text-slate-800">{selectedApp.hrDetails?.name || 'N/A'}</div>
                {selectedApp.hrDetails?.email && <div className="text-blue-600">Email: {selectedApp.hrDetails.email}</div>}
                {selectedApp.hrDetails?.phone && <div className="text-slate-600">Phone: {selectedApp.hrDetails.phone}</div>}
                {selectedApp.hrDetails?.linkedin && (
                  <a href={selectedApp.hrDetails.linkedin} target="_blank" rel="noreferrer" className="text-blue-600 underline block">
                    LinkedIn Profile
                  </a>
                )}
              </div>

              {selectedApp.notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="text-[10px] font-bold uppercase text-amber-800 block mb-1">Notes</span>
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedApp.notes}</p>
                </div>
              )}

              {selectedApp.jobLink && (
                <a 
                  href={selectedApp.jobLink} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-1.5 font-bold text-blue-600 hover:underline"
                >
                  <ExternalLink size={13} />
                  <span>View Original Job Posting</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: INTERVIEW DETAIL */}
      {/* ---------------------------------------------------- */}
      {selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden my-8">
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-slate-900">{selectedInterview.companyName} - Interview Experience</h3>
                <p className="text-xs text-slate-500">Candidate: {selectedInterview.studentName} ({selectedInterview.batch || 'Batch'})</p>
              </div>
              <button onClick={() => setSelectedInterview(null)} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400">✕</button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Role</span>
                  <span className="font-bold text-slate-800">{selectedInterview.role || 'Junior Developer'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Interview Date & Mode</span>
                  <span className="font-bold text-slate-800">{new Date(selectedInterview.interviewDate).toLocaleDateString()} ({selectedInterview.interviewMode})</span>
                </div>
              </div>

              {/* Aptitude Round */}
              {selectedInterview.aptitudeRound?.attended && (
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-amber-900 uppercase">📝 Aptitude Round ({selectedInterview.aptitudeRound.result})</span>
                    <span className="text-[10px] font-bold text-amber-700">Platform: {selectedInterview.aptitudeRound.platformOrMode || 'Online'}</span>
                  </div>
                  {selectedInterview.aptitudeRound.topicsCovered && (
                    <p className="text-slate-700"><strong>Topics:</strong> {selectedInterview.aptitudeRound.topicsCovered}</p>
                  )}
                  {selectedInterview.aptitudeRound.questionsAsked && (
                    <div className="bg-white p-2.5 rounded-lg border border-amber-100 whitespace-pre-wrap text-slate-700">
                      <strong>Questions Asked:</strong><br />{selectedInterview.aptitudeRound.questionsAsked}
                    </div>
                  )}
                </div>
              )}

              {/* Communication Round */}
              {selectedInterview.communicationRound?.attended && (
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
                  <span className="font-black text-purple-900 uppercase block">🗣️ Communication Round ({selectedInterview.communicationRound.result})</span>
                  {selectedInterview.communicationRound.questionsAsked && (
                    <div className="bg-white p-2.5 rounded-lg border border-purple-100 whitespace-pre-wrap text-slate-700">
                      <strong>Discussion / Questions:</strong><br />{selectedInterview.communicationRound.questionsAsked}
                    </div>
                  )}
                </div>
              )}

              {/* Technical Round */}
              {selectedInterview.technicalRound?.attended && (
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                  <span className="font-black text-blue-900 uppercase block">💻 Technical Round ({selectedInterview.technicalRound.result})</span>
                  {selectedInterview.technicalRound.topicsCovered && (
                    <p className="text-slate-700"><strong>Topics Tested:</strong> {selectedInterview.technicalRound.topicsCovered}</p>
                  )}
                  {selectedInterview.technicalRound.questionsAsked && (
                    <div className="bg-white p-2.5 rounded-lg border border-blue-100 whitespace-pre-wrap text-slate-700">
                      <strong>Technical / Coding Challenges:</strong><br />{selectedInterview.technicalRound.questionsAsked}
                    </div>
                  )}
                </div>
              )}

              {/* HR Round */}
              {selectedInterview.hrRound?.attended && (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                  <span className="font-black text-emerald-900 uppercase block">🤝 HR Round ({selectedInterview.hrRound.result})</span>
                  {selectedInterview.hrRound.questionsAsked && (
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-100 whitespace-pre-wrap text-slate-700">
                      <strong>Discussion:</strong><br />{selectedInterview.hrRound.questionsAsked}
                    </div>
                  )}
                </div>
              )}

              {/* Learnings */}
              {(selectedInterview.overallExperience || selectedInterview.tipsAndLearnings) && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  {selectedInterview.overallExperience && (
                    <p className="text-slate-700"><strong>Experience:</strong> {selectedInterview.overallExperience}</p>
                  )}
                  {selectedInterview.tipsAndLearnings && (
                    <p className="text-indigo-900 font-semibold">💡 <strong>Advice / Learnings:</strong> {selectedInterview.tipsAndLearnings}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: TASK DETAIL */}
      {/* ---------------------------------------------------- */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-slate-900">Task Log Details</h3>
                <p className="text-xs text-slate-500">{selectedTask.studentName}</p>
              </div>
              <button onClick={() => setSelectedTask(null)} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400">✕</button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <div className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold">
                <span>Date: {new Date(selectedTask.date).toLocaleDateString()}</span>
                <span>{selectedTask.companyApply}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 whitespace-pre-wrap text-slate-700 leading-relaxed">
                {selectedTask.taskWorkProcess}
              </div>
              {selectedTask.remarks && (
                <p className="text-slate-500 italic">Remarks: {selectedTask.remarks}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
