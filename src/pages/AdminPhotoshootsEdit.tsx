import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { PhotoCategory } from '@/types/wysiwyg';
import { Button } from '@/components/ui/button';

// Lazy load the WYSIWYGEditor component
const WYSIWYGEditor = lazy(() => import('@/components/admin/WYSIWYGEditor'));

const AdminPhotoshootsEdit = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();
  const [activeCategory, setActiveCategory] = useState<PhotoCategory>(
    (category as PhotoCategory) || 'selected'
  );

  // Validate category parameter
  useEffect(() => {
    const validCategories: PhotoCategory[] = ['selected', 'commissioned', 'editorial', 'personal'];
    if (category && !validCategories.includes(category as PhotoCategory)) {
      navigate('/admin/dashboard', { replace: true });
      return;
    }
    if (category) {
      setActiveCategory(category as PhotoCategory);
    }
  }, [category, navigate]);

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

  const handleCategoryChange = (newCategory: PhotoCategory) => {
    setActiveCategory(newCategory);
    navigate(`/admin/photoshoots/${newCategory}/edit`, { replace: true });
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

  const categoryTitles: Record<PhotoCategory, string> = {
    selected: 'Selected Works',
    commissioned: 'Commissioned Projects',
    editorial: 'Editorial Photography',
    personal: 'Personal Projects',
  } as const;

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
            Admin / Photoshoots / {categoryTitles[activeCategory]}
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
          onCategoryChange={handleCategoryChange}
          onSignOut={handleSignOut}
        />
      </Suspense>
    </div>
  );
};

export default AdminPhotoshootsEdit;
