import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { buildApiUrl } from '../utils/api';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(buildApiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userRole', data.user.role);
        if (data.user.studentType) {
          localStorage.setItem('userStudentType', data.user.studentType);
        } else {
          localStorage.removeItem('userStudentType');
        }
        toast.success(`Welcome back, ${data.user.name.split(' ')[0]}`);
        if (data.user.role === 'student') {
          navigate('/student/tasks');
        } else if (data.user.role === 'placement') {
          navigate('/placement/dashboard');
        } else if (data.user.role === 'coordinator') {
          navigate('/coordinator/dashboard');
        } else {
          navigate('/dashboard');
        }
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
              <img src="/logo.png" alt="PlaceX Logo" className="h-18 w-18 object-contain mb-4" />
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Sign in to PlaceX</h2>
              <p className="mt-2 text-sm text-slate-500">
                Use your registered email or mobile number to access your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="crm-label">Registered Email or Mobile Number</label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    required
                    value={formData.email}
                    onChange={event => setFormData({ ...formData, email: event.target.value })}
                    className="crm-input pl-11"
                    placeholder="email@example.com or Mobile Number"
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
            <p className="mt-4 text-sm text-slate-500">
              Students should log in using their registered email or mobile number, and their mobile number as the password.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
