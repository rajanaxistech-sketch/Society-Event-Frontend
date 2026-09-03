import { create } from 'zustand';
import { AuthTokens, AuthUser } from '../types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  selectedSocietyId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (tokens: AuthTokens, user: AuthUser) => void;
  updateUser: (user: Partial<AuthUser>) => void;
  clearAuth: () => void;
  setSelectedSocietyId: (societyId: string | null) => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isSuperAdmin: () => boolean;
}

const getStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem('authUser');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const initialAccessToken = localStorage.getItem('accessToken');
const initialRefreshToken = localStorage.getItem('refreshToken');
const initialUser = getStoredUser();

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: initialAccessToken,
  refreshToken: initialRefreshToken,
  user: initialUser,
  selectedSocietyId: initialUser?.societies?.[0]?.id || null,
  isAuthenticated: !!initialAccessToken && !!initialUser,
  isLoading: false,

  setAuth: (tokens: AuthTokens, user: AuthUser) => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('authUser', JSON.stringify(user));

    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
      selectedSocietyId: user.societies?.[0]?.id || null,
      isAuthenticated: true,
    });
  },

  updateUser: (partialUser: Partial<AuthUser>) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...partialUser };
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },

  clearAuth: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authUser');

    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      selectedSocietyId: null,
      isAuthenticated: false,
    });
  },

  setSelectedSocietyId: (societyId: string | null) => {
    set({ selectedSocietyId: societyId });
  },

  isSuperAdmin: () => {
    const user = get().user;
    return (
      user?.role?.name?.toLowerCase() === 'super admin' ||
      user?.role?.name?.toLowerCase() === 'superadmin'
    );
  },

  hasPermission: (permission: string) => {
    const { user, isSuperAdmin } = get();
    if (!user) return false;
    if (isSuperAdmin()) return true;
    return user.permissions?.includes(permission) || false;
  },

  hasAnyPermission: (permissions: string[]) => {
    const { user, isSuperAdmin } = get();
    if (!user) return false;
    if (isSuperAdmin()) return true;
    return permissions.some((p) => user.permissions?.includes(p));
  },

  hasAllPermissions: (permissions: string[]) => {
    const { user, isSuperAdmin } = get();
    if (!user) return false;
    if (isSuperAdmin()) return true;
    return permissions.every((p) => user.permissions?.includes(p));
  },
}));
