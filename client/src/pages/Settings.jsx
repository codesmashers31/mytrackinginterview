import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { AppShell, SectionTabs, SurfaceCard } from '../components/AppShell';
import { authHeaders, logout } from '../utils/auth';
import { buildApiUrl } from '../utils/api';

export default function Settings() {
  const [loading, setLoading] = useState(false);

  const adminName = localStorage.getItem('userName') || 'Administrator';
  const adminEmail = localStorage.getItem('userEmail') || 'admin@placex.com';
  const userRole = localStorage.getItem('userRole') || 'admin';

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(userRole === 'student');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileType, setProfileType] = useState(''); // 'directory' or 'spl'
  const [profileId, setProfileId] = useState('');

  const STANDARD_STACKS = [
    'MERN Stack',
    'Java Full Stack',
    'Python Full Stack',
    'Frontend Development',
    'QA / Testing',
    'Data Science / AI'
  ];

  const splStackValue = profileData?.stack || '';
  const isStandardStack = splStackValue && STANDARD_STACKS.includes(splStackValue);
  const selectedSelectStack = splStackValue ? (isStandardStack ? splStackValue : 'Other') : '';
  const customStackText = splStackValue === 'Other' ? '' : (isStandardStack ? '' : splStackValue);

  const handleStackDropdownChange = (e) => {
    const val = e.target.value;
    setProfileData(prev => ({ ...prev, stack: val }));
  };

  const handleCustomStackChange = (e) => {
    const val = e.target.value;
    setProfileData(prev => ({ ...prev, stack: val }));
  };

  const fetchProfile = async () => {
    if (userRole !== 'student') return;
    try {
      const res = await fetch(buildApiUrl('/auth/me'), {
        headers: authHeaders()
      });
      if (res.status === 401) {
        logout();
        return;
      }
      const data = await res.json();
      if (data.studentProfile) {
        setProfileData(data.studentProfile);
        if (data.studentId) {
          setProfileType('directory');
          setProfileId(data.studentId);
        } else if (data.splRegistrationId) {
          setProfileType('spl');
          setProfileId(data.splRegistrationId);
        }
      }
    } catch (err) {
      toast.error('Failed to load profile details');
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileId || !profileData) return;
    
    setSavingProfile(true);
    const loadToast = toast.loading('Saving profile changes...');
    try {
      const url = profileType === 'directory'
        ? buildApiUrl(`/students/${profileId}`)
        : buildApiUrl(`/spl-registration/${profileId}`);

      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(profileData),
      });

      if (res.status === 401) {
        logout();
        return;
      }

      if (res.ok) {
        const updated = await res.json();
        setProfileData(updated);
        if (updated.name) {
          localStorage.setItem('userName', updated.name);
        }
        toast.success('Profile updated successfully', { id: loadToast });
      } else {
        toast.error('Failed to save profile changes', { id: loadToast });
      }
    } catch (err) {
      toast.error('Network error saving profile', { id: loadToast });
    } finally {
      setSavingProfile(false);
    }
  };

  const currentName = userRole === 'student' && profileData?.name ? profileData.name : adminName;
  const currentEmail = userRole === 'student' && profileData?.email ? profileData.email : adminEmail;

  const handlePasswordChange = async event => {
    event.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return toast.error('New passwords do not match');
    }

    setLoading(true);
    try {
      const res = await fetch(buildApiUrl('/auth/change-password'), {
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
              <h2 className="truncate text-lg font-semibold text-slate-955">{currentName}</h2>
              <p className="truncate text-sm text-slate-500">{currentEmail}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Role</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{userRole === 'admin' ? 'Administrator' : 'Student'}</p>
            <p className="mt-1 text-sm text-slate-500">
              {userRole === 'admin'
                ? 'Full dashboard access with permission to manage student records and platform configuration.'
                : 'Student task account with access to assigned tasks and progress updates.'}
            </p>
          </div>
        </SurfaceCard>

        <div className="space-y-6">
          {userRole === 'student' && (
            <SurfaceCard className="p-5 md:p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-slate-500">Profile</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">Edit Profile Details</h2>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <UserCircle2 size={20} />
                </div>
              </div>

              {loadingProfile ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mb-3"></div>
                  <span className="text-sm text-slate-500 font-medium">Loading profile...</span>
                </div>
              ) : !profileData ? (
                <div className="p-8 text-center text-slate-500 italic">No profile data found.</div>
              ) : (
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="crm-label">Full Name</label>
                      <input
                        type="text"
                        required
                        value={profileData.name || ''}
                        onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                        className="crm-input"
                      />
                    </div>

                    <div>
                      <label className="crm-label">Email Address</label>
                      <input
                        type="email"
                        value={profileData.email || ''}
                        onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                        className="crm-input"
                      />
                    </div>

                    <div>
                      <label className="crm-label">Mobile Number</label>
                      <input
                        type="text"
                        required
                        value={profileData.mobile || ''}
                        onChange={e => setProfileData({ ...profileData, mobile: e.target.value })}
                        className="crm-input"
                      />
                    </div>

                    <div>
                      <label className="crm-label">Degree / Course</label>
                      <input
                        type="text"
                        value={profileData.degree || ''}
                        onChange={e => setProfileData({ ...profileData, degree: e.target.value })}
                        className="crm-input"
                      />
                    </div>

                    <div>
                      <label className="crm-label">City</label>
                      <input
                        type="text"
                        value={profileData.city || ''}
                        onChange={e => setProfileData({ ...profileData, city: e.target.value })}
                        className="crm-input"
                        placeholder="e.g. Bangalore"
                      />
                    </div>

                    <div>
                      <label className="crm-label">
                        {profileData.isFrontend ? 'Batch Year' : (profileType === 'directory' ? 'Passed Out Year (Batch Year)' : 'Batch Year')}
                      </label>
                      <input
                        type="text"
                        value={profileType === 'directory' ? (profileData.passedOutYear || '') : (profileData.batch || '')}
                        onChange={e => {
                          if (profileType === 'directory') {
                            setProfileData({ ...profileData, passedOutYear: e.target.value });
                          } else {
                            setProfileData({ ...profileData, batch: e.target.value });
                          }
                        }}
                        className="crm-input"
                        placeholder="e.g. 2024"
                      />
                    </div>

                    {profileType === 'directory' && (
                      <div>
                        <label className="crm-label">
                          {profileData.isFrontend ? 'Batch' : 'Institute Batch'}
                        </label>
                        <input
                          type="text"
                          value={profileData.batch || ''}
                          onChange={e => setProfileData({ ...profileData, batch: e.target.value })}
                          className="crm-input"
                          placeholder={profileData.isFrontend ? 'e.g. Morning Batch' : 'e.g. Section A'}
                        />
                      </div>
                    )}

                    {(profileData.grade || profileData.isFrontend) && (
                      <div>
                        <label className="crm-label">Student Grade</label>
                        <input
                          type="text"
                          disabled
                          value={profileData.grade ? `Grade ${profileData.grade}` : 'No Grade Assigned'}
                          className="crm-input bg-slate-50 cursor-not-allowed"
                        />
                      </div>
                    )}

                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-100">
                      <div>
                        <label className="crm-label">Primary Tech Stack</label>
                        <select
                          value={selectedSelectStack}
                          onChange={handleStackDropdownChange}
                          className="crm-input"
                        >
                          <option value="">Select Stack</option>
                          {STANDARD_STACKS.map(stackOpt => (
                            <option key={stackOpt} value={stackOpt}>{stackOpt}</option>
                          ))}
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      {selectedSelectStack === 'Other' && (
                        <div>
                          <label className="crm-label">Custom Tech Stack</label>
                          <input
                            type="text"
                            value={customStackText}
                            onChange={handleCustomStackChange}
                            className="crm-input"
                            placeholder="e.g. .NET Full Stack"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {profileType === 'directory' && (
                    <div className="pt-5 border-t border-slate-100">
                      <h3 className="text-sm font-bold text-slate-800 mb-4">Placement Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="crm-label">Status</label>
                          <input
                            type="text"
                            value={profileData.currentStatus || 'Need to filled'}
                            readOnly
                            className="crm-input bg-slate-50 cursor-not-allowed"
                          />
                        </div>

                        {!profileData.isFrontend && profileData.currentStatus?.toLowerCase() === 'placed' && (
                          <>
                            <div>
                              <label className="crm-label">Company Name</label>
                              <input
                                type="text"
                                value={profileData.companyName || ''}
                                readOnly
                                className="crm-input bg-slate-50 cursor-not-allowed"
                              />
                            </div>

                            <div>
                              <label className="crm-label">Package (LPA)</label>
                              <input
                                type="text"
                                value={profileData.packageLpa || ''}
                                readOnly
                                className="crm-input bg-slate-50 cursor-not-allowed"
                              />
                            </div>

                            <div>
                              <label className="crm-label">Job Get Mode</label>
                              <select
                                value={profileData.jobGetMode || ''}
                                disabled
                                className="crm-input bg-slate-50 cursor-not-allowed"
                              >
                                <option value="">Select Mode</option>
                                <option value="Self Placed">Self Placed</option>
                                <option value="SLA">SLA Origin</option>
                                <option value="On Campus">On Campus Drive</option>
                              </select>
                            </div>
                          </>
                        )}

                        {!profileData.isFrontend && ['inactive - not responded', 'not picking the call', 'not reachable'].includes(profileData.currentStatus?.toLowerCase()) && (
                          <div className="md:col-span-2">
                            <label className="crm-label">Status Reason (Remarks)</label>
                            <textarea
                              value={profileData.statusReason || ''}
                              readOnly
                              className="crm-input bg-slate-50 cursor-not-allowed min-h-[5rem] resize-none"
                            />
                          </div>
                        )}

                        <div className="md:col-span-2">
                          <label className="crm-label">Skills</label>
                          <input
                            type="text"
                            value={profileData.skills || ''}
                            onChange={e => setProfileData({ ...profileData, skills: e.target.value })}
                            className="crm-input"
                            placeholder="e.g. React, Node.js, Python"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="crm-label">Others (Additional Info)</label>
                          <textarea
                            value={profileData.others || ''}
                            onChange={e => setProfileData({ ...profileData, others: e.target.value })}
                            className="crm-input min-h-[5rem] resize-y"
                            placeholder="Any other details"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-3">
                    <button type="submit" disabled={savingProfile} className="crm-btn-primary min-w-[180px]">
                      {savingProfile ? 'Saving Changes...' : 'Save Profile Details'}
                    </button>
                  </div>
                </form>
              )}
            </SurfaceCard>
          )}

          <SurfaceCard className="p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Security</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  {userRole === 'admin' ? 'Update administrator password' : 'Update password'}
                </h2>
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
      </div>
    </AppShell>
  );
}
