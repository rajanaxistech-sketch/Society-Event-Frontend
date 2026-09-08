import { useAuthStore } from '../store/authStore';

export const usePermission = () => {
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission);
  const hasAllPermissions = useAuthStore((state) => state.hasAllPermissions);
  const isSuperAdminFn = useAuthStore((state) => state.isSuperAdmin);

  const superAdmin = isSuperAdminFn();
  const roleName = user?.role?.name?.toLowerCase() || '';
  const isAdmin =
    superAdmin ||
    roleName === 'admin' ||
    roleName === 'society admin' ||
    roleName === 'society_admin';
  const isResident = !superAdmin && !isAdmin;

  return {
    can: hasPermission,
    canAny: hasAnyPermission,
    canAll: hasAllPermissions,
    isSuperAdmin: superAdmin,
    isAdmin,
    isResident,
  };
};

export default usePermission;
