import React from 'react';
import { Outlet } from 'react-router-dom';
import ToastContainer from '../components/feedback/ToastContainer';
import { Sparkles } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#F3F4FA] text-[#1E293B] flex flex-col justify-center py-6 sm:py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Decorative Soft Lavender & Purple Accents */}
      <div className="absolute top-0 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-[#6366F1]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="w-full sm:mx-auto sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-white shadow-soft mb-2.5">
          <Sparkles className="w-5 h-5" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight px-2">
          Society & Community Hub
        </h2>
        <p className="mt-0.5 text-[11px] text-slate-500">
          Soft Lavender Community Management Portal
        </p>
      </div>

      {/* Auth Content Card */}
      <div className="mt-4 sm:mt-5 w-full sm:mx-auto sm:max-w-md z-10">
        <div className="bg-white py-5 px-5 sm:py-6 sm:px-7 shadow-card rounded-xl border border-[#E2E8F0]">
          <Outlet />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-[11px] text-slate-400 z-10 space-y-0.5">
        <div>&copy; {new Date().getFullYear()} Society & Community Event Management System.</div>
        <div className="text-slate-400">
          Powered by{' '}
          <a
            href="https://anaxistech.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#6366F1] hover:text-[#4F46E5] font-semibold transition-colors"
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

