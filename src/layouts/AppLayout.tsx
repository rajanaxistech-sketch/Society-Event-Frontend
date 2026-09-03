import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Breadcrumbs from './Breadcrumbs';
import ToastContainer from '../components/feedback/ToastContainer';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen h-[100dvh] bg-slate-50 text-slate-900 overflow-hidden font-sans antialiased">
      {/* Dynamic Sidebar */}
      <Sidebar />

      {/* Main Workspace Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-4">
            <Breadcrumbs />
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Toast System */}
      <ToastContainer />
    </div>
  );
};

export default AppLayout;
