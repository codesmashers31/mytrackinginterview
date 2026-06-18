import React, { useMemo, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings as SettingsIcon,
  Users,
  X,
  BriefcaseBusiness,
  FileText
} from 'lucide-react';
import { logout, authHeaders } from '../utils/auth';
import { buildApiUrl } from '../utils/api';
import toast from 'react-hot-toast';

const buildNavigationGroups = (role, onLogout) => {
  // Student navigation
  if (role === 'student') {
    return [
      {
        title: 'Workspace',
        items: [
          { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/student/tasks', label: 'My Tasks', icon: ClipboardList },
          { to: '/student/daily-activity', label: 'Daily Activity', icon: Clock },
          { to: '/student/attendance', label: 'My Attendance', icon: Calendar },
          { to: '/student/leaves', label: 'Leaves & Permissions', icon: FileText },
          { to: '/student/resume-builder', label: 'Resume Builder', icon: FileText },
          { to: '/student/mock-interviews', label: 'Mock Interviews', icon: CheckCircle2 },
          { to: '/settings', label: 'Settings', icon: SettingsIcon },
        ],
      },
      {
        title: 'Account',
        items: [
          { label: 'Sign Out', icon: LogOut, onClick: onLogout, isLogout: true },
        ],
      },
    ];
  }

  // Coordinator navigation
  if (role === 'coordinator') {
    return [
      {
        title: 'Workspace',
        items: [
          { to: '/coordinator/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/students', label: 'Students', icon: Users },
          { to: '/coordinator/eligibility', label: 'Eligibility', icon: CheckCircle2 },
          { to: '/admin/coordinators', label: 'Coordinators', icon: Users },
          { to: '/coordinator/spl-classes', label: 'SPL Classes', icon: Users },
          { to: '/admin/leaves', label: 'Leave Requests', icon: Calendar },
          { to: '/settings', label: 'Settings', icon: SettingsIcon },
        ],
      },
      {
        title: 'Account',
        items: [
          { label: 'Sign Out', icon: LogOut, onClick: onLogout, isLogout: true },
        ],
      },
    ];
  }

  // Placement navigation
  if (role === 'placement') {
    return [
      {
        title: 'Workspace',
        items: [
          { to: '/placement/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/placement/eligibility', label: 'Eligible Students', icon: CheckCircle2 },
          { to: '/placement/spl-classes', label: 'SPL Classes', icon: Users },
          { to: '/settings', label: 'Settings', icon: SettingsIcon },
        ],
      },
      {
        title: 'Account',
        items: [
          { label: 'Sign Out', icon: LogOut, onClick: onLogout, isLogout: true },
        ],
      },
    ];
  }

  // Admin navigation (default)
  return [
    {
      title: 'Workspace',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/spl-registrations', label: 'SPL Registrations', icon: Users },
        { to: '/attendance', label: 'Attendance', icon: Calendar },
        { to: '/admin/leaves', label: 'Leave Requests', icon: Calendar },
        { to: '/admin/daily-activities', label: 'Daily Logs', icon: Clock },
        { to: '/students', label: 'Students', icon: Users },
        { to: '/admin/frontend-students', label: 'Frontend Students', icon: Users },
        { to: '/eligibility', label: 'Eligibility', icon: CheckCircle2 },
        { to: '/tasks', label: 'Task Assignment', icon: ClipboardList },
        { to: '/tasks/list', label: 'Assigned Tasks', icon: CheckCircle2 },
        { to: '/admin/mock-interviews', label: 'Mock Board', icon: ClipboardList },
      ],
    },
    {
      title: 'Administration',
      items: [
        { to: '/admin/placements', label: 'Placement Team', icon: BriefcaseBusiness },
        { to: '/settings', label: 'Settings', icon: SettingsIcon }
      ],
    },
    {
      title: 'Account',
      items: [
        { label: 'Sign Out', icon: LogOut, onClick: onLogout, isLogout: true },
      ],
    },
  ];
};

export function AppShell({
  children,
  title,
  subtitle,
  searchPlaceholder = 'Search',
  searchValue = '',
  onSearchChange = null,
  headerActions = null,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const role = localStorage.getItem('userRole') || 'admin';

  // Notifications State & Actions
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(buildApiUrl('/notifications'), {
        headers: authHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      const res = await fetch(buildApiUrl('/notifications/mark-all-read'), {
        method: 'PUT',
        headers: authHeaders()
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const markNotificationRead = async (id) => {
    try {
      const res = await fetch(buildApiUrl(`/notifications/${id}/read`), {
        method: 'PUT',
        headers: authHeaders()
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Fetch notifications and setup reminders
  useEffect(() => {
    fetchNotifications();
    const notificationInterval = setInterval(fetchNotifications, 15000);

    let checkoutTimeoutId = null;

    const setupReminders = async () => {
      if (role !== 'student') return;

      try {
        const res = await fetch(buildApiUrl('/attendance/today'), {
          headers: authHeaders()
        });
        if (res.ok) {
          const attendance = await res.json();

          if (!attendance) {
            // Student has not checked in today
            const now = new Date();
            const day = now.getDay();
            if (day >= 1 && day <= 5) { // Weekdays
              const hour = now.getHours();
              const minute = now.getMinutes();
              const minsSinceMidnight = hour * 60 + minute;
              const checkInTargetMins = 9 * 60; // 9:00 AM

              // Show reminder if it is between 8:00 AM and 9:15 AM
              if (minsSinceMidnight >= 8 * 60 && minsSinceMidnight <= 9 * 60 + 15) {
                const diffMins = checkInTargetMins - minsSinceMidnight;
                if (diffMins > 0 && diffMins <= 10) {
                  toast.error(`⏰ Check-in Reminder: You have only ${diffMins} minutes left to check in before 9:00 AM!`, {
                    duration: 15000
                  });
                } else if (diffMins > 0) {
                  toast(`⏰ Check-in Reminder: Please check in soon! Standard check-in is before 9:00 AM.`, {
                    duration: 10000
                  });
                } else {
                  toast.error(`⏰ Check-in Reminder: You are late for check-in today! Please check in immediately.`, {
                    duration: 15000
                  });
                }
              }
            }
          } else if (attendance.checkInTime && !attendance.checkOutTime) {
            // Student checked in but not checked out yet
            const checkInDate = new Date(attendance.checkInTime);
            const expectedCheckout = new Date(checkInDate.getTime() + 9 * 60 * 60 * 1000); // 9 hours later
            const warningTime = new Date(expectedCheckout.getTime() - 10 * 60 * 1000); // 10 minutes before
            const now = new Date();

            const msToWarning = warningTime.getTime() - now.getTime();
            const msToCheckout = expectedCheckout.getTime() - now.getTime();

            if (checkoutTimeoutId) clearTimeout(checkoutTimeoutId);

            if (msToWarning > 0) {
              checkoutTimeoutId = setTimeout(() => {
                toast.success("⏰ Checkout Reminder: 10 minutes left until your checkout time! Don't forget to check out.", {
                  duration: 15000,
                  icon: '⏰'
                });
              }, msToWarning);
            } else if (msToCheckout > 0) {
              const minsLeft = Math.ceil(msToCheckout / (60 * 1000));
              toast.success(`⏰ Checkout Reminder: Only ${minsLeft} minutes left before your checkout time! Don't forget to check out.`, {
                duration: 15000,
                icon: '⏰'
              });
            } else {
              toast.error("⏰ Overtime Alert: You have exceeded your 9-hour shift. Please check out now!", {
                duration: 15000,
                icon: '⏰'
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to setup reminders:', err);
      }
    };

    setupReminders();
    // Re-run reminders check every 5 minutes
    const reminderInterval = setInterval(setupReminders, 5 * 60 * 1000);

    return () => {
      clearInterval(notificationInterval);
      clearInterval(reminderInterval);
      if (checkoutTimeoutId) clearTimeout(checkoutTimeoutId);
    };
  }, [role]);

  const profile = useMemo(() => {
    const name = localStorage.getItem('userName') || 'Administrator';
    const email = localStorage.getItem('userEmail') || 'admin@placetrack.com';
    const initials = name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'AD';

    return { name, email, initials };
  }, []);

  const handleLogout = () => {
    logout();
  };

  const navigationGroups = useMemo(() => buildNavigationGroups(role, handleLogout), [role]);

  return (
    <div className="h-screen overflow-hidden bg-[var(--app-bg)] text-slate-800">
      <div className="flex h-full">
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex h-screen w-full ${sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-[272px]'} flex-col border-r border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] transition-all duration-300 lg:sticky lg:top-0 lg:z-auto lg:translate-x-0 lg:shadow-none lg:h-full lg:w-auto overflow-y-auto ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200 px-5 bg-white">
            <Link to="/dashboard" className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center w-full' : ''}`}>
              <img src="/logo.png" alt="PlaceTrack Logo" className="h-11 w-11 object-contain shrink-0" />
              {!sidebarCollapsed && (
                <div className="overflow-hidden">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Placement OS
                  </p>
                  <h1 className="text-lg font-semibold text-slate-900 truncate">PlaceTrack</h1>
                </div>
              )}
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSidebarCollapsed(prev => !prev)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
              >
                {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronRight size={18} className="rotate-180" />}
              </button>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-8 px-4 py-6 bg-white">
            {navigationGroups.map(group => (
              <div key={group.title}>
                {!sidebarCollapsed && (
                  <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    {group.title}
                  </p>
                )}
                <nav className="mt-3 space-y-1.5">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const active = item.to ? location.pathname === item.to : false;

                    const itemClassName = `group flex w-full items-center ${
                      sidebarCollapsed ? 'justify-center' : 'justify-between hover:translate-x-1'
                    } rounded-2xl px-3 py-3 transition-all duration-200 ${
                      item.isLogout
                        ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                        : active
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50/80 text-blue-700 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.15),0_4px_12px_rgba(59,130,246,0.04)] font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`;

                    const iconWrapperClassName = `flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 ${
                      item.isLogout
                        ? 'bg-rose-100 text-rose-600'
                        : active
                        ? 'bg-white text-[var(--primary)] shadow-sm'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-800'
                    }`;

                    const labelContent = (
                      <>
                        <span className="flex flex-1 items-center gap-3 overflow-hidden">
                          <span className={iconWrapperClassName}>
                            <Icon size={18} />
                          </span>
                          {!sidebarCollapsed && <span className="truncate text-sm font-medium">{item.label}</span>}
                        </span>
                        {!sidebarCollapsed && (
                          <ChevronRight
                            size={16}
                            className={`shrink-0 ${active ? 'text-[var(--primary)] transition-transform group-hover:translate-x-0.5' : 'text-slate-300 transition-transform group-hover:translate-x-0.5'}`}
                          />
                        )}
                      </>
                    );

                    if (item.onClick) {
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={item.onClick}
                          className={itemClassName}
                        >
                          {labelContent}
                        </button>
                      );
                    }

                    return (
                      <Link key={item.to} to={item.to} className={itemClassName}>
                        {labelContent}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 p-4 bg-white shrink-0">
            {!sidebarCollapsed && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500">Logged in as</p>
                <p className="mt-1 text-sm font-semibold text-slate-900 truncate">{profile.name}</p>
                <p className="text-xs text-slate-500 truncate">{profile.email}</p>
              </div>
            )}
          </div>
        </aside>

        <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-slate-50 transition-all duration-300">
          <header className="shrink-0 border-b border-slate-200 bg-white">
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

              {onSearchChange && (
                <div className="hidden sm:block max-w-xs md:max-w-md flex-1">
                  <label className="relative block">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder={searchPlaceholder}
                      value={searchValue}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--primary-soft)]"
                    />
                  </label>
                </div>
              )}

              <div className="flex items-center gap-2 md:gap-3">
                {headerActions}
                
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
                  >
                    <Bell size={18} />
                    {notifications.some(n => !n.isRead) && (
                      <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                    )}
                  </button>
                  
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50">
                      <div className="flex justify-between items-center mb-3 pb-2 border-b">
                        <span className="font-bold text-sm text-slate-800">Notifications</span>
                        <button 
                          onClick={markAllNotificationsRead} 
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Mark all read
                        </button>
                      </div>
                      <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="text-center py-6 text-xs text-slate-400 font-medium">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map(n => (
                            <div 
                              key={n._id}
                              onClick={() => markNotificationRead(n._id)}
                              className={`p-2.5 hover:bg-slate-50 rounded-xl transition cursor-pointer text-left border-l-4 ${
                                n.isRead ? 'border-transparent opacity-75' : 'border-blue-600 bg-blue-50/10'
                              }`}
                            >
                              <p className={`text-xs font-bold ${n.isRead ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                              <p className="text-[9px] text-slate-400 mt-1">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

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

          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="min-h-[calc(100vh-140px)] rounded-[24px] border border-slate-200/80 bg-white/40 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)] backdrop-blur-sm sm:p-6">
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
