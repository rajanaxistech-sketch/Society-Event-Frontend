import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUIStore } from '../store/uiStore';
import { Menu, LogOut, Building2, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppRoutes } from '../constants/routes';

export const Header: React.FC = () => {
  const { user, clearAuth, selectedSocietyId, setSelectedSocietyId, isSuperAdmin } = useAuth();
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    navigate(AppRoutes.LOGIN);
  };

  const societies = user?.societies || [];

  return (
    <header className="h-16 bg-[#F8F7FC] border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Sidebar Hamburger + Society Context Selector */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-[#EEF2FF] rounded-xl transition-colors border border-transparent hover:border-indigo-100"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Active Society Scope Dropdown */}
        {societies.length > 0 && (
          <div className="flex items-center gap-1.5 sm:gap-2 bg-white border border-[#E2E8F0] px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs max-w-[170px] xs:max-w-[220px] sm:max-w-xs transition-colors hover:border-indigo-200 shadow-2xs">
            <div className="w-5 h-5 rounded-lg bg-[#EEF2FF] flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5 text-[#6366F1]" />
            </div>
            <span className="text-slate-400 font-medium hidden md:inline shrink-0">Society:</span>
            <select
              value={selectedSocietyId || ''}
              onChange={(e) => setSelectedSocietyId(e.target.value || null)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer truncate w-full text-[11px] sm:text-xs"
              title="Select Active Society"
            >
              {isSuperAdmin && <option value="">All Societies (Global)</option>}
              {societies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.code ? `(${s.code})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: User profile menu */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[#EEF2FF] transition-colors border border-transparent hover:border-indigo-100"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {user?.fullName || 'User'}
              </span>
              <span className="text-[10px] text-[#6366F1] font-semibold">
                {user?.role?.name || 'Member'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E2E8F0] rounded-2xl shadow-card py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100 bg-[#F8F7FC]/70">
                  <p className="text-xs font-bold text-slate-900">{user?.fullName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                </div>

                <div className="px-1 py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

