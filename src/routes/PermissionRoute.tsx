import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import { AppRoutes } from '../constants/routes';

export interface PermissionRouteProps {
  permission: string;
}

export const PermissionRoute: React.FC<PermissionRouteProps> = ({ permission }) => {
  const { can, isSuperAdmin } = usePermission();

  if (!isSuperAdmin && !can(permission)) {
    return <Navigate to={AppRoutes.UNAUTHORIZED} replace />;
  }

  return <Outlet />;
};

export default PermissionRoute;
