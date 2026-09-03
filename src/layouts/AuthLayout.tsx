import React from 'react';
import { Outlet } from 'react-router-dom';
import ToastContainer from '../components/feedback/ToastContainer';
import { Sparkles } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-900 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="w-full sm:mx-auto sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 mb-3 sm:mb-4">
          <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight px-2">
          Society & Community Event Management
        </h2>
        <p className="mt-1.5 sm:mt-2 text-xs text-slate-400">
          Secure Administrative Portal & Community Operations
        </p>
      </div>

      {/* Auth Content Card */}
      <div className="mt-6 sm:mt-8 w-full sm:mx-auto sm:max-w-md z-10">
        <div className="bg-white py-6 px-5 sm:py-8 sm:px-10 shadow-2xl rounded-2xl border border-slate-100">
          <Outlet />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-slate-400 z-10 space-y-1">
        <div>&copy; {new Date().getFullYear()} Society & Community Event Management System.</div>
        <div className="text-slate-500">
          Powered & Developed by{' '}
          <a
            href="https://anaxistech.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            AnaxisTech
          </a>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default AuthLayout;
