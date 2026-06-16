import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, CheckCircle2, AlertCircle, Trash2, Award, Star, ListFilter, HelpCircle, ClipboardList
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AppShell, SectionTabs, SurfaceCard } from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';

export default function StudentMockScheduler() {
  const [activeTab, setActiveTab] = useState('book'); // 'book', 'my-bookings'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState(30); // 30 or 60 minutes
  const [availableSlots, setAvailableSlots] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Booking confirm modal state
  const [confirmSlot, setConfirmSlot] = useState(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // Fetch available slots
  const fetchAvailableSlots = async () => {
    setLoadingSlots(true);
    try {
      const res = await fetch(
        buildApiUrl(`/mock-interviews/available-slots?date=${selectedDate}&duration=${duration}`),
        { headers: authHeaders() }
      );
      const data = await res.json();
      if (res.ok) {
        setAvailableSlots(data);
      } else {
        setAvailableSlots([]);
      }
    } catch (err) {
      toast.error('Error loading available slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  // Fetch student's own bookings
  const fetchMyBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await fetch(buildApiUrl('/mock-interviews/my-bookings'), {
        headers: authHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setMyBookings(data);
      }
    } catch (err) {
      toast.error('Error loading your bookings');
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'book') {
      fetchAvailableSlots();
    } else {
      fetchMyBookings();
    }
  }, [selectedDate, duration, activeTab]);

  // Handle slot booking submission
  const handleBookSlot = async () => {
    if (!confirmSlot) return;
    setBookingInProgress(true);
    const loadToast = toast.loading('Booking your slot...');
    try {
      const res = await fetch(buildApiUrl('/mock-interviews/bookings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          date: selectedDate,
          startTime: confirmSlot.startTime,
          duration: duration
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Mock Interview scheduled successfully!', { id: loadToast });
        setConfirmSlot(null);
        fetchAvailableSlots();
      } else {
        toast.error(data.message || 'Booking failed', { id: loadToast });
      }
    } catch (err) {
      toast.error('Network error', { id: loadToast });
    } finally {
      setBookingInProgress(false);
    }
  };

  // Handle booking cancel
  const handleCancelBooking = async (id) => {
    if (!confirm('Are you sure you want to cancel this mock interview booking?')) return;
    const loadToast = toast.loading('Cancelling booking...');
    try {
      const res = await fetch(buildApiUrl(`/mock-interviews/bookings/${id}/cancel`), {
        method: 'PUT',
        headers: authHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Booking cancelled successfully', { id: loadToast });
        fetchMyBookings();
      } else {
        toast.error(data.message || 'Cancellation failed', { id: loadToast });
      }
    } catch (err) {
      toast.error('Network error', { id: loadToast });
    }
  };

  return (
    <AppShell
      title="Mock Interviews"
      subtitle="Schedule your mock interviews with instructors and view performance feedbacks."
    >
      <SectionTabs
        items={[
          { label: 'Overview', onClick: () => {} },
          { label: 'Mock Scheduler', active: true }
        ]}
      />

      {/* Tabs Row */}
      <div className="mb-6 flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('book')}
          className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
            activeTab === 'book' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Book an Interview
        </button>
        <button
          onClick={() => setActiveTab('my-bookings')}
          className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
            activeTab === 'my-bookings' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          My Bookings & Feedback
        </button>
      </div>

      {/* Booking Tab */}
      {activeTab === 'book' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Calendar Picker Panel */}
          <div className="xl:col-span-1">
            <SurfaceCard className="p-5 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" /> Choose Timing
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="crm-label">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="crm-input"
                  />
                </div>

                <div>
                  <label className="crm-label">Interview Duration</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[15, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDuration(mins)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                          duration === mins
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {mins === 60 ? '1 Hour' : `${mins} Mins`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SurfaceCard>
          </div>

          {/* Slots Panel */}
          <div className="xl:col-span-2">
            <SurfaceCard className="p-5 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Clock size={16} className="text-blue-600" /> Available Slots on {selectedDate}
                </h3>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {duration} Mins duration
                </span>
              </div>

              {loadingSlots ? (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mb-3"></div>
                  <span className="text-xs font-semibold text-slate-500">Calculating slots...</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <AlertCircle size={32} className="mx-auto text-amber-500" />
                  <p className="text-xs font-bold text-slate-700">No slots available on this date</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    The admin has not updated availability blocks for this date, or all hours are already fully booked. Please select another date.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => setConfirmSlot(slot)}
                      className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-600 hover:shadow-md hover:translate-y-[-1px] text-left transition-all group flex flex-col justify-between h-[100px]"
                    >
                      <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                        {slot.startTime}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        Ends: {slot.endTime}
                      </div>
                      <div className="w-full text-right text-[10px] font-bold text-blue-600 group-hover:underline">
                        Book Slot &rarr;
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </SurfaceCard>
          </div>
        </div>
      )}

      {/* My bookings tab */}
      {activeTab === 'my-bookings' && (
        <div className="space-y-6">
          <SurfaceCard className="p-4">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <ClipboardList size={16} className="text-blue-600" /> Interview Scheduler History
            </h3>

            {loadingBookings ? (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mb-3"></div>
                <span className="text-xs font-semibold text-slate-500">Loading history...</span>
              </div>
            ) : myBookings.length === 0 ? (
              <div className="py-12 text-center text-xs font-semibold text-slate-400">
                You have not booked any mock interviews yet.
              </div>
            ) : (
              <div className="space-y-4">
                {myBookings.map(b => (
                  <div 
                    key={b._id} 
                    className="p-5 border border-slate-200 bg-white rounded-2xl hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          b.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' :
                          b.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' :
                          'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
                        }`}>
                          {b.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">{b.duration} mins slot</span>
                      </div>
                      
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-400" /> {b.date} &bull; <Clock size={14} className="text-slate-400" /> {b.startTime} - {b.endTime}
                      </div>
                    </div>

                    {/* Booking state actions or completed feedback */}
                    <div className="md:text-right">
                      {b.status === 'Scheduled' && (
                        <button
                          onClick={() => handleCancelBooking(b._id)}
                          className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-all inline-flex items-center gap-1"
                        >
                          <Trash2 size={13} /> Cancel Slot
                        </button>
                      )}

                      {b.status === 'Completed' && (
                        <div className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl max-w-xl text-left space-y-2">
                          <div className="flex justify-between items-center gap-3">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                              <Star size={14} className="text-amber-500 fill-amber-500" /> Score: {b.feedback?.score}/10
                            </span>
                            <span className={`text-xs font-bold ${
                              b.feedback?.status === 'Passed' ? 'text-emerald-600' :
                              b.feedback?.status === 'Failed' ? 'text-rose-600' : 'text-amber-600'
                            }`}>
                              Result: {b.feedback?.status || 'Completed'}
                            </span>
                          </div>

                          {b.feedback?.strengths && (
                            <p className="text-[11px] text-slate-600">
                              <span className="font-bold text-slate-700">Strengths:</span> {b.feedback.strengths}
                            </p>
                          )}
                          {b.feedback?.improvements && (
                            <p className="text-[11px] text-slate-600">
                              <span className="font-bold text-slate-700">Improvements:</span> {b.feedback.improvements}
                            </p>
                          )}
                          {b.feedback?.remarks && (
                            <p className="text-[11px] text-slate-500 italic">
                              <span className="font-semibold text-slate-600">Notes:</span> "{b.feedback.remarks}"
                            </p>
                          )}
                        </div>
                      )}

                      {b.status === 'Cancelled' && (
                        <span className="text-xs text-slate-400 italic font-semibold">Cancelled Booking</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>
        </div>
      )}

      {/* Booking Confirmation Dialog Modal */}
      {confirmSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl p-6 w-full max-w-sm text-center animate-in fade-in zoom-in-95">
            <div className="mx-auto h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Calendar size={24} />
            </div>
            
            <h3 className="text-base font-bold text-slate-900 mb-2">Confirm Mock Booking</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Are you sure you want to book a <span className="font-bold text-slate-800">{duration}-minute</span> mock interview on <span className="font-bold text-slate-800">{selectedDate}</span> from <span className="font-bold text-slate-800">{confirmSlot.startTime} to {confirmSlot.endTime}</span>?
            </p>

            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setConfirmSlot(null)} 
                disabled={bookingInProgress}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors text-xs font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={handleBookSlot} 
                disabled={bookingInProgress}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-colors text-xs font-bold flex items-center gap-1.5"
              >
                {bookingInProgress ? 'Booking...' : 'Confirm Book'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
