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
  const [authChecked, setAuthChecked] = useState(false);

  // Single effect for auth redirect - only runs once auth is loaded
  useEffect(() => {
    if (isLoading) return;
    
    // Mark auth as checked to prevent re-running
    if (authChecked) return;
    setAuthChecked(true);
    
    if (!user) {
      navigate('/admin/login', { replace: true });
      return;
    }
    
    if (!isAdmin) {
      toast.error('You do not have admin access');
      signOut();
      navigate('/admin/login', { replace: true });
    }
  }, [user, isAdmin, isLoading, navigate, signOut, authChecked]);

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
