import React, { useEffect, useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard, StatusBadge, SectionTabs } from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import { Calendar, Plus, Check, X, Clock, FileText, TrendingUp, Download, Search, CheckCircle2, XCircle, User, MapPin, Trash2, Filter, AlertCircle } from 'lucide-react';

const STATUS_OPTIONS = ['Present', 'Absent', 'Late', 'Leave'];
const STATUS_COLORS = {
  Present: 'success',
  Absent: 'error',
  Late: 'warning',
  Leave: 'info',
  'In Progress': 'warning'
};

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markedAttendance, setMarkedAttendance] = useState({});
  const [remarks, setRemarks] = useState({});
  const [unmarked, setUnmarked] = useState([]);
  const [summary, setSummary] = useState(null);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentAttendance, setStudentAttendance] = useState([]);

  // Leave management states
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [leaveActiveTab, setLeaveActiveTab] = useState('Pending'); // 'Pending' or 'History'
  const [leaveSearchQuery, setLeaveSearchQuery] = useState('');
  const [submittingLeaveId, setSubmittingLeaveId] = useState(null);
  const [leaveRemarks, setLeaveRemarks] = useState({});

  const getInitials = (name) => {
    return (name || '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  // Fetch active students from the unified collection
  const fetchStudents = async () => {
    try {
      const res = await fetch(buildApiUrl('/students?all=true'), {
        headers: { ...authHeaders() }
      });
      if (!res.ok) throw new Error('Failed to load students');
      const data = await res.json();
      
      // Filter out inactive students and keep only SPL enrolled ones
      const activeStudents = data.filter(student => 
        !/^inactive/i.test(student.currentStatus || '') && 
        student.enrollments && 
        student.enrollments.includes('SPL')
      );

      // Fetch direct SPL registrations too
      const splRes = await fetch(buildApiUrl('/spl-registration'), {
        headers: { ...authHeaders() }
      });
      if (splRes.ok) {
        const splData = await splRes.json();
        const activeSpls = splData.filter(student => !/^inactive/i.test(student.status || ''));
        const mappedSpls = activeSpls.map(s => ({
          _id: s._id,
          name: s.name,
          email: s.email,
          batch: s.batch || s.passedOutYear || '',
          enrollments: ['SPL']
        }));
        
        const combined = [...activeStudents, ...mappedSpls];
        combined.sort((a, b) => a.name.localeCompare(b.name));
        setStudents(combined);
      } else {
        setStudents(activeStudents);
      }
    } catch (err) {
      toast.error('Could not load students');
    }
  };

  // Fetch attendance for selected date
  const fetchDailyAttendance = async () => {
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl(`/attendance/date/${selectedDate}`), {
        headers: { ...authHeaders() }
      });
      if (!res.ok) throw new Error('Failed to load attendance');
      const data = await res.json();
      setAttendance(data);

      // Create marked attendance map
      const marked = {};
      data.forEach(record => {
        marked[record.studentId] = record;
      });
      setMarkedAttendance(marked);

      // Fetch unmarked students
      const unmarkedRes = await fetch(buildApiUrl(`/attendance/unmarked/${selectedDate}`), {
        headers: { ...authHeaders() }
      });
      if (unmarkedRes.ok) {
        const unmarkedData = await unmarkedRes.json();
        setUnmarked(unmarkedData);
      }
    } catch (err) {
      toast.error('Could not load attendance');
    } finally {
      setLoading(false);
    }
  };

  // Fetch summary for date range
  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        buildApiUrl(`/attendance/summary/range?startDate=${startDate}&endDate=${endDate}`),
        { headers: { ...authHeaders() } }
      );
      if (!res.ok) throw new Error('Failed to load summary');
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      toast.error('Could not load summary');
    } finally {
      setLoading(false);
    }
  };

  // Fetch student attendance history
  const fetchStudentAttendance = async (studentId) => {
    setLoading(true);
    try {
      const res = await fetch(
        buildApiUrl(
          `/attendance/student/${studentId}?startDate=${startDate}&endDate=${endDate}`
        ),
        { headers: { ...authHeaders() } }
      );
      if (!res.ok) throw new Error('Failed to load student attendance');
      const data = await res.json();
      setStudentAttendance(data);
    } catch (err) {
      toast.error('Could not load student attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailyAttendance();
    } else if (activeTab === 'summary') {
      fetchSummary();
    } else if (activeTab === 'leaves') {
      fetchLeaveRequests();
    }
  }, [activeTab, selectedDate, startDate, endDate]);

  const fetchLeaveRequests = async () => {
    setLoadingLeaves(true);
    try {
      const res = await fetch(buildApiUrl('/leaves'), {
        headers: authHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setLeaveRequests(data);
      } else {
        toast.error('Failed to fetch leave requests');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching requests');
    } finally {
      setLoadingLeaves(false);
    }
  };

  const handleReviewLeave = async (id, status) => {
    const reviewerRemarks = leaveRemarks[id] || '';
    setSubmittingLeaveId(id);
    try {
      const res = await fetch(buildApiUrl(`/leaves/${id}/status`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({ status, reviewerRemarks })
      });

      if (res.ok) {
        toast.success(`Request ${status.toLowerCase()} successfully!`);
        fetchLeaveRequests();
      } else {
        const errData = await res.json();
        toast.error(errData.message || 'Failed to review request');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error reviewing request');
    } finally {
      setSubmittingLeaveId(null);
    }
  };

  const handleLeaveRemarksChange = (id, val) => {
    setLeaveRemarks(prev => ({
      ...prev,
      [id]: val
    }));
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/50';
      default:
        return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/50';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Mark attendance for a student
  const handleMarkAttendance = async (studentId, status) => {
    try {
      const res = await fetch(buildApiUrl('/attendance'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({
          studentId,
          date: selectedDate,
          status,
          remarks: remarks[studentId] || ''
        })
      });

      if (!res.ok) throw new Error('Failed to mark attendance');
      const data = await res.json();
      setMarkedAttendance(prev => ({
        ...prev,
        [studentId]: data
      }));

      // Remove from unmarked list
      setUnmarked(prev => prev.filter(s => s._id !== studentId));
      toast.success(`Marked ${status} for student`);
    } catch (err) {
      toast.error('Could not mark attendance');
    }
  };

  // Bulk mark attendance
  const handleBulkMark = async (status) => {
    try {
      const unmarkedIds = unmarked.map(s => s._id);
      if (unmarkedIds.length === 0) {
        toast.info('No unmarked students');
        return;
      }

      const attendanceRecords = unmarkedIds.map(studentId => ({
        studentId,
        date: selectedDate,
        status,
        remarks: remarks[studentId] || ''
      }));

      const res = await fetch(buildApiUrl('/attendance/bulk'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({ attendanceRecords })
      });

      if (!res.ok) throw new Error('Bulk mark failed');
      toast.success(`Marked ${unmarkedIds.length} students as ${status}`);
      fetchDailyAttendance();
    } catch (err) {
      toast.error('Bulk mark failed');
    }
  };

  // Update remarks
  const handleRemarksChange = (studentId, value) => {
    setRemarks(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  // Delete attendance record
  const handleDeleteAttendance = async (attendanceId) => {
    if (!window.confirm('Delete this attendance record?')) return;

    try {
      const res = await fetch(buildApiUrl(`/attendance/${attendanceId}`), {
        method: 'DELETE',
        headers: { ...authHeaders() }
      });

      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Attendance deleted');
      fetchDailyAttendance();
    } catch (err) {
      toast.error('Could not delete attendance');
    }
  };

  const studentsById = useMemo(() => {
    const map = {};
    students.forEach(s => { map[s._id] = s; });
    return map;
  }, [students]);

  const getStudentBatch = (studentId) => {
    const student = studentsById[studentId];
    if (!student) return '';
    return student.batch || student.passedOutYear || '';
  };

  const getAttendancePercentage = (student) => {
    if (!summary || !summary.byStudent[student._id]) return 0;
    const data = summary.byStudent[student._id];
    return Math.round((data.Present / data.total) * 100);
  };

  const exportDailyAttendance = () => {
    const exportData = students.map(student => {
      const record = attendance.find(a => a.studentId === student._id);
      let statusLetter = '';
      if (record) {
        if (record.status === 'Present') statusLetter = 'P';
        else if (record.status === 'Absent') statusLetter = 'A';
        else statusLetter = record.status;
      }

      return {
        'Date': selectedDate,
        'Tech Stack': 'MERN',
        'Trainer': '',
        'Student Name': student.name,
        'Batch': student.batch || student.passedOutYear || '',
        'Attendance (P/A)': statusLetter,
        'Remarks': record ? record.remarks || '' : '',
        'Module': '',
        'Topic Covered': '',
        'Timing Duration (Hrs)': '10 to 6'
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    XLSX.writeFile(wb, `Attendance_${selectedDate}.xlsx`);
    toast.success('Attendance exported to Excel');
  };

  return (
    <AppShell
      title="Attendance & Leaves"
      subtitle="Track and manage SPL class student attendance, daily check-ins, and leave requests"
      searchPlaceholder="Search students or dates"
    >
      <div className="mb-6">
        <SectionTabs
          items={[
            {
              label: 'Daily Attendance',
              active: activeTab === 'daily',
              onClick: () => setActiveTab('daily')
            },
            {
              label: 'Leave Requests',
              active: activeTab === 'leaves',
              onClick: () => setActiveTab('leaves')
            },
            {
              label: 'Summary Report',
              active: activeTab === 'summary',
              onClick: () => setActiveTab('summary')
            },
            {
              label: 'Student History',
              active: activeTab === 'student',
              onClick: () => setActiveTab('student')
            }
          ]}
        />
      </div>

      {/* Daily Attendance Tab */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          <SurfaceCard className="p-6 border border-slate-100 shadow-xs">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-2xs">
                  <Calendar size={18} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Selected Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="crm-input h-9 py-1 px-2 border-0 bg-transparent font-bold text-slate-700 focus:ring-0 cursor-pointer text-sm outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={exportDailyAttendance}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer"
              >
                <Download size={14} /> Export Excel
              </button>
            </div>

            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary stats */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-emerald-50/10 p-5 flex items-center gap-4 hover:scale-[1.01] transition duration-200">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-emerald-700">
                        {attendance.filter(a => a.status === 'Present').length}
                      </div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Present</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/60 to-rose-50/10 p-5 flex items-center gap-4 hover:scale-[1.01] transition duration-200">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
                      <XCircle size={20} />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-rose-700">
                        {attendance.filter(a => a.status === 'Absent').length}
                      </div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Absent</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/60 to-amber-50/10 p-5 flex items-center gap-4 hover:scale-[1.01] transition duration-200">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                      <Clock size={20} />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-amber-700">
                        {attendance.filter(a => a.status === 'Late').length}
                      </div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Late</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-blue-50/10 p-5 flex items-center gap-4 hover:scale-[1.01] transition duration-200">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-blue-700">
                        {attendance.filter(a => a.status === 'Leave').length}
                      </div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">On Leave</div>
                    </div>
                  </div>
                </div>

                {/* Bulk actions for unmarked */}
                {unmarked.length > 0 && (
                  <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Mark Action</h4>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">
                        {unmarked.length} students have not been marked for today.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map(status => (
                        <button
                          key={status}
                          onClick={() => handleBulkMark(status)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer shadow-3xs"
                        >
                          Mark all as {status}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Marked attendance table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Marked Attendance ({attendance.length})</h3>
                  </div>

                  {attendance.length > 0 ? (
                    <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-2xs">
                      <table className="min-w-full divide-y divide-slate-100 text-left">
                        <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                          <tr>
                            <th className="px-4 py-3">Student Info</th>
                            <th className="px-4 py-3">Batch Info</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-center">Check-In</th>
                            <th className="px-4 py-3 text-center">Check-Out</th>
                            <th className="px-4 py-3 text-center">Hours</th>
                            <th className="px-4 py-3">Remarks</th>
                            <th className="px-4 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
                          {attendance.map(record => (
                            <tr key={record._id} className="hover:bg-slate-50/50 transition">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[11px] font-black text-slate-700 uppercase">
                                    {getInitials(record.studentName)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-800 leading-snug">{record.studentName}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">{record.studentEmail}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-500">
                                {getStudentBatch(record.studentId) ? (
                                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                    {getStudentBatch(record.studentId)}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${getStatusStyle(record.status)}`}>
                                  {record.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center text-slate-500">
                                {record.checkInTime ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-100 rounded-lg py-1 px-1.5">
                                    <MapPin size={11} className="text-emerald-500" />
                                    {new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center text-slate-500">
                                {record.checkOutTime ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-100 rounded-lg py-1 px-1.5">
                                    <Clock size={11} className="text-amber-500" />
                                    {new Date(record.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-slate-800">
                                {record.totalHours ? `${record.totalHours.toFixed(1)} hrs` : <span className="text-slate-300">—</span>}
                              </td>
                              <td className="px-4 py-3 max-w-[200px] truncate text-slate-500 italic">
                                {record.remarks || <span className="text-slate-300">—</span>}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAttendance(record._id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                  title="Delete Record"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/20">
                      <Calendar size={22} className="text-slate-300 mb-2" />
                      <p className="text-xs font-semibold text-slate-400">No attendance marked for this date</p>
                    </div>
                  )}
                </div>

                {/* Unmarked students */}
                {unmarked.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Unmarked Students ({unmarked.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {unmarked.map(student => (
                        <div
                          key={student._id}
                          className="border border-slate-100 bg-white rounded-2xl p-4 flex flex-col justify-between gap-4 shadow-3xs"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-black text-blue-600 uppercase">
                                {getInitials(student.name)}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-800 leading-snug">{student.name}</h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">{student.email}</p>
                              </div>
                            </div>
                            {(student.batch || student.passedOutYear) && (
                              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                {student.batch || student.passedOutYear}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              placeholder="Remarks (optional)"
                              value={remarks[student._id] || ''}
                              onChange={e => handleRemarksChange(student._id, e.target.value)}
                              className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white"
                            />
                            <div className="flex gap-1.5">
                              {STATUS_OPTIONS.map(status => (
                                <button
                                  key={status}
                                  onClick={() => handleMarkAttendance(student._id, status)}
                                  className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition shadow-3xs cursor-pointer ${
                                    status === 'Present'
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                      : status === 'Absent'
                                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                        : status === 'Late'
                                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                  }`}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </SurfaceCard>
        </div>
      )}

      {/* Leave Requests Tab */}
      {activeTab === 'leaves' && (
        <div className="space-y-6">
          <SurfaceCard className="p-6 border border-slate-100 shadow-xs">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex gap-2">
                <button
                  onClick={() => setLeaveActiveTab('Pending')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                    leaveActiveTab === 'Pending' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/50'
                  }`}
                >
                  Pending Approval ({leaveRequests.filter(r => r.status === 'Pending').length})
                </button>
                <button
                  onClick={() => setLeaveActiveTab('History')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                    leaveActiveTab === 'History' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/50'
                  }`}
                >
                  Review History ({leaveRequests.filter(r => r.status !== 'Pending').length})
                </button>
              </div>

              <div className="relative w-full max-w-xs">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student or reason..."
                  value={leaveSearchQuery}
                  onChange={(e) => setLeaveSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {loadingLeaves ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : leaveRequests.filter(req => {
              const matchesTab = leaveActiveTab === 'Pending' ? req.status === 'Pending' : req.status !== 'Pending';
              const matchesSearch = 
                (req.studentName || '').toLowerCase().includes(leaveSearchQuery.toLowerCase()) ||
                (req.studentEmail || '').toLowerCase().includes(leaveSearchQuery.toLowerCase()) ||
                (req.reason || '').toLowerCase().includes(leaveSearchQuery.toLowerCase());
              return matchesTab && matchesSearch;
            }).length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-slate-50/20 border border-dashed border-slate-200 rounded-2xl">
                <FileText size={24} className="text-slate-300 mb-2" />
                <h3 className="text-xs font-bold text-slate-400">No requests found</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {leaveRequests
                  .filter(req => {
                    const matchesTab = leaveActiveTab === 'Pending' ? req.status === 'Pending' : req.status !== 'Pending';
                    const matchesSearch = 
                      (req.studentName || '').toLowerCase().includes(leaveSearchQuery.toLowerCase()) ||
                      (req.studentEmail || '').toLowerCase().includes(leaveSearchQuery.toLowerCase()) ||
                      (req.reason || '').toLowerCase().includes(leaveSearchQuery.toLowerCase());
                    return matchesTab && matchesSearch;
                  })
                  .map((req) => (
                    <div 
                      key={req._id} 
                      className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 shadow-3xs transition duration-200 ${
                        req.status === 'Pending' ? 'border-slate-100 bg-white' : 'border-slate-100 bg-slate-50/30'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-black text-indigo-600 uppercase">
                              {getInitials(req.studentName)}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-800 leading-snug">{req.studentName}</h3>
                              <p className="text-[10px] text-slate-400 mt-0.5">{req.studentEmail}</p>
                              {(req.studentBatch || req.studentYear) && (
                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10 mt-1">
                                  {req.studentBatch ? `${req.studentBatch}` : ''}
                                  {req.studentBatch && req.studentYear ? ` — ` : ''}
                                  {req.studentYear ? `${req.studentYear}` : ''}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
                              {req.type === 'Leave' ? <Calendar size={11} className="text-indigo-500" /> : <Clock size={11} className="text-cyan-500" />}
                              {req.type}
                            </span>
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${getStatusStyle(req.status)}`}>
                              {req.status}
                            </span>
                          </div>
                        </div>

                        {/* Date info block */}
                        <div className="p-3 bg-slate-50/80 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700">
                          {req.type === 'Leave' ? (
                            <div className="flex items-center gap-2">
                              <Calendar size={13} className="text-slate-450" />
                              <span>{formatDate(req.startDate)} – {formatDate(req.endDate)}</span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Calendar size={13} className="text-slate-450" />
                                <span>{formatDate(req.date)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium ml-5">
                                <Clock size={11} className="text-slate-400" />
                                <span>{req.startTime} – {req.endTime}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Reason */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Reason for absence</span>
                          <p className="text-xs text-slate-650 leading-relaxed font-medium bg-slate-50/30 rounded-xl p-2.5 border border-slate-100/50">
                            {req.reason}
                          </p>
                        </div>

                        {/* Approver remarks if reviewed */}
                        {req.status !== 'Pending' && (
                          <div className="border-t border-slate-100/80 pt-3 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Review Feedback</span>
                            <div className="text-xs text-slate-600 bg-slate-50/40 rounded-xl p-2.5 border border-slate-100/50">
                              <p className="font-semibold text-slate-700">Reviewed By: {req.reviewerName}</p>
                              {req.reviewerRemarks && (
                                <p className="mt-1 text-slate-500 italic">“ {req.reviewerRemarks} ”</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Approval action block */}
                      {req.status === 'Pending' && (
                        <div className="pt-3 border-t border-slate-100 space-y-3">
                          <input
                            type="text"
                            placeholder="Add remarks or justification (optional)..."
                            value={leaveRemarks[req._id] || ''}
                            onChange={(e) => handleLeaveRemarksChange(req._id, e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={submittingLeaveId === req._id}
                              onClick={() => handleReviewLeave(req._id, 'Approved')}
                              className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold transition shadow-3xs cursor-pointer"
                            >
                              <Check size={13} /> Approve
                            </button>
                            <button
                              type="button"
                              disabled={submittingLeaveId === req._id}
                              onClick={() => handleReviewLeave(req._id, 'Rejected')}
                              className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl text-xs font-bold transition shadow-3xs cursor-pointer"
                            >
                              <X size={13} /> Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </SurfaceCard>
        </div>
      )}

      {/* Summary Report Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          <SurfaceCard className="p-6 border border-slate-100 shadow-xs">
            <div className="mb-6 flex flex-wrap items-center gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">From Date:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="crm-input h-9 px-3 text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">To Date:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="crm-input h-9 px-3 text-xs"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : summary ? (
              <div className="space-y-6">
                {/* Summary aggregate stats */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="crm-surface p-4 text-center rounded-2xl border border-slate-100">
                    <div className="text-2xl font-black text-emerald-600">
                      {summary.byStatus.Present}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total Present</div>
                  </div>
                  <div className="crm-surface p-4 text-center rounded-2xl border border-slate-100">
                    <div className="text-2xl font-black text-rose-600">{summary.byStatus.Absent}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total Absent</div>
                  </div>
                  <div className="crm-surface p-4 text-center rounded-2xl border border-slate-100">
                    <div className="text-2xl font-black text-amber-600">{summary.byStatus.Late}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total Late</div>
                  </div>
                  <div className="crm-surface p-4 text-center rounded-2xl border border-slate-100">
                    <div className="text-2xl font-black text-blue-600">{summary.byStatus.Leave}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total On Leave</div>
                  </div>
                </div>

                {/* Detailed Table */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Student-wise Performance</h3>
                  <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-2xs bg-white">
                    <table className="min-w-full divide-y divide-slate-100 text-left">
                      <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3">Student Name</th>
                          <th className="px-4 py-3 text-center">Present</th>
                          <th className="px-4 py-3 text-center">Absent</th>
                          <th className="px-4 py-3 text-center">Late</th>
                          <th className="px-4 py-3 text-center">Leave</th>
                          <th className="px-4 py-3 text-center">Total days</th>
                          <th className="px-4 py-3 text-center">% Ratio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
                        {Object.values(summary.byStudent).map((data, idx) => {
                          const percentage = Math.round((data.Present / data.total) * 100);
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 transition">
                              <td className="px-4 py-3 font-bold text-slate-800">{data.name}</td>
                              <td className="px-4 py-3 text-center text-emerald-600 font-bold">{data.Present}</td>
                              <td className="px-4 py-3 text-center text-rose-600 font-bold">{data.Absent}</td>
                              <td className="px-4 py-3 text-center text-amber-600 font-bold">{data.Late}</td>
                              <td className="px-4 py-3 text-center text-blue-600 font-bold">{data.Leave}</td>
                              <td className="px-4 py-3 text-center font-bold text-slate-900">{data.total}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${
                                  percentage >= 75
                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                                    : percentage >= 50
                                      ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
                                      : 'bg-rose-50 text-rose-700 ring-rose-600/20'
                                }`}>
                                  {percentage}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/20">
                <TrendingUp size={22} className="text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-400">Set date range and query attendance summary</p>
              </div>
            )}
          </SurfaceCard>
        </div>
      )}

      {/* Student History Tab */}
      {activeTab === 'student' && (
        <div className="space-y-6">
          <SurfaceCard className="p-6 border border-slate-100 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 pb-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Select SPL Student</label>
                <select
                  value={selectedStudent || ''}
                  onChange={e => {
                    setSelectedStudent(e.target.value);
                    if (e.target.value) {
                      fetchStudentAttendance(e.target.value);
                    }
                  }}
                  className="crm-input w-full h-10 px-3 text-xs"
                >
                  <option value="">Choose student...</option>
                  {students.map(student => (
                    <option key={student._id} value={student._id}>
                      {student.name} ({student.email}){student.batch ? ` — ${student.batch}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 self-end">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">From Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="crm-input h-10 px-3 text-xs w-full"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">To Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="crm-input h-10 px-3 text-xs w-full"
                  />
                </div>
              </div>
            </div>

            {selectedStudent && (
              <div className="space-y-6 pt-4">
                {loading ? (
                  <div className="flex min-h-[250px] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                  </div>
                ) : (
                  <>
                    {/* Stats for single student */}
                    {studentAttendance.length > 0 && (
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="crm-surface p-4 text-center rounded-2xl border border-slate-100">
                          <div className="text-2xl font-black text-emerald-600">
                            {studentAttendance.filter(a => a.status === 'Present').length}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Days Present</div>
                        </div>
                        <div className="crm-surface p-4 text-center rounded-2xl border border-slate-100">
                          <div className="text-2xl font-black text-rose-600">
                            {studentAttendance.filter(a => a.status === 'Absent').length}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Days Absent</div>
                        </div>
                        <div className="crm-surface p-4 text-center rounded-2xl border border-slate-100">
                          <div className="text-2xl font-black text-amber-600">
                            {studentAttendance.filter(a => a.status === 'Late').length}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Days Late</div>
                        </div>
                        <div className="crm-surface p-4 text-center rounded-2xl border border-slate-100">
                          <div className="text-2xl font-black text-blue-600">
                            {studentAttendance.filter(a => a.status === 'Leave').length}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Days On Leave</div>
                        </div>
                      </div>
                    )}

                    {studentAttendance.length > 0 ? (
                      <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-2xs bg-white">
                        <table className="min-w-full divide-y divide-slate-100 text-left">
                          <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                            <tr>
                              <th className="px-4 py-3">Marked Date</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Remarks / Reason</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
                            {studentAttendance.map(record => (
                              <tr key={record._id} className="hover:bg-slate-50/50 transition">
                                <td className="px-4 py-3 font-bold text-slate-800">
                                  {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${getStatusStyle(record.status)}`}>
                                    {record.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-500 italic">
                                  {record.remarks || <span className="text-slate-300">—</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/20">
                        <AlertCircle size={22} className="text-slate-300 mb-2" />
                        <p className="text-xs font-semibold text-slate-450">No attendance records found in this range</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </SurfaceCard>
        </div>
      )}
    </AppShell>
  );
}
