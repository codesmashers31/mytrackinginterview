import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { AppShell, SurfaceCard, StatusBadge } from '../components/AppShell';
import { authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import { MapPin, LogOut, CheckCircle } from 'lucide-react';

export default function StudentAttendance() {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchTodayAttendance();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  if (loading) {
    return (
      <AppShell title="My Attendance">
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AppShell
      title="My Attendance"
      subtitle="Check in and check out based on your office location."
    >
      <div className="mx-auto max-w-2xl mt-8">
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
      </div>
    </AppShell>
  );
}
