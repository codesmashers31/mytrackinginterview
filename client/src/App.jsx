import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/StudentList';
import EligibilityPage from './pages/EligibilityPage';
import Settings from './pages/Settings';
import SplClassForm from './pages/SplClassForm';
import SplRegistrations from './pages/SplRegistrations';
import SplSuccess from './pages/SplSuccess';
import AttendancePage from './pages/AttendancePage';
import TaskManagement from './pages/TaskManagement';
import TaskList from './pages/TaskList';
import StudentTasks from './pages/StudentTasks';
import StudentAttendance from './pages/StudentAttendance';
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
                to={localStorage.getItem('userRole') === 'student' ? '/student/tasks' : '/dashboard'}
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
        <Route path="/settings" element={<RoleRoute roles={[ 'admin', 'student' ]}><Settings /></RoleRoute>} />
        <Route path="/spl-registration" element={<SplClassForm />} />
        <Route path="/spl-registration/success" element={<SplSuccess />} />
        <Route path="/spl-registrations" element={<RoleRoute roles={[ 'admin' ]}><SplRegistrations /></RoleRoute>} />
        <Route path="/attendance" element={<RoleRoute roles={[ 'admin' ]}><AttendancePage /></RoleRoute>} />
        <Route path="/tasks" element={<RoleRoute roles={[ 'admin' ]}><TaskManagement /></RoleRoute>} />
        <Route path="/tasks/list" element={<RoleRoute roles={[ 'admin' ]}><TaskList /></RoleRoute>} />
        <Route path="/student/tasks" element={<RoleRoute roles={[ 'student' ]}><StudentTasks /></RoleRoute>} />
        <Route path="/student/attendance" element={<RoleRoute roles={[ 'student' ]}><StudentAttendance /></RoleRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
