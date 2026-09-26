import React from 'react';
import { Outlet } from 'react-router-dom';
import ToastContainer from '../components/feedback/ToastContainer';
import { Sparkles } from 'lucide-react';
import anaxistechLogo from '../assets/anaxistech-logo.png';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#F3F4FA] text-[#1E293B] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Decorative Soft Lavender & Purple Accents */}
      <div className="absolute top-0 left-1/4 w-80 sm:w-[420px] h-80 sm:h-[420px] bg-[#6366F1]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 sm:w-[420px] h-80 sm:h-[420px] bg-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="w-full sm:mx-auto sm:max-w-[460px] text-center z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-white shadow-md shadow-indigo-200 mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight px-2">
          Society & Community Hub
        </h2>
        <p className="mt-1 text-sm sm:text-[15px] text-slate-500 font-medium">
          Soft Lavender Community Management Portal
        </p>
      </div>

      {/* Auth Content Card */}
      <div className="mt-5 sm:mt-6 w-full sm:mx-auto sm:max-w-[460px] z-10">
        <div className="bg-white py-6 px-6 sm:py-8 sm:px-8 shadow-xl shadow-indigo-100/60 rounded-2xl border border-slate-200/80">
          <Outlet />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs sm:text-[13px] text-slate-400 z-10 space-y-1.5 font-medium">
        <div>&copy; {new Date().getFullYear()} Society & Community Event Management System.</div>
        <div className="text-slate-400 flex items-center justify-center gap-1.5">
          <span>Powered by</span>
          <a
            href="https://anaxistech.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center hover:opacity-85 transition-opacity"
          >
            <img src={anaxistechLogo} alt="AnaxisTech" className="h-5 w-auto object-contain" />
          </a>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default AuthLayout;

