import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';

const PageFallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#475569' }}>
      <div style={{ width: '24px', height: '24px', border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      Loading...
    </div>
  </div>
);

// Resilient lazy import that auto-refreshes on deployment chunk updates
const lazyWithRetry = (importFn) =>
  lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      console.warn('Chunk outdated or failed to load. Reloading for latest app bundle...', error);
      const key = 'chunk_retry_' + window.location.pathname;
      const isRefreshed = sessionStorage.getItem(key);
      if (!isRefreshed) {
        sessionStorage.setItem(key, 'true');
        window.location.reload();
        return new Promise(() => {});
      }
      sessionStorage.removeItem(key);
      throw error;
    }
  });

const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const StudentList = lazyWithRetry(() => import('./pages/StudentList'));
const EligibilityPage = lazyWithRetry(() => import('./pages/EligibilityPage'));
const CoordinatorManagement = lazyWithRetry(() => import('./pages/CoordinatorManagement'));
const CoordinatorDashboard = lazyWithRetry(() => import('./pages/CoordinatorDashboard'));
const CoordinatorEligibility = lazyWithRetry(() => import('./pages/CoordinatorEligibility'));
const CoordinatorSplClasses = lazyWithRetry(() => import('./pages/CoordinatorSplClasses'));
const Settings = lazyWithRetry(() => import('./pages/Settings'));
const SplClassForm = lazyWithRetry(() => import('./pages/SplClassForm'));
const SplSuccess = lazyWithRetry(() => import('./pages/SplSuccess'));
const AttendancePage = lazyWithRetry(() => import('./pages/AttendancePage'));
const TaskManagement = lazyWithRetry(() => import('./pages/TaskManagement'));
const PlacementManagement = lazyWithRetry(() => import('./pages/PlacementManagement'));
const StudentTasks = lazyWithRetry(() => import('./pages/StudentTasks'));
const StudentAttendance = lazyWithRetry(() => import('./pages/StudentAttendance'));
const StudentDailyActivity = lazyWithRetry(() => import('./pages/StudentDailyActivity'));
const StudentDashboard = lazyWithRetry(() => import('./pages/StudentDashboard'));
const AdminDailyActivities = lazyWithRetry(() => import('./pages/AdminDailyActivities'));
const PlacementDashboard = lazyWithRetry(() => import('./pages/PlacementDashboard'));
const PlacementEligibility = lazyWithRetry(() => import('./pages/PlacementEligibility'));
const PlacementSplClasses = lazyWithRetry(() => import('./pages/PlacementSplClasses'));
const ResumeBuilder = lazyWithRetry(() => import('./pages/ResumeBuilder'));
const TeamManagement = lazyWithRetry(() => import('./pages/TeamManagement'));
const StudentTeams = lazyWithRetry(() => import('./pages/StudentTeams'));
const FrontendStudentList = lazyWithRetry(() => import('./pages/FrontendStudentList'));
const SplRegistrations = lazyWithRetry(() => import('./pages/SplRegistrations'));
const StudentAiMentorship = lazyWithRetry(() => import('./pages/StudentAiMentorship'));
const AdminAiMentorship = lazyWithRetry(() => import('./pages/AdminAiMentorship'));
const StudentTimetable = lazyWithRetry(() => import('./pages/StudentTimetable'));
const AdminTimetables = lazyWithRetry(() => import('./pages/AdminTimetables'));
const StudentAiAptitude = lazyWithRetry(() => import('./pages/StudentAiAptitude'));
const StudentAiCommunication = lazyWithRetry(() => import('./pages/StudentAiCommunication'));
const AdminAiLearning = lazyWithRetry(() => import('./pages/AdminAiLearning'));
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import { isAuthenticated } from './utils/auth';


function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={
            isAuthenticated() ? (
              <Navigate
                to={
                  localStorage.getItem('userRole') === 'student' ? '/student/dashboard' :
                  localStorage.getItem('userRole') === 'placement' ? '/placement/dashboard' :
                  localStorage.getItem('userRole') === 'coordinator' ? '/coordinator/dashboard' : '/dashboard'
                }
                replace
              />
            ) : (
              <Login />
            )
          }
        />
        <Route path="/dashboard" element={<RoleRoute roles={[ 'admin' ]}><Dashboard /></RoleRoute>} />
        <Route path="/students" element={<RoleRoute roles={[ 'admin', 'coordinator' ]}><StudentList /></RoleRoute>} />
        <Route path="/admin/frontend-students" element={<RoleRoute roles={[ 'admin', 'coordinator' ]}><FrontendStudentList /></RoleRoute>} />
        <Route path="/eligibility" element={<RoleRoute roles={[ 'admin' ]}><EligibilityPage /></RoleRoute>} />
        <Route path="/admin/placements" element={<RoleRoute roles={[ 'admin' ]}><PlacementManagement /></RoleRoute>} />
        <Route path="/admin/coordinators" element={<RoleRoute roles={[ 'admin', 'coordinator' ]}><CoordinatorManagement /></RoleRoute>} />
        <Route path="/coordinator/dashboard" element={<RoleRoute roles={[ 'coordinator' ]}><CoordinatorDashboard /></RoleRoute>} />
        <Route path="/coordinator/eligibility" element={<RoleRoute roles={[ 'coordinator' ]}><CoordinatorEligibility /></RoleRoute>} />
        <Route path="/coordinator/spl-classes" element={<RoleRoute roles={[ 'coordinator' ]}><CoordinatorSplClasses /></RoleRoute>} />
        <Route path="/settings" element={<RoleRoute roles={[ 'admin', 'student', 'placement', 'coordinator' ]}><Settings /></RoleRoute>} />
        <Route path="/spl-registration" element={<SplClassForm />} />
        <Route path="/spl-registration/success" element={<SplSuccess />} />
        <Route path="/spl-registrations" element={<RoleRoute roles={[ 'admin', 'coordinator', 'placement' ]}><SplRegistrations /></RoleRoute>} />
        <Route path="/placement/dashboard" element={<RoleRoute roles={[ 'placement' ]}><PlacementDashboard /></RoleRoute>} />
        <Route path="/placement/eligibility" element={<RoleRoute roles={[ 'placement', 'admin' ]}><PlacementEligibility /></RoleRoute>} />
        <Route path="/placement/spl-classes" element={<RoleRoute roles={[ 'placement' ]}><PlacementSplClasses /></RoleRoute>} />
        <Route path="/attendance" element={<RoleRoute roles={[ 'admin', 'coordinator' ]}><AttendancePage /></RoleRoute>} />
        <Route path="/tasks" element={<RoleRoute roles={[ 'admin' ]}><TaskManagement /></RoleRoute>} />
        <Route path="/tasks/list" element={<Navigate to="/tasks" replace />} />
        <Route path="/student/dashboard" element={<RoleRoute roles={[ 'student' ]}><StudentDashboard /></RoleRoute>} />
        <Route path="/student/tasks" element={<RoleRoute roles={[ 'student' ]}><StudentTasks /></RoleRoute>} />
        <Route path="/student/attendance" element={<RoleRoute roles={[ 'student' ]}><StudentAttendance /></RoleRoute>} />
        <Route path="/student/daily-activity" element={<RoleRoute roles={[ 'student' ]}><StudentDailyActivity /></RoleRoute>} />
        <Route path="/student/leaves" element={<Navigate to="/student/attendance" replace />} />
        <Route path="/student/resume-builder" element={<RoleRoute roles={[ 'student' ]}><ResumeBuilder /></RoleRoute>} />
        <Route path="/admin/daily-activities" element={<RoleRoute roles={[ 'admin' ]}><AdminDailyActivities /></RoleRoute>} />
        <Route path="/admin/leaves" element={<Navigate to="/attendance" replace />} />
        <Route path="/admin/mock-interviews" element={<Navigate to="/tasks" replace />} />
        <Route path="/student/mock-interviews" element={<Navigate to="/student/tasks" replace />} />
        <Route path="/admin/teams" element={<RoleRoute roles={[ 'admin' ]}><TeamManagement /></RoleRoute>} />
        <Route path="/student/teams" element={<RoleRoute roles={[ 'student' ]}><StudentTeams /></RoleRoute>} />
        <Route path="/student/ai-mentorship" element={<RoleRoute roles={[ 'student' ]}><StudentAiMentorship /></RoleRoute>} />
        <Route path="/admin/ai-mentorship" element={<RoleRoute roles={[ 'admin', 'coordinator', 'placement' ]}><AdminAiMentorship /></RoleRoute>} />
        <Route path="/student/ai-aptitude" element={<RoleRoute roles={[ 'student' ]}><StudentAiAptitude /></RoleRoute>} />
        <Route path="/student/ai-communication" element={<RoleRoute roles={[ 'student' ]}><StudentAiCommunication /></RoleRoute>} />
        <Route path="/admin/ai-learning" element={<RoleRoute roles={[ 'admin', 'coordinator', 'placement' ]}><AdminAiLearning /></RoleRoute>} />
        <Route path="/student/timetable" element={<RoleRoute roles={[ 'student' ]}><StudentTimetable /></RoleRoute>} />
        <Route path="/admin/timetables" element={<RoleRoute roles={[ 'admin', 'coordinator', 'placement' ]}><AdminTimetables /></RoleRoute>} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
