import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Lazy load the WYSIWYGEditor component
const WYSIWYGEditor = lazy(() => import('@/components/admin/WYSIWYGEditor'));

type PhotoCategory = 'selected' | 'commissioned' | 'editorial' | 'personal';
const CATEGORIES: PhotoCategory[] = ['selected', 'commissioned', 'editorial', 'personal'];

export default function Admin() {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PhotoCategory>('selected');

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/admin/login');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      toast.error('You do not have admin access');
      signOut();
      navigate('/admin/login');
    }
  }, [isAdmin, isLoading, user, navigate, signOut]);

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
    <div className="min-h-screen bg-background">
      {/* Simple header for sign out - main toolbar is in WYSIWYGEditor */}
      <div className="fixed top-2 right-4 z-[60]">
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PhotoCategory)}>
        {/* Category tabs - positioned below the main toolbar */}
        <div className="fixed top-16 left-0 right-0 z-40 bg-background border-b border-border">
          <div className="container mx-auto px-4">
            <TabsList className="w-full justify-start">
              {CATEGORIES.map((cat) => (
                <TabsTrigger 
                  key={cat} 
                  value={cat}
                  className="capitalize"
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {/* Editor content - add top padding for both toolbars */}
        <div className="pt-16">
          {CATEGORIES.map((cat) => (
            <TabsContent key={cat} value={cat} className="mt-0">
              {/* Only render the editor when this tab is active */}
              {activeTab === cat && (
                <Suspense 
                  fallback={
                    <div className="min-h-screen bg-background flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  }
                >
                  <WYSIWYGEditor category={cat} />
                </Suspense>
              )}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
