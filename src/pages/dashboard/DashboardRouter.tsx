import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePermission } from '../../hooks/usePermission';
import SystemDashboardPage from './SystemDashboardPage';
import SocietyAdminHomeScreen from './SocietyAdminHomeScreen';
import ResidentHomeScreen from './ResidentHomeScreen';

export const DashboardRouter: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const { isResident } = usePermission();

  if (isSuperAdmin) {
    return <SystemDashboardPage />;
  }

  if (isResident) {
    return <ResidentHomeScreen />;
  }

  // Society Admin & Admin roles
  return <SocietyAdminHomeScreen />;
};

export default DashboardRouter;
