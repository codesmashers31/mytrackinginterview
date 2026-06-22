import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard } from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import { Calendar, Clock, Check, X, Search, FileText, CheckCircle2, XCircle } from 'lucide-react';

export default function LeaveManagement() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending' or 'History'
  const [searchQuery, setSearchQuery] = useState('');
  const [submittingId, setSubmittingId] = useState(null);
  
  // Store inline reviewer remarks per request id
  const [remarks, setRemarks] = useState({});

  const fetchAllRequests = async () => {
    try {
      const res = await fetch(buildApiUrl('/leaves'), {
        headers: authHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      } else {
        toast.error('Failed to fetch leave requests');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllRequests();
  }, []);

  const handleReview = async (id, status) => {
    const reviewerRemarks = remarks[id] || '';
    
    setSubmittingId(id);
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
        // Refresh local requests
        fetchAllRequests();
      } else {
        const errData = await res.json();
        toast.error(errData.message || 'Failed to review request');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error reviewing request');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRemarksChange = (id, val) => {
    setRemarks(prev => ({
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

  // Filter requests based on tab and search query
  const filteredRequests = requests.filter(req => {
    const matchesTab = activeTab === 'Pending' 
      ? req.status === 'Pending' 
      : req.status !== 'Pending';
    
    const matchesSearch = 
      req.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.reason.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <AppShell
      title="Leave & Permission Requests"
      subtitle="Review and process student leave and permission requests."
    >
      {/* Search and Tabs Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('Pending')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'Pending' 
                ? 'bg-white text-blue-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending Approval ({requests.filter(r => r.status === 'Pending').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('History')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'History' 
                ? 'bg-white text-blue-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Review History ({requests.filter(r => r.status !== 'Pending').length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student, email, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-11 pr-4 text-sm rounded-xl border border-slate-200 bg-white outline-none transition focus:border-blue-500"
          />
        </div>
      </div>

      {/* Requests Display */}
      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <SurfaceCard className="flex flex-col items-center justify-center min-h-[350px] text-center p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4">
            <FileText size={22} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No requests found</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            {searchQuery 
              ? 'No requests match your current search filters.' 
              : `There are no ${activeTab.toLowerCase()} requests at the moment.`}
          </p>
        </SurfaceCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRequests.map((req) => (
            <SurfaceCard 
              key={req._id} 
              className={`p-6 border flex flex-col justify-between ${
                req.status === 'Pending' ? 'border-slate-100' : 'border-slate-200/50 bg-slate-50/20'
              }`}
            >
              <div className="space-y-4">
                {/* Header: Student Info & Request Type */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 leading-snug">{req.studentName}</h3>
                    <p className="text-slate-400 text-xs mt-0.5">{req.studentEmail}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {req.type === 'Leave' ? <Calendar size={12} className="text-indigo-500" /> : <Clock size={12} className="text-cyan-500" />}
                      {req.type}
                    </span>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${getStatusStyle(req.status)}`}>
                      {req.status}
                    </span>
                  </div>
                </div>

                {/* Date / Time Details */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/80 text-sm font-semibold text-slate-800">
                  {req.type === 'Leave' ? (
                    <div className="flex items-center gap-2">
                      <Calendar size={15} className="text-slate-400" />
                      <span>{formatDate(req.startDate)} – {formatDate(req.endDate)}</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar size={15} className="text-slate-400" />
                        <span>{formatDate(req.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium ml-5">
                        <Clock size={13} className="text-slate-400" />
                        <span>{req.startTime} – {req.endTime}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reason */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reason</p>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{req.reason}</p>
                </div>

                {/* Review Details (For History Tab) */}
                {req.status !== 'Pending' && (
                  <div className="p-3.5 bg-white rounded-xl border border-slate-100 flex items-start gap-2.5 mt-2">
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

              {/* Approval Actions (For Pending Tab) */}
              {req.status === 'Pending' && (
                <div className="mt-6 pt-5 border-t border-slate-100 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Reviewer Remarks (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Add comments or rejection reasons..."
                      value={remarks[req._id] || ''}
                      onChange={(e) => handleRemarksChange(req._id, e.target.value)}
                      className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white outline-none transition"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={submittingId === req._id}
                      onClick={() => handleReview(req._id, 'Approved')}
                      className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      <Check size={14} />
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={submittingId === req._id}
                      onClick={() => handleReview(req._id, 'Rejected')}
                      className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      <X size={14} />
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </SurfaceCard>
          ))}
        </div>
      )}
    </AppShell>
  );
}
