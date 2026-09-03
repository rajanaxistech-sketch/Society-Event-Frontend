import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import { AppRoutes } from '../constants/routes';

export interface PermissionRouteProps {
  permission: string;
  children?: React.ReactNode;
}

export const PermissionRoute: React.FC<PermissionRouteProps> = ({ permission, children }) => {
  const { can, isSuperAdmin } = usePermission();

  if (!isSuperAdmin && !can(permission)) {
    return <Navigate to={AppRoutes.UNAUTHORIZED} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default PermissionRoute;
