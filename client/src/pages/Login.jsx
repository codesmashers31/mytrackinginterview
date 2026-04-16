import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminName', data.admin.name);
        localStorage.setItem('adminEmail', data.admin.email);
        toast.success(`Welcome back, ${data.admin.name.split(' ')[0]}`);
        navigate('/dashboard');
      } else {
        toast.error(data.message || 'Access Denied');
      }
    } catch (err) {
      toast.error('Network connect failure.');
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
              Enterprise Placement Workspace
            </div>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-slate-950">
              Operate your student placement pipeline with clarity.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              A polished admin console for student records, eligibility filtering, and placement tracking built for day-to-day operations teams.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-4">
              {[
                ['Unified Data', 'Manage records, imports, exports, and workflows in one place.'],
                ['Live Insights', 'Track placements, pending updates, and interview pipelines.'],
                ['Secure Access', 'Protected admin login and controlled settings management.'],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-[24px] border border-white/70 bg-white/75 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur">
                  <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="crm-surface p-6 md:p-8">
            <div className="mb-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,#2563eb,#4f46e5)] text-white shadow-[0_20px_50px_rgba(59,130,246,0.22)]">
                <ArrowRight size={22} />
              </div>
              <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950">Sign in to PlaceTrack</h2>
              <p className="mt-2 text-sm text-slate-500">
                Use your administrator credentials to access the operational dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="crm-label">Business Email</label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={event => setFormData({ ...formData, email: event.target.value })}
                    className="crm-input pl-11"
                    placeholder="admin@placetrack.com"
                  />
                </div>
              </div>

              <div>
                <label className="crm-label">Password</label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={event => setFormData({ ...formData, password: event.target.value })}
                    className="crm-input pl-11 pr-12"
                    placeholder="Enter your password"
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

              <button type="submit" disabled={loading} className="crm-btn-primary w-full justify-center">
                {loading ? 'Validating access...' : 'Access Dashboard'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
