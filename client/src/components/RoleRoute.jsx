import React from 'react';
import { Navigate } from 'react-router-dom';
import { getToken, getUserRole } from '../utils/auth';

export default function RoleRoute({ roles, children }) {
  const token = getToken();
  const role = getUserRole();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(role)) {
    if (role === 'student') {
      return <Navigate to="/student/tasks" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
}
