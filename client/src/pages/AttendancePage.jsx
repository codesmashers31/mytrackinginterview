import React, { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard, StatusBadge, SectionTabs } from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import { Calendar, Plus, Check, X, Clock, FileText, TrendingUp, Download } from 'lucide-react';

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

  // Fetch all SPL students
  const fetchStudents = async () => {
    try {
      const res = await fetch(buildApiUrl('/spl-registration'), {
        headers: { ...authHeaders() }
      });
      if (!res.ok) throw new Error('Failed to load students');
      const data = await res.json();
      setStudents(data);
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
    }
  }, [activeTab, selectedDate, startDate, endDate]);

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

  const getAttendancePercentage = (student) => {
    if (!summary || !summary.byStudent[student._id]) return 0;
    const data = summary.byStudent[student._id];
    return Math.round((data.Present / data.total) * 100);
  };

  return (
    <AppShell
      title="Attendance Management"
      subtitle="Track and manage SPL class student attendance day-wise"
      searchPlaceholder="Search students or dates"
    >
      <SectionTabs
        items={[
          {
            label: 'Daily Attendance',
            active: activeTab === 'daily',
            onClick: () => setActiveTab('daily')
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

      {/* Daily Attendance Tab */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          <SurfaceCard className="p-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-blue-600" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="crm-input"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary stats */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="crm-surface p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {attendance.filter(a => a.status === 'Present').length}
                    </div>
                    <div className="text-sm text-slate-600">Present</div>
                  </div>
                  <div className="crm-surface p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {attendance.filter(a => a.status === 'Absent').length}
                    </div>
                    <div className="text-sm text-slate-600">Absent</div>
                  </div>
                  <div className="crm-surface p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {attendance.filter(a => a.status === 'Late').length}
                    </div>
                    <div className="text-sm text-slate-600">Late</div>
                  </div>
                  <div className="crm-surface p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {attendance.filter(a => a.status === 'Leave').length}
                    </div>
                    <div className="text-sm text-slate-600">Leave</div>
                  </div>
                </div>

                {/* Bulk actions for unmarked */}
                {unmarked.length > 0 && (
                  <div className="border-t border-slate-200 pt-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {unmarked.length} students not marked
                        </p>
                        <p className="text-sm text-slate-500">Quick mark all:</p>
                      </div>
                      <div className="flex gap-2">
                        {STATUS_OPTIONS.map(status => (
                          <button
                            key={status}
                            onClick={() => handleBulkMark(status)}
                            className="crm-button crm-button-secondary text-xs"
                          >
                            All {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Marked attendance table */}
                <div className="border-t border-slate-200 pt-4">
                  <h3 className="mb-4 font-semibold text-slate-900">Marked Attendance</h3>
                  {attendance.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="px-4 py-2 text-left font-semibold text-slate-700">
                              Student
                            </th>
                            <th className="px-4 py-2 text-center font-semibold text-slate-700">
                              Status
                            </th>
                            <th className="px-4 py-2 text-center font-semibold text-slate-700">
                              Check In
                            </th>
                            <th className="px-4 py-2 text-center font-semibold text-slate-700">
                              Check Out
                            </th>
                            <th className="px-4 py-2 text-center font-semibold text-slate-700">
                              Total Hrs
                            </th>
                            <th className="px-4 py-2 text-left font-semibold text-slate-700">
                              Remarks
                            </th>
                            <th className="px-4 py-2 text-center font-semibold text-slate-700">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendance.map(record => (
                            <tr key={record._id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="px-4 py-3 text-slate-900">
                                <div>{record.studentName}</div>
                                <div className="text-xs text-slate-500">{record.studentEmail}</div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <StatusBadge
                                  status={record.status}
                                  tone={STATUS_COLORS[record.status] || 'info'}
                                />
                              </td>
                              <td className="px-4 py-3 text-center text-slate-600">
                                {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                              </td>
                              <td className="px-4 py-3 text-center text-slate-600">
                                {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                              </td>
                              <td className="px-4 py-3 text-center font-semibold text-slate-700">
                                {record.totalHours ? record.totalHours + 'h' : '-'}
                              </td>
                              <td className="px-4 py-3 text-slate-600">{record.remarks}</td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => handleDeleteAttendance(record._id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete"
                                >
                                  <X size={18} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="py-4 text-center text-slate-500">No attendance marked for this date</p>
                  )}
                </div>

                {/* Unmarked students */}
                {unmarked.length > 0 && (
                  <div className="border-t border-slate-200 pt-4">
                    <h3 className="mb-4 font-semibold text-slate-900">
                      Unmarked Students ({unmarked.length})
                    </h3>
                    <div className="space-y-3">
                      {unmarked.map(student => (
                        <div
                          key={student._id}
                          className="crm-surface flex items-center justify-between p-4"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{student.name}</p>
                            <p className="text-sm text-slate-600">{student.email}</p>
                          </div>
                          <div className="flex flex-col gap-2 md:flex-row">
                            <input
                              type="text"
                              placeholder="Remarks (optional)"
                              value={remarks[student._id] || ''}
                              onChange={e => handleRemarksChange(student._id, e.target.value)}
                              className="crm-input text-xs"
                            />
                            <div className="flex gap-2">
                              {STATUS_OPTIONS.map(status => (
                                <button
                                  key={status}
                                  onClick={() => handleMarkAttendance(student._id, status)}
                                  className={`crm-button text-xs ${
                                    status === 'Present'
                                      ? 'crm-button-success'
                                      : status === 'Absent'
                                        ? 'crm-button-error'
                                        : status === 'Late'
                                          ? 'crm-button-warning'
                                          : 'crm-button-secondary'
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

      {/* Summary Report Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          <SurfaceCard className="p-6">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700">From:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="crm-input"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700">To:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="crm-input"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : summary ? (
              <div className="space-y-6">
                {/* Overall stats */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="crm-surface p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {summary.byStatus.Present}
                    </div>
                    <div className="text-sm text-slate-600">Total Present</div>
                  </div>
                  <div className="crm-surface p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{summary.byStatus.Absent}</div>
                    <div className="text-sm text-slate-600">Total Absent</div>
                  </div>
                  <div className="crm-surface p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{summary.byStatus.Late}</div>
                    <div className="text-sm text-slate-600">Total Late</div>
                  </div>
                  <div className="crm-surface p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{summary.byStatus.Leave}</div>
                    <div className="text-sm text-slate-600">Total Leave</div>
                  </div>
                </div>

                {/* Student-wise report */}
                <div className="border-t border-slate-200 pt-6">
                  <h3 className="mb-4 font-semibold text-slate-900">Student-wise Summary</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="px-4 py-2 text-left font-semibold text-slate-700">
                            Student
                          </th>
                          <th className="px-4 py-2 text-center font-semibold text-slate-700">
                            Present
                          </th>
                          <th className="px-4 py-2 text-center font-semibold text-slate-700">
                            Absent
                          </th>
                          <th className="px-4 py-2 text-center font-semibold text-slate-700">
                            Late
                          </th>
                          <th className="px-4 py-2 text-center font-semibold text-slate-700">
                            Leave
                          </th>
                          <th className="px-4 py-2 text-center font-semibold text-slate-700">
                            Total
                          </th>
                          <th className="px-4 py-2 text-center font-semibold text-slate-700">
                            % Present
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.values(summary.byStudent).map((data, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3 text-slate-900">{data.name}</td>
                            <td className="px-4 py-3 text-center text-green-600">
                              {data.Present}
                            </td>
                            <td className="px-4 py-3 text-center text-red-600">{data.Absent}</td>
                            <td className="px-4 py-3 text-center text-yellow-600">{data.Late}</td>
                            <td className="px-4 py-3 text-center text-blue-600">{data.Leave}</td>
                            <td className="px-4 py-3 text-center font-semibold text-slate-900">
                              {data.total}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold">
                              <div className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                                {Math.round((data.Present / data.total) * 100)}%
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </SurfaceCard>
        </div>
      )}

      {/* Student History Tab */}
      {activeTab === 'student' && (
        <div className="space-y-6">
          <SurfaceCard className="p-6">
            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Student
                </label>
                <select
                  value={selectedStudent || ''}
                  onChange={e => {
                    setSelectedStudent(e.target.value);
                    if (e.target.value) {
                      fetchStudentAttendance(e.target.value);
                    }
                  }}
                  className="crm-input"
                >
                  <option value="">Choose a student...</option>
                  {students.map(student => (
                    <option key={student._id} value={student._id}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-700">From:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="crm-input"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-700">To:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="crm-input"
                  />
                </div>
              </div>
            </div>

            {selectedStudent && (
              <div className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                  </div>
                ) : (
                  <>
                    {/* Attendance stats for this student */}
                    {studentAttendance.length > 0 && (
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
                        <div className="crm-surface p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {studentAttendance.filter(a => a.status === 'Present').length}
                          </div>
                          <div className="text-sm text-slate-600">Present</div>
                        </div>
                        <div className="crm-surface p-4 text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {studentAttendance.filter(a => a.status === 'Absent').length}
                          </div>
                          <div className="text-sm text-slate-600">Absent</div>
                        </div>
                        <div className="crm-surface p-4 text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {studentAttendance.filter(a => a.status === 'Late').length}
                          </div>
                          <div className="text-sm text-slate-600">Late</div>
                        </div>
                        <div className="crm-surface p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {studentAttendance.filter(a => a.status === 'Leave').length}
                          </div>
                          <div className="text-sm text-slate-600">Leave</div>
                        </div>
                      </div>
                    )}

                    {studentAttendance.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="px-4 py-2 text-left font-semibold text-slate-700">
                                Date
                              </th>
                              <th className="px-4 py-2 text-left font-semibold text-slate-700">
                                Status
                              </th>
                              <th className="px-4 py-2 text-left font-semibold text-slate-700">
                                Remarks
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentAttendance.map(record => (
                              <tr key={record._id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-4 py-3 text-slate-900">
                                  {new Date(record.date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3">
                                  <StatusBadge
                                    status={record.status}
                                    tone={STATUS_COLORS[record.status]}
                                  />
                                </td>
                                <td className="px-4 py-3 text-slate-600">{record.remarks}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="py-4 text-center text-slate-500">No attendance records found</p>
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
