import { useAuthStore } from '../store/authStore';

export const usePermission = () => {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission);
  const hasAllPermissions = useAuthStore((state) => state.hasAllPermissions);
  const isSuperAdmin = useAuthStore((state) => state.isSuperAdmin);

  return {
    can: hasPermission,
    canAny: hasAnyPermission,
    canAll: hasAllPermissions,
    isSuperAdmin: isSuperAdmin(),
  };
};

export default usePermission;
