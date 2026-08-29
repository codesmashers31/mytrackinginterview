import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const StudentList = lazy(() => import('./pages/StudentList'));
const EligibilityPage = lazy(() => import('./pages/EligibilityPage'));
const CoordinatorManagement = lazy(() => import('./pages/CoordinatorManagement'));
const CoordinatorDashboard = lazy(() => import('./pages/CoordinatorDashboard'));
const CoordinatorEligibility = lazy(() => import('./pages/CoordinatorEligibility'));
const CoordinatorSplClasses = lazy(() => import('./pages/CoordinatorSplClasses'));
const Settings = lazy(() => import('./pages/Settings'));
const SplClassForm = lazy(() => import('./pages/SplClassForm'));
const SplSuccess = lazy(() => import('./pages/SplSuccess'));
const AttendancePage = lazy(() => import('./pages/AttendancePage'));
const TaskManagement = lazy(() => import('./pages/TaskManagement'));
const PlacementManagement = lazy(() => import('./pages/PlacementManagement'));
const StudentTasks = lazy(() => import('./pages/StudentTasks'));
const StudentAttendance = lazy(() => import('./pages/StudentAttendance'));
const StudentDailyActivity = lazy(() => import('./pages/StudentDailyActivity'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const AdminDailyActivities = lazy(() => import('./pages/AdminDailyActivities'));
const PlacementDashboard = lazy(() => import('./pages/PlacementDashboard'));
const PlacementEligibility = lazy(() => import('./pages/PlacementEligibility'));
const PlacementSplClasses = lazy(() => import('./pages/PlacementSplClasses'));
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder'));
const TeamManagement = lazy(() => import('./pages/TeamManagement'));
const StudentTeams = lazy(() => import('./pages/StudentTeams'));
const FrontendStudentList = lazy(() => import('./pages/FrontendStudentList'));
const SplRegistrations = lazy(() => import('./pages/SplRegistrations'));
const StudentAiMentorship = lazy(() => import('./pages/StudentAiMentorship'));
const AdminAiMentorship = lazy(() => import('./pages/AdminAiMentorship'));
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import { isAuthenticated } from './utils/auth';

const PageFallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
    Loading...
  </div>
);

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
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
