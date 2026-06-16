import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Calendar, ClipboardList, Clock, Search, X, Edit, CheckCircle2, AlertCircle, Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AppShell, SectionTabs, SurfaceCard } from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';

export default function AdminMockBoard() {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily', 'availability', 'all'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookings, setBookings] = useState([]);
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(false);

  // Availability form state
  const [newAvail, setNewAvail] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00'
  });

  // Feedback modal state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    score: '',
    strengths: '',
    improvements: '',
    remarks: '',
    status: 'Pending'
  });

  // Search/Filter for all bookings
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [allBookings, setAllBookings] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);

  // Fetch daily bookings & availabilities
  const fetchDailyData = async () => {
    setLoading(true);
    try {
      // Fetch bookings for selected date
      const resBookings = await fetch(buildApiUrl(`/mock-interviews/bookings?date=${selectedDate}`), {
        headers: authHeaders()
      });
      const dataBookings = await resBookings.json();
      setBookings(dataBookings);

      // Fetch availabilities
      const resAvail = await fetch(buildApiUrl(`/mock-interviews/availability?date=${selectedDate}`), {
        headers: authHeaders()
      });
      const dataAvail = await resAvail.json();
      setAvailabilities(dataAvail);
    } catch (err) {
      toast.error('Failed to load scheduler data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all bookings (for historical log)
  const fetchAllBookings = async () => {
    setLoadingAll(true);
    try {
      const res = await fetch(buildApiUrl('/mock-interviews/bookings'), {
        headers: authHeaders()
      });
      const data = await res.json();
      setAllBookings(data);
    } catch (err) {
      toast.error('Failed to load history');
    } finally {
      setLoadingAll(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'daily' || activeTab === 'availability') {
      fetchDailyData();
    } else if (activeTab === 'all') {
      fetchAllBookings();
    }
  }, [selectedDate, activeTab]);

  // Handle adding availability
  const handleAddAvailability = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(buildApiUrl('/mock-interviews/availability'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(newAvail)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Availability block added successfully');
        fetchDailyData();
      } else {
        toast.error(data.message || 'Failed to add availability');
      }
    } catch (err) {
      toast.error('Network disconnect');
    }
  };

  // Handle deleting availability
  const handleDeleteAvailability = async (id) => {
    if (!confirm('Are you sure you want to delete this availability block?')) return;
    try {
      const res = await fetch(buildApiUrl(`/mock-interviews/availability/${id}`), {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (res.ok) {
        toast.success('Availability block removed');
        fetchDailyData();
      } else {
        toast.error('Deletion failed');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  // Open feedback modal
  const handleOpenFeedback = (booking) => {
    setSelectedBooking(booking);
    setFeedbackForm({
      score: booking.feedback?.score !== null ? String(booking.feedback.score) : '',
      strengths: booking.feedback?.strengths || '',
      improvements: booking.feedback?.improvements || '',
      remarks: booking.feedback?.remarks || '',
      status: booking.feedback?.status || 'Pending'
    });
    setIsFeedbackOpen(true);
  };

  // Handle feedback submit
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(buildApiUrl(`/mock-interviews/bookings/${selectedBooking._id}/feedback`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(feedbackForm)
      });
      if (res.ok) {
        toast.success('Feedback recorded successfully');
        setIsFeedbackOpen(false);
        fetchDailyData();
      } else {
        toast.error('Failed to submit feedback');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  // Filtered all bookings
  const filteredAllBookings = allBookings.filter(b => {
    const matchesSearch = b.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.studentEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell
      title="Mock Interview Board"
      subtitle="Configure interviewer availabilities, monitor scheduled slots, and record candidate feedbacks."
    >
      <SectionTabs
        items={[
          { label: 'Overview', onClick: () => {} }, // Left empty or standard navigation
          { label: 'Mock Board', active: true }
        ]}
      />

      {/* Tabs Row */}
      <div className="mb-6 flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
            activeTab === 'daily' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Daily Schedules
        </button>
        <button
          onClick={() => setActiveTab('availability')}
          className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
            activeTab === 'availability' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Manage Availability
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
            activeTab === 'all' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Bookings Log
        </button>
      </div>

      {/* Daily schedule tab */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-700">Select Date:</span>
              <input 
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="crm-input h-10 w-[200px]"
              />
            </div>
            <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
              Date selected: {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Daily Roster (2 cols) */}
            <div className="xl:col-span-2 space-y-4">
              <SurfaceCard className="overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <ClipboardList size={16} className="text-blue-600" /> Scheduled Interviews ({bookings.length})
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-white">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Student</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Time / Duration</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Result</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {loading ? (
                        <tr>
                          <td colSpan="5" className="px-5 py-10 text-center">
                            <div className="flex justify-center items-center gap-2 text-slate-500">
                              <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
                              <span className="text-xs font-semibold">Loading bookings...</span>
                            </div>
                          </td>
                        </tr>
                      ) : bookings.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-5 py-10 text-center text-xs font-semibold text-slate-500">
                            No mock interviews scheduled for this date.
                          </td>
                        </tr>
                      ) : (
                        bookings.map(booking => (
                          <tr key={booking._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3">
                              <p className="text-xs font-bold text-slate-800">{booking.studentName}</p>
                              <p className="text-[10px] text-slate-400 truncate">{booking.studentEmail}</p>
                            </td>
                            <td className="px-5 py-3 text-xs font-semibold text-slate-600">
                              <p>{booking.startTime} - {booking.endTime}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{booking.duration} Minutes</p>
                            </td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                booking.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' :
                                booking.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' :
                                'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-xs font-bold text-slate-700">
                              {booking.status === 'Completed' ? (
                                <span className={`inline-flex items-center gap-1 ${
                                  booking.feedback?.status === 'Passed' ? 'text-emerald-600' :
                                  booking.feedback?.status === 'Failed' ? 'text-rose-600' : 'text-amber-600'
                                }`}>
                                  <Award size={13} /> {booking.feedback?.status || 'Completed'}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-medium">-</span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-right">
                              {booking.status !== 'Cancelled' ? (
                                <button
                                  onClick={() => handleOpenFeedback(booking)}
                                  className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-all"
                                >
                                  {booking.status === 'Completed' ? 'Modify Feedback' : 'Give Feedback'}
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-medium">Cancelled</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </SurfaceCard>
            </div>

            {/* Daily Availability Overview */}
            <div>
              <SurfaceCard className="p-4 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Clock size={16} className="text-blue-600" /> Free Time Slots ({availabilities.length})
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  These represent your designated free hours on {selectedDate}. Students can book in-between these blocks.
                </p>

                <div className="space-y-2">
                  {availabilities.length === 0 ? (
                    <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-xs font-semibold text-slate-400">
                      No availability added for this date. Go to the "Manage Availability" tab to configure free time.
                    </div>
                  ) : (
                    availabilities.map(avail => (
                      <div key={avail._id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200/60 rounded-xl hover:shadow-sm transition-all">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <Clock size={14} className="text-slate-400" />
                          <span>{avail.startTime} - {avail.endTime}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400">Active Block</span>
                      </div>
                    ))
                  )}
                </div>
              </SurfaceCard>
            </div>
          </div>
        </div>
      )}

      {/* Manage Availability tab */}
      {activeTab === 'availability' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Availability Add Form */}
          <div className="lg:col-span-1">
            <SurfaceCard className="p-5 md:p-6 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Plus size={16} className="text-blue-600" /> Add Available Block
              </h3>
              
              <form onSubmit={handleAddAvailability} className="space-y-4">
                <div>
                  <label className="crm-label">Date</label>
                  <input
                    type="date"
                    required
                    value={newAvail.date}
                    onChange={e => setNewAvail({ ...newAvail, date: e.target.value })}
                    className="crm-input"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="crm-label">Start Time</label>
                    <input
                      type="time"
                      required
                      value={newAvail.startTime}
                      onChange={e => setNewAvail({ ...newAvail, startTime: e.target.value })}
                      className="crm-input"
                    />
                  </div>
                  <div>
                    <label className="crm-label">End Time</label>
                    <input
                      type="time"
                      required
                      value={newAvail.endTime}
                      onChange={e => setNewAvail({ ...newAvail, endTime: e.target.value })}
                      className="crm-input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-bold text-xs flex justify-center items-center gap-1.5"
                >
                  <Plus size={14} /> Add Available Time
                </button>
              </form>
            </SurfaceCard>
          </div>

          {/* Current Availabilities List */}
          <div className="lg:col-span-2">
            <SurfaceCard className="p-4 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Calendar size={16} className="text-blue-600" /> Configured Availabilities ({availabilities.length})
                </h3>
                <div className="text-[10px] font-bold text-slate-500">Date: {selectedDate}</div>
              </div>

              <div className="space-y-2.5 max-h-[400px] overflow-y-auto custom-scrollbar">
                {availabilities.length === 0 ? (
                  <div className="p-10 text-center text-xs font-semibold text-slate-400">
                    No availability slots added for {selectedDate}. Use the form on the left to set active slots.
                  </div>
                ) : (
                  availabilities.map(avail => (
                    <div key={avail._id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md hover:border-slate-200 transition-all">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                          <Clock size={14} className="text-blue-600" /> {avail.startTime} - {avail.endTime}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">Added by {avail.addedBy}</div>
                      </div>
                      <button
                        onClick={() => handleDeleteAvailability(avail._id)}
                        className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete slot"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </SurfaceCard>
          </div>
        </div>
      )}

      {/* All Bookings log tab */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Filters and search */}
          <SurfaceCard className="p-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all"
              />
            </div>
            
            <div className="w-full sm:w-[200px]">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </SurfaceCard>

          {/* Bookings log table */}
          <SurfaceCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Student</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Slot</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Score</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Feedback Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loadingAll ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-12 text-center">
                        <div className="flex justify-center items-center gap-2 text-slate-500">
                          <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
                          <span className="text-sm font-semibold">Retrieving mock booking history...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredAllBookings.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-12 text-center text-sm font-semibold text-slate-500">
                        No mock bookings match the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAllBookings.map(b => (
                      <tr key={b._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">
                          {b.date}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-xs font-bold text-slate-900">{b.studentName}</p>
                          <p className="text-[10px] text-slate-400 truncate">{b.studentEmail}</p>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-medium text-slate-600">
                          {b.startTime} - {b.endTime} ({b.duration} mins)
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            b.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' :
                            b.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' :
                            'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-bold text-slate-800">
                          {b.status === 'Completed' && b.feedback?.score !== null ? `${b.feedback.score} / 10` : '-'}
                        </td>
                        <td className="px-5 py-3.5 text-right text-xs font-bold">
                          {b.status === 'Completed' ? (
                            <span className={`${
                              b.feedback?.status === 'Passed' ? 'text-emerald-600' :
                              b.feedback?.status === 'Failed' ? 'text-rose-600' : 'text-amber-600'
                            }`}>
                              {b.feedback?.status}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        </div>
      )}

      {/* Give/Edit Feedback Modal */}
      {isFeedbackOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-[#1e293b] font-extrabold text-base md:text-lg">
                Record Mock Interview Feedback
              </h3>
              <button 
                onClick={() => setIsFeedbackOpen(false)} 
                className="p-1.5 bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/50 flex justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800">{selectedBooking.studentName}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{selectedBooking.studentEmail}</p>
                </div>
                <div className="text-right font-semibold text-slate-600">
                  <p>{selectedBooking.date}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{selectedBooking.startTime} - {selectedBooking.endTime}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="crm-label">Score (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={feedbackForm.score}
                    onChange={e => setFeedbackForm({ ...feedbackForm, score: e.target.value })}
                    className="crm-input"
                    placeholder="e.g. 8"
                  />
                </div>
                <div>
                  <label className="crm-label">Result Status</label>
                  <select
                    value={feedbackForm.status}
                    onChange={e => setFeedbackForm({ ...feedbackForm, status: e.target.value })}
                    className="crm-input cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Passed">Passed</option>
                    <option value="Failed">Failed</option>
                    <option value="Needs Retake">Needs Retake</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="crm-label">Key Strengths</label>
                <textarea
                  value={feedbackForm.strengths}
                  onChange={e => setFeedbackForm({ ...feedbackForm, strengths: e.target.value })}
                  className="crm-input min-h-[4rem] resize-y"
                  placeholder="What did the candidate do well?"
                />
              </div>

              <div>
                <label className="crm-label">Areas of Improvement</label>
                <textarea
                  value={feedbackForm.improvements}
                  onChange={e => setFeedbackForm({ ...feedbackForm, improvements: e.target.value })}
                  className="crm-input min-h-[4rem] resize-y"
                  placeholder="Where can the candidate improve?"
                />
              </div>

              <div>
                <label className="crm-label">General Remarks</label>
                <textarea
                  value={feedbackForm.remarks}
                  onChange={e => setFeedbackForm({ ...feedbackForm, remarks: e.target.value })}
                  className="crm-input min-h-[3rem] resize-y"
                  placeholder="Any final notes or action items"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFeedbackOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-colors text-xs font-bold"
                >
                  Save Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
