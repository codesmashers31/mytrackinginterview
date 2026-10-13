import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, Copy, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { buildApiUrl } from '../utils/api';
import { authHeaders } from '../utils/auth';

export default function UpdateStudentPasswordModal({ student, onClose }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  const defaultUsername = student?.mobile?.trim() || student?.email?.trim() || '';

  const handleUseMobile = () => {
    if (student?.mobile) {
      setPassword(student.mobile.trim());
    } else {
      toast.error('Student has no mobile number registered');
    }
  };

  const handleGenerateRandom = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let randomStr = '';
    for (let i = 0; i < 6; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(`Std@${randomStr}`);
  };

  const handleCopyDetails = (passToCopy) => {
    const activePass = passToCopy || password;
    const loginUrl = window.location.origin ? `${window.location.origin}/login` : 'https://mytrackinginterview.vercel.app/login';
    const textToCopy = `Placement Tracking Portal Login Details:\n• URL: ${loginUrl}\n• Student: ${student?.name || 'Student'}\n• Username (Mobile/Email): ${defaultUsername}\n• Password: ${activePass}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success('Login details copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.trim().length < 4) {
      toast.error('Password must be at least 4 characters long');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl(`/students/${student._id}/password`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ password: password.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Password updated successfully!');
        setSuccessInfo({
          password: password.trim(),
          username: data.username || defaultUsername,
        });
      } else {
        toast.error(data.message || 'Failed to update password');
      }
    } catch (err) {
      toast.error('Network error updating password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <KeyRound size={18} />
            </div>
            <div>
              <h3 className="text-slate-800 font-bold text-base leading-tight">
                Update Student Password
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {student?.name}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Student Identifiers Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Registered Mobile:</span>
              <span className="font-semibold text-slate-800 font-mono">{student?.mobile || '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Registered Email:</span>
              <span className="font-semibold text-slate-800 font-mono">{student?.email || '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Batch / Stack:</span>
              <span className="font-semibold text-slate-800">{student?.batch || student?.studentType || 'Frontend'}</span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 leading-relaxed">
              Student can log in at <span className="font-semibold text-slate-700">/login</span> using either their registered Mobile or Email as the username.
            </p>
          </div>

          {successInfo ? (
            /* Success confirmation & 1-click share */
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <Check size={18} className="text-emerald-600" />
                <span>Password Successfully Updated!</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-emerald-100 text-xs font-mono space-y-1 text-slate-700">
                <div><span className="text-slate-400">Username:</span> <strong className="text-slate-900">{successInfo.username}</strong></div>
                <div><span className="text-slate-400">New Password:</span> <strong className="text-emerald-700">{successInfo.password}</strong></div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyDetails(successInfo.password)}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied Details!' : 'Copy Login Details'}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password (min 4 characters)"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Quick helper presets */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-400">Quick Fill:</span>
                {student?.mobile && (
                  <button
                    type="button"
                    onClick={handleUseMobile}
                    className="text-[11px] font-medium py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-200"
                  >
                    Use Mobile ({student.mobile.slice(-4).padStart(student.mobile.length, '•')})
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleGenerateRandom}
                  className="text-[11px] font-medium py-1 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg transition-colors cursor-pointer border border-amber-200"
                >
                  Generate Random
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !password || password.length < 4}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {loading ? (
                    <span>Updating...</span>
                  ) : (
                    <>
                      <KeyRound size={14} />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
