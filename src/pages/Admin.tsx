import { useState, useEffect, lazy, Suspense, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PhotoCategory } from '@/types/wysiwyg';

// Lazy load the WYSIWYGEditor component
const WYSIWYGEditor = lazy(() => import('@/components/admin/WYSIWYGEditor'));

const Admin = forwardRef<HTMLDivElement>(function Admin(_, ref) {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<PhotoCategory>('selected');

  // Single effect for auth redirect - runs when auth state changes
  useEffect(() => {
    // Wait for loading to complete before making auth decisions
    if (isLoading) return;
    
    // Redirect to login if not authenticated
    if (!user) {
      navigate('/admin/login', { replace: true });
      return;
    }
    
    // Kick out non-admin users
    if (!isAdmin) {
      toast.error('You do not have admin access');
      signOut();
      navigate('/admin/login', { replace: true });
    }
  }, [user, isAdmin, isLoading, navigate, signOut]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div ref={ref} className="flex flex-col min-h-screen bg-background">
      <Suspense 
        fallback={
          <div className="flex-1 bg-background flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <WYSIWYGEditor 
          category={activeCategory} 
          onCategoryChange={setActiveCategory}
          onSignOut={handleSignOut}
        />
      </Suspense>
    </div>
  );
});

export default Admin;
