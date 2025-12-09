import { useLocation } from 'react-router-dom';

/**
 * Hook to detect if the current route is an admin route.
 * Admin routes are those starting with /admin
 */
export const useIsAdminRoute = (): boolean => {
  const location = useLocation();
  return location.pathname.startsWith('/admin');
};
