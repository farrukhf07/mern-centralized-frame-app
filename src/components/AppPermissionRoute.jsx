import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canManageAppResources } from '../utils/permissions';

const AppPermissionRoute = ({ children }) => {
  const { appId } = useParams();
  const { user } = useAuth();

  if (!canManageAppResources(user, appId)) {
    return <Navigate to={`/categories/${appId}`} replace />;
  }

  return children;
};

export default AppPermissionRoute;
