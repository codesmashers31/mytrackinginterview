import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard } from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import { Calendar, Clock, AlertCircle, FileText, CheckCircle2, XCircle } from 'lucide-react';

export default function StudentLeaves() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [type, setType] = useState('Leave'); // 'Leave' or 'Permission'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');

  const fetchRequests = async () => {
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error('Please specify a reason');
      return;
    }

    const payload = { type, reason: reason.trim() };

    if (type === 'Leave') {
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
      if (!date || !startTime || !endTime) {
        toast.error('Please select date, start time, and end time');
        return;
      }
      payload.date = date;
      payload.startTime = startTime;
      payload.endTime = endTime;
    }

    setSubmitting(true);
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
        toast.success(`${type} request submitted successfully!`);
        // Reset form
        setStartDate('');
        setEndDate('');
        setDate('');
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
      setSubmitting(false);
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

  return (
    <AppShell
      title="Leaves & Permissions"
      subtitle="Submit and track your leave and permission requests."
    >
      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8">
        {/* Left Column: Form Card */}
        <div className="space-y-6">
          <SurfaceCard className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">New Request</h2>
            <p className="text-slate-500 text-xs mb-6">Submit requests for planned leaves or short permissions.</p>

            {/* Request Type Toggle */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setType('Leave')}
                className={`flex-1 py-2 text-center text-sm font-semibold rounded-xl transition ${
                  type === 'Leave'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Apply Leave
              </button>
              <button
                type="button"
                onClick={() => setType('Permission')}
                className={`flex-1 py-2 text-center text-sm font-semibold rounded-xl transition ${
                  type === 'Permission'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Apply Permission
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {type === 'Leave' ? (
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
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
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
                  Reason for {type}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why you are requesting this leave/permission..."
                  rows={4}
                  className="w-full p-4 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white outline-none transition resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold transition shadow-lg shadow-blue-500/20"
              >
                {submitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  `Submit ${type} Request`
                )}
              </button>
            </form>
          </SurfaceCard>
        </div>

        {/* Right Column: History List */}
        <div className="space-y-6">
          <SurfaceCard className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Request History</h2>

            {loading ? (
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
                          {req.type === 'Leave' ? (
                            <Calendar size={13} className="text-indigo-500" />
                          ) : (
                            <Clock size={13} className="text-cyan-500" />
                          )}
                          {req.type}
                        </span>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${getStatusStyle(req.status)}`}>
                          {req.status}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-slate-800">
                        {req.type === 'Leave' ? (
                          <>
                            {formatDate(req.startDate)} – {formatDate(req.endDate)}
                          </>
                        ) : (
                          <>
                            {formatDate(req.date)} &bull; {req.startTime} – {req.endTime}
                          </>
                        )}
                      </div>

                      <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{req.reason}</p>

                      {/* Reviewer comments if present */}
                      {req.status !== 'Pending' && (
                        <div className="mt-3 p-3 bg-white/60 rounded-xl border border-slate-100 flex items-start gap-2.5">
                          {req.status === 'Approved' ? (
                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                          )}
                          <div className="text-xs">
                            <span className="font-bold text-slate-700">
                              Reviewed by {req.reviewerName || 'Administrator'}
                            </span>
                            {req.reviewerRemarks && (
                              <p className="text-slate-500 mt-1 italic">
                                "{req.reviewerRemarks}"
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>
        </div>
      </div>
    </AppShell>
  );
}
