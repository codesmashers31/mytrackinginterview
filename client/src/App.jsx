import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/StudentList';
import EligibilityPage from './pages/EligibilityPage';
import CoordinatorManagement from './pages/CoordinatorManagement';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import CoordinatorEligibility from './pages/CoordinatorEligibility';
import CoordinatorSplClasses from './pages/CoordinatorSplClasses';
import Settings from './pages/Settings';
import SplClassForm from './pages/SplClassForm';
import SplSuccess from './pages/SplSuccess';
import AttendancePage from './pages/AttendancePage';
import TaskManagement from './pages/TaskManagement';
import PlacementManagement from './pages/PlacementManagement';
import StudentTasks from './pages/StudentTasks';
import StudentAttendance from './pages/StudentAttendance';
import StudentDailyActivity from './pages/StudentDailyActivity';
import StudentDashboard from './pages/StudentDashboard';
import AdminDailyActivities from './pages/AdminDailyActivities';
import PlacementDashboard from './pages/PlacementDashboard';
import PlacementEligibility from './pages/PlacementEligibility';
import PlacementSplClasses from './pages/PlacementSplClasses';
import ResumeBuilder from './pages/ResumeBuilder';
import TeamManagement from './pages/TeamManagement';
import StudentTeams from './pages/StudentTeams';
import FrontendStudentList from './pages/FrontendStudentList';
import SplRegistrations from './pages/SplRegistrations';
import StudentAiMentorship from './pages/StudentAiMentorship';
import AdminAiMentorship from './pages/AdminAiMentorship';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import { isAuthenticated } from './utils/auth';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
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
        <Route path="/placement/eligibility" element={<RoleRoute roles={[ 'placement' ]}><PlacementEligibility /></RoleRoute>} />
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
    </BrowserRouter>
  );
}

export default App;
