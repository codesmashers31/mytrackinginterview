import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard, StatusBadge, SectionTabs } from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import { 
  MapPin, 
  LogOut, 
  CheckCircle, 
  Calendar, 
  Clock, 
  AlertCircle, 
  FileText, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';

export default function StudentAttendance() {
  const [activeTab, setActiveTab] = useState('checkin'); // 'checkin' or 'leaves'
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Leaves management states
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Form states
  const [leaveType, setLeaveType] = useState('Leave'); // 'Leave' or 'Permission'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveDate, setLeaveDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchTodayAttendance();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeTab === 'leaves') {
      fetchRequests();
    }
  }, [activeTab]);

  const fetchTodayAttendance = async () => {
    try {
      const res = await fetch(buildApiUrl('/attendance/today'), {
        headers: { ...authHeaders() }
      });
      if (res.ok) {
        const data = await res.json();
        setAttendance(data.attendance);
      }
    } catch (err) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch(buildApiUrl('/leaves/my'), {
        headers: authHeaders()
      });
      if (res.status === 401) {
        toast.error('Session expired. Please log in again.');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      } else {
        toast.error('Failed to fetch request history');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error loading request history');
    } finally {
      setLoadingRequests(false);
    }
  };

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            reject(new Error('Failed to get location. Please ensure location services are enabled.'));
          },
          { enableHighAccuracy: true }
        );
      }
    });
  };

  const handleCheckIn = async () => {
    setLocationLoading(true);
    try {
      const coords = await getLocation();
      const res = await fetch(buildApiUrl('/attendance/check-in'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify(coords)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Check-in failed');
      
      setAttendance(data);
      toast.success('Checked in successfully!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLocationLoading(true);
    try {
      const coords = await getLocation();
      const res = await fetch(buildApiUrl('/attendance/check-out'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify(coords)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Check-out failed');
      
      setAttendance(data);
      toast.success(`Checked out! Total Hours: ${data.totalHours}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error('Please specify a reason');
      return;
    }

    const payload = { type: leaveType, reason: reason.trim() };

    if (leaveType === 'Leave') {
      if (!startDate || !endDate) {
        toast.error('Please select both start and end dates');
        return;
      }
      if (new Date(endDate) < new Date(startDate)) {
        toast.error('End Date cannot be earlier than Start Date');
        return;
      }
      payload.startDate = startDate;
      payload.endDate = endDate;
    } else {
      if (!leaveDate || !startTime || !endTime) {
        toast.error('Please select date, start time, and end time');
        return;
      }
      payload.date = leaveDate;
      payload.startTime = startTime;
      payload.endTime = endTime;
    }

    setSubmittingLeave(true);
    try {
      const res = await fetch(buildApiUrl('/leaves'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(`${leaveType} request submitted successfully!`);
        // Reset form
        setStartDate('');
        setEndDate('');
        setLeaveDate('');
        setStartTime('');
        setEndTime('');
        setReason('');
        // Refresh history list
        fetchRequests();
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || 'Failed to submit request');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error submitting request');
    } finally {
      setSubmittingLeave(false);
    }
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

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AppShell
      title="My Attendance"
      subtitle="Track check-ins, leaves, and permission requests."
    >
      <SectionTabs
        items={[
          {
            label: 'Check In / Out',
            active: activeTab === 'checkin',
            onClick: () => setActiveTab('checkin')
          },
          {
            label: 'Request Leave / Permission',
            active: activeTab === 'leaves',
            onClick: () => setActiveTab('leaves')
          }
        ]}
      />

      {/* Check In / Out Tab */}
      {activeTab === 'checkin' && (
        <div className="mx-auto max-w-2xl mt-8">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : (
            <SurfaceCard className="p-8 shadow-sm">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="mb-2 text-slate-500 font-medium">
                  {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div className="text-5xl font-bold text-slate-800 tracking-tight mb-8">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>

                <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-8">
                  <div className="flex justify-around items-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Check In</div>
                      <div className="text-2xl font-bold text-slate-800">
                        {attendance?.checkInTime ? formatTime(attendance.checkInTime) : '--:--'}
                      </div>
                    </div>
                    <div className="h-16 w-px bg-slate-200"></div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Check Out</div>
                      <div className="text-2xl font-bold text-slate-800">
                        {attendance?.checkOutTime ? formatTime(attendance.checkOutTime) : '--:--'}
                      </div>
                    </div>
                  </div>
                </div>

                {attendance && (
                  <div className="mb-8 flex items-center justify-center gap-3">
                    <span className="text-sm font-medium text-slate-600">Current Status:</span>
                    <StatusBadge 
                      status={attendance.status} 
                      tone={attendance.status === 'Present' ? 'success' : attendance.status === 'In Progress' ? 'warning' : 'error'} 
                    />
                    {attendance.totalHours > 0 && (
                      <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full ml-2">
                        {attendance.totalHours} Hours
                      </span>
                    )}
                  </div>
                )}

                {!attendance && (
                  <button
                    onClick={handleCheckIn}
                    disabled={locationLoading}
                    className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70"
                  >
                    {locationLoading ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <MapPin size={24} />
                        Check In Now
                      </>
                    )}
                  </button>
                )}

                {attendance && !attendance.checkOutTime && (
                  <button
                    onClick={handleCheckOut}
                    disabled={locationLoading}
                    className="w-full md:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-orange-200 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70"
                  >
                    {locationLoading ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <LogOut size={24} />
                        Check Out
                      </>
                    )}
                  </button>
                )}

                {attendance?.checkOutTime && (
                  <div className="p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-3 font-medium">
                    <CheckCircle size={24} />
                    You have completed your attendance for today.
                  </div>
                )}
              </div>
            </SurfaceCard>
          )}
        </div>
      )}

      {/* Request Leave / Permission Tab */}
      {activeTab === 'leaves' && (
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 mt-6">
          {/* Form Card */}
          <div className="space-y-6">
            <SurfaceCard className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-2">New Request</h2>
              <p className="text-slate-500 text-xs mb-6">Submit requests for planned leaves or short permissions.</p>

              {/* Request Type Toggle */}
              <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={() => setLeaveType('Leave')}
                  className={`flex-1 py-2 text-center text-sm font-semibold rounded-xl transition ${
                    leaveType === 'Leave'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Apply Leave
                </button>
                <button
                  type="button"
                  onClick={() => setLeaveType('Permission')}
                  className={`flex-1 py-2 text-center text-sm font-semibold rounded-xl transition ${
                    leaveType === 'Permission'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Apply Permission
                </button>
              </div>

              <form onSubmit={handleLeaveSubmit} className="space-y-4">
                {leaveType === 'Leave' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white outline-none transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white outline-none transition"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        value={leaveDate}
                        onChange={(e) => setLeaveDate(e.target.value)}
                        className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white outline-none transition"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white outline-none transition"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white outline-none transition"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Reason for {leaveType}
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={`Explain why you are requesting this ${leaveType.toLowerCase()}...`}
                    rows={4}
                    className="w-full p-4 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white outline-none transition resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingLeave}
                  className="w-full flex items-center justify-center h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold transition shadow-lg shadow-blue-500/20"
                >
                  {submittingLeave ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    `Submit ${leaveType} Request`
                  )}
                </button>
              </form>
            </SurfaceCard>
          </div>

          {/* History List */}
          <div className="space-y-6">
            <SurfaceCard className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Request History</h2>

              {loadingRequests ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                </div>
              ) : requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4">
                    <FileText size={22} />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">No requests found</h3>
                  <p className="text-sm text-slate-500 max-w-sm mt-1">
                    You haven't submitted any leave or permission requests yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {requests.map((req) => (
                    <div
                      key={req._id}
                      className="p-5 border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all rounded-2xl flex flex-col md:flex-row md:items-start justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                            {req.type === 'Leave' ? <Calendar size={14} className="text-indigo-500" /> : <Clock size={14} className="text-cyan-500" />}
                            {req.type}
                          </span>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${getStatusStyle(req.status)}`}>
                            {req.status}
                          </span>
                        </div>

                        {req.type === 'Leave' ? (
                          <p className="text-sm font-bold text-slate-800">
                            {formatDate(req.startDate)} – {formatDate(req.endDate)}
                          </p>
                        ) : (
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-slate-800">{formatDate(req.date)}</p>
                            <p className="text-xs text-slate-500 font-medium">
                              {req.startTime} – {req.endTime}
                            </p>
                          </div>
                        )}

                        <p className="text-slate-600 text-xs mt-1 leading-relaxed bg-white border border-slate-100 rounded-xl p-3">
                          {req.reason}
                        </p>

                        {req.reviewerRemarks && (
                          <div className="mt-3 p-3 bg-white border border-slate-100 rounded-xl flex items-start gap-2.5">
                            {req.status === 'Approved' ? (
                              <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                            )}
                            <div className="text-xs">
                              <span className="font-bold text-slate-700">Remarks:</span>{' '}
                              <span className="text-slate-500 italic">"{req.reviewerRemarks}"</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-400 font-semibold self-end md:self-start">
                        Requested: {formatDate(req.createdAt)} at {formatTime(req.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SurfaceCard>
          </div>
        </div>
      )}
    </AppShell>
  );
}
