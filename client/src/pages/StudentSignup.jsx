import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { buildApiUrl } from '../utils/api';

export default function StudentSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (formData.password !== formData.confirm) {
      return toast.error('Passwords do not match');
    }

    setLoading(true);
    try {
      const res = await fetch(buildApiUrl('/auth/register-student'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        return toast.error(data.message || 'Registration failed');
      }

      toast.success('Student account created successfully. Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error('Network error during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_48%,#f8fafc_100%)] px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.14),transparent_30%)]" />
      <div className="relative mx-auto grid min-h-[calc(100vh-80px)] max-w-6xl items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="hidden lg:block">
          <div className="max-w-xl">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-white/70 px-4 py-2 text-sm font-medium text-blue-700 backdrop-blur">
              Student Task Registration
            </div>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-slate-950">
              Get your task assignments and update progress directly.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Sign up as a student account and access your assigned tasks with question-level completion tracking.
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="crm-surface p-6 md:p-8">
            <div className="mb-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,#2563eb,#4f46e5)] text-white shadow-[0_20px_50px_rgba(59,130,246,0.22)]">
                <User size={22} />
              </div>
              <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950">Student Account Signup</h2>
              <p className="mt-2 text-sm text-slate-500">
                Create a student login so you can view assigned tasks and update question status.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="crm-label">Full Name</label>
                <div className="relative">
                  <User size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={event => setFormData({ ...formData, name: event.target.value })}
                    className="crm-input pl-11"
                    placeholder="Your full name"
                  />
                </div>
              </div>

              <div>
                <label className="crm-label">Email address</label>
                <div className="relative">
                  <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={event => setFormData({ ...formData, email: event.target.value })}
                    className="crm-input pl-11"
                    placeholder="student@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="crm-label">Password</label>
                <div className="relative">
                  <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={event => setFormData({ ...formData, password: event.target.value })}
                    className="crm-input pl-11 pr-12"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(value => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="crm-label">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={formData.confirm}
                  onChange={event => setFormData({ ...formData, confirm: event.target.value })}
                  className="crm-input"
                  placeholder="Repeat your password"
                />
              </div>

              <button type="submit" disabled={loading} className="crm-btn-primary w-full justify-center">
                {loading ? 'Creating account...' : 'Create Student Account'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              Already registered? <button type="button" onClick={() => navigate('/login')} className="font-semibold text-blue-700">Log in here</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
