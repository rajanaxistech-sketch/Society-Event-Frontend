import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Breadcrumbs from './Breadcrumbs';
import ToastContainer from '../components/feedback/ToastContainer';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen h-[100dvh] bg-[#F3F4FA] text-slate-800 overflow-hidden font-sans antialiased">
      {/* Dynamic Sidebar */}
      <Sidebar />

      {/* Main Workspace Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F3F4FA]">
        <Header />

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-between bg-[#F3F4FA]">
          <div className="max-w-7xl mx-auto space-y-5 w-full">
            <Breadcrumbs />
            <Outlet />
          </div>

          {/* App Footer */}
          <footer className="mt-8 pt-4 pb-2 border-t border-slate-200/80 text-center text-xs text-slate-500 max-w-7xl mx-auto w-full">
            <p>
              &copy; {new Date().getFullYear()} Society Event Management. Powered & Developed by{' '}
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

      {/* Global Toast System */}
      <ToastContainer />
    </div>
  );
};

export default AppLayout;

