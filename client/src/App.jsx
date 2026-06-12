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
import SplRegistrations from './pages/SplRegistrations';
import SplSuccess from './pages/SplSuccess';
import AttendancePage from './pages/AttendancePage';
import TaskManagement from './pages/TaskManagement';
import TaskList from './pages/TaskList';
import PlacementManagement from './pages/PlacementManagement';
import StudentTasks from './pages/StudentTasks';
import StudentAttendance from './pages/StudentAttendance';
import StudentDailyActivity from './pages/StudentDailyActivity';
import StudentDashboard from './pages/StudentDashboard';
import AdminDailyActivities from './pages/AdminDailyActivities';
import PlacementDashboard from './pages/PlacementDashboard';
import PlacementEligibility from './pages/PlacementEligibility';
import PlacementSplClasses from './pages/PlacementSplClasses';
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
        <Route path="/students" element={<RoleRoute roles={[ 'admin' ]}><StudentList /></RoleRoute>} />
        <Route path="/eligibility" element={<RoleRoute roles={[ 'admin' ]}><EligibilityPage /></RoleRoute>} />
        <Route path="/admin/placements" element={<RoleRoute roles={[ 'admin' ]}><PlacementManagement /></RoleRoute>} />
        <Route path="/coordinator/dashboard" element={<RoleRoute roles={[ 'coordinator' ]}><CoordinatorDashboard /></RoleRoute>} />
        <Route path="/coordinator/eligibility" element={<RoleRoute roles={[ 'coordinator' ]}><CoordinatorEligibility /></RoleRoute>} />
        <Route path="/coordinator/spl-classes" element={<RoleRoute roles={[ 'coordinator' ]}><CoordinatorSplClasses /></RoleRoute>} />
        <Route path="/settings" element={<RoleRoute roles={[ 'admin', 'student', 'placement' ]}><Settings /></RoleRoute>} />
        <Route path="/spl-registration" element={<SplClassForm />} />
        <Route path="/spl-registration/success" element={<SplSuccess />} />
        <Route path="/spl-registrations" element={<RoleRoute roles={[ 'admin' ]}><SplRegistrations /></RoleRoute>} />
        <Route path="/placement/dashboard" element={<RoleRoute roles={[ 'placement' ]}><PlacementDashboard /></RoleRoute>} />
        <Route path="/placement/eligibility" element={<RoleRoute roles={[ 'placement' ]}><PlacementEligibility /></RoleRoute>} />
        <Route path="/placement/spl-classes" element={<RoleRoute roles={[ 'placement' ]}><PlacementSplClasses /></RoleRoute>} />
        <Route path="/attendance" element={<RoleRoute roles={[ 'admin' ]}><AttendancePage /></RoleRoute>} />
        <Route path="/tasks" element={<RoleRoute roles={[ 'admin' ]}><TaskManagement /></RoleRoute>} />
        <Route path="/tasks/list" element={<RoleRoute roles={[ 'admin' ]}><TaskList /></RoleRoute>} />
        <Route path="/student/dashboard" element={<RoleRoute roles={[ 'student' ]}><StudentDashboard /></RoleRoute>} />
        <Route path="/student/tasks" element={<RoleRoute roles={[ 'student' ]}><StudentTasks /></RoleRoute>} />
        <Route path="/student/attendance" element={<RoleRoute roles={[ 'student' ]}><StudentAttendance /></RoleRoute>} />
        <Route path="/student/daily-activity" element={<RoleRoute roles={[ 'student' ]}><StudentDailyActivity /></RoleRoute>} />
        <Route path="/admin/daily-activities" element={<RoleRoute roles={[ 'admin' ]}><AdminDailyActivities /></RoleRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
