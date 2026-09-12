import React from 'react';
import { useAuth } from '../hooks/useAuth';
import SuperAdminLayout from './SuperAdminLayout';
import MobileAppLayout from './MobileAppLayout';
import ToastContainer from '../components/feedback/ToastContainer';

export const AppLayout: React.FC = () => {
  const { isSuperAdmin } = useAuth();

  return (
    <>
      {isSuperAdmin ? <SuperAdminLayout /> : <MobileAppLayout />}
      <ToastContainer />
    </>
  );
};

export default AppLayout;


