import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isadmin } from '../utils/permissions';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { token, user, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="page-wrapper">
        <div className="container-fluid">
          <div className="loading-container">
            <div className="spinner-glow"></div>
            <span className="loading-text">Checking access...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isadmin(user)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
