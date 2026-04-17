import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings as SettingsIcon,
  Users,
  X,
} from 'lucide-react';

const navigationGroups = [
  {
    title: 'Workspace',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/students', label: 'Students', icon: Users },
      { to: '/eligibility', label: 'Eligibility', icon: CheckCircle2 },
    ],
  },
  {
    title: 'Administration',
    items: [{ to: '/settings', label: 'Settings', icon: SettingsIcon }],
  },
];

export function AppShell({
  children,
  title,
  subtitle,
  searchPlaceholder = 'Search',
  headerActions = null,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const profile = useMemo(() => {
    const name = localStorage.getItem('adminName') || 'Administrator';
    const email = localStorage.getItem('adminEmail') || 'admin@placetrack.com';
    const initials = name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'AD';

    return { name, email, initials };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-slate-800">
      <div className="flex min-h-screen">
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[272px] flex-col border-r border-[var(--border-soft)] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] transition-transform duration-300 lg:sticky lg:top-0 lg:z-auto lg:translate-x-0 lg:shadow-none ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-[72px] items-center justify-between border-b border-[var(--border-soft)] px-5">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1d4ed8,#4f46e5)] text-white shadow-[0_12px_30px_rgba(59,130,246,0.22)]">
                <LayoutDashboard size={20} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Placement OS
                </p>
                <h1 className="text-lg font-semibold text-slate-900">PlaceTrack</h1>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-8 overflow-y-auto px-4 py-6">
            {navigationGroups.map(group => (
              <div key={group.title}>
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {group.title}
                </p>
                <nav className="mt-3 space-y-1.5">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const active = location.pathname === item.to;

                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`group flex items-center justify-between rounded-2xl px-3 py-3 transition ${
                          active
                            ? 'bg-[var(--primary-soft)] text-[var(--primary)] shadow-[inset_0_0_0_1px_rgba(59,130,246,0.18)]'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                              active
                                ? 'bg-white text-[var(--primary)] shadow-sm'
                                : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-800'
                            }`}
                          >
                            <Icon size={18} />
                          </span>
                          <span className="text-sm font-medium">{item.label}</span>
                        </span>
                        <ChevronRight
                          size={16}
                          className={active ? 'text-[var(--primary)]' : 'text-slate-300'}
                        />
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--border-soft)] p-4">
            <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">Logged in as</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{profile.name}</p>
              <p className="text-xs text-slate-500">{profile.email}</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[var(--border-soft)] bg-white/90 backdrop-blur-xl">
            <div className="flex h-[72px] items-center gap-3 px-4 md:px-6 lg:px-8">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 lg:hidden"
              >
                <Menu size={18} />
              </button>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
                {subtitle ? (
                  <p className="truncate text-xs text-slate-500 md:text-sm">{subtitle}</p>
                ) : null}
              </div>

              <div className="hidden max-w-md flex-1 lg:block">
                <label className="relative block">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--primary-soft)]"
                  />
                </label>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                {headerActions}
                <button
                  type="button"
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
                >
                  <Bell size={18} />
                  <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </button>

                <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:flex">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#dbeafe,#e0e7ff)] text-sm font-semibold text-[var(--primary)]">
                    {profile.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{profile.name}</p>
                    <p className="truncate text-xs text-slate-500">{profile.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="h-full min-h-[calc(100vh-140px)] rounded-[24px] border border-slate-200/80 bg-white/40 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)] backdrop-blur-sm sm:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export function SectionTabs({ items }) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {items.map(item =>
        item.active ? (
          <span
            key={item.label}
            className="inline-flex items-center rounded-2xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(79,70,229,0.18)]"
          >
            {item.label}
          </span>
        ) : (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            {item.label}
          </button>
        )
      )}
    </div>
  );
}

export function SurfaceCard({ children, className = '' }) {
  return <section className={`crm-surface ${className}`.trim()}>{children}</section>;
}

export function MetricCard({ title, value, helper, tone = 'primary', icon }) {
  const toneClasses = {
    primary: 'bg-blue-50 text-blue-600',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-rose-50 text-rose-600',
  };

  return (
    <SurfaceCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</h3>
          {helper ? <p className="mt-2 text-sm text-slate-500">{helper}</p> : null}
        </div>
        {icon ? (
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClasses[tone]}`}>
            {icon}
          </div>
        ) : null}
      </div>
    </SurfaceCard>
  );
}

export function StatusBadge({ status = '' }) {
  const normalized = status.toLowerCase();

  if (normalized === 'placed') return <Badge tone="success" label={status} />;
  if (normalized.includes('seeker')) return <Badge tone="primary" label={status} />;
  if (normalized.includes('need') || normalized.includes('filled')) {
    return <Badge tone="warning" label={status} />;
  }
  if (normalized.includes('not picking') || normalized.includes('reachable')) {
    return <Badge tone="danger" label={status} />;
  }
  if (normalized.includes('interview')) return <Badge tone="info" label={status} />;
  if (normalized.includes('inactive') || normalized.includes('suspended')) return <Badge tone="neutral" label={status} />;

  return <Badge tone="neutral" label={status || 'Unknown'} />;
}

function Badge({ tone, label }) {
  const tones = {
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    primary: 'bg-blue-50 text-blue-700 ring-blue-100',
    warning: 'bg-amber-50 text-amber-700 ring-amber-100',
    info: 'bg-violet-50 text-violet-700 ring-violet-100',
    neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${tones[tone]}`}
    >
      {label}
    </span>
  );
}
