import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

/**
 * Legacy Admin component - now redirects to AdminDashboard
 * Preserved for backward compatibility
 */
const Admin = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for loading to complete before making auth decisions
    if (isLoading) return;
    
    // Redirect to login if not authenticated
    if (!user) {
      navigate('/admin/login', { replace: true });
      return;
    }
    
    // Redirect to new admin dashboard if authenticated and admin
    if (isAdmin) {
      navigate('/admin/dashboard', { replace: true });
      return;
    }
    
    // Non-admin users go to login
    navigate('/admin/login', { replace: true });
  }, [user, isAdmin, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
};

export default Admin;
