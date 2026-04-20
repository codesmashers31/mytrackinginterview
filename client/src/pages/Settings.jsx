import React, { useState } from 'react';
import { ShieldCheck, UserCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { AppShell, SectionTabs, SurfaceCard } from '../components/AppShell';
import { authHeaders, logout } from '../utils/auth';

export default function Settings() {
  const [loading, setLoading] = useState(false);

  const adminName = localStorage.getItem('adminName') || 'Administrator';
  const adminEmail = localStorage.getItem('adminEmail') || 'admin@placetrack.com';

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const handlePasswordChange = async event => {
    event.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return toast.error('New passwords do not match');
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        logout();
        return;
      }

      if (res.ok) {
        toast.success('Password updated successfully');
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        toast.error(data.message || 'Failed to update password');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="Settings"
      subtitle="Manage administrator identity, security, and access preferences."
      searchPlaceholder="Search settings or security preferences"
    >
      <SectionTabs items={[{ label: 'Platform Settings', active: true }]} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr]">
        <SurfaceCard className="p-5 md:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,#dbeafe,#e0e7ff)] text-blue-700">
              <UserCircle2 size={32} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-slate-950">{adminName}</h2>
              <p className="truncate text-sm text-slate-500">{adminEmail}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Role</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">System Administrator</p>
            <p className="mt-1 text-sm text-slate-500">
              Full dashboard access with permission to manage student records and platform configuration.
            </p>
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Security</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Update administrator password</h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <ShieldCheck size={20} />
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="crm-label">Current Password</label>
              <input
                type="password"
                required
                value={passwords.current}
                onChange={event => setPasswords({ ...passwords, current: event.target.value })}
                className="crm-input"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="crm-label">New Password</label>
              <input
                type="password"
                required
                value={passwords.new}
                onChange={event => setPasswords({ ...passwords, new: event.target.value })}
                className="crm-input"
                placeholder="Create new password"
              />
            </div>
            <div>
              <label className="crm-label">Confirm Password</label>
              <input
                type="password"
                required
                value={passwords.confirm}
                onChange={event => setPasswords({ ...passwords, confirm: event.target.value })}
                className="crm-input"
                placeholder="Repeat new password"
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button type="submit" disabled={loading} className="crm-btn-primary min-w-[180px]">
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
