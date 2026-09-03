import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const selectedSocietyId = useAuthStore((state) => state.selectedSocietyId);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setSelectedSocietyId = useAuthStore((state) => state.setSelectedSocietyId);
  const isSuperAdmin = useAuthStore((state) => state.isSuperAdmin);

  return {
    user,
    isAuthenticated,
    selectedSocietyId,
    setAuth,
    clearAuth,
    setSelectedSocietyId,
    isSuperAdmin: isSuperAdmin(),
  };
};

export default useAuth;
