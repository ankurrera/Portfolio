import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

// Lazy load the WYSIWYGEditor component
const WYSIWYGEditor = lazy(() => import('@/components/admin/WYSIWYGEditor'));

const AdminArtisticEdit = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeCategory] = useState<'artistic'>('artistic');

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
    <div className="flex flex-col min-h-screen bg-background">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-border bg-background z-40">
        <div className="container mx-auto px-4 py-3">
          <Link 
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="mt-2 text-xs text-muted-foreground">
            Admin / Artistic
          </div>
        </div>
      </div>

      <Suspense 
        fallback={
          <div className="flex-1 bg-background flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <WYSIWYGEditor 
          category={activeCategory} 
          onCategoryChange={() => {}} // No category switching for artistic
          onSignOut={handleSignOut}
        />
      </Suspense>
    </div>
  );
};

export default AdminArtisticEdit;
