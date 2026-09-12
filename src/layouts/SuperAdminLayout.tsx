import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Breadcrumbs from './Breadcrumbs';

export const SuperAdminLayout: React.FC = () => {
  return (
    <div className="flex h-screen h-[100dvh] bg-[#F3F4FA] text-slate-800 overflow-hidden font-sans antialiased">
      {/* Super Admin Desktop Sidebar */}
      <Sidebar />

      {/* Main Desktop Workspace Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F3F4FA]">
        <Header />

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5 flex flex-col justify-between bg-[#F3F4FA]">
          <div className="max-w-[1600px] mx-auto space-y-3.5 w-full">
            <Breadcrumbs />
            <Outlet />
          </div>

          {/* Super Admin App Footer */}
          <footer className="mt-4 pt-2.5 pb-1 border-t border-slate-200/80 text-center text-[11px] text-slate-400 max-w-[1600px] mx-auto w-full">
            <p>
              &copy; {new Date().getFullYear()} Society Event Management (Super Admin Platform). Developed by{' '}
              <a
                href="https://anaxistech.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                AnaxisTech
              </a>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
