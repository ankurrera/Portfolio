import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import PhotoUploader from '@/components/admin/PhotoUploader';
import PhotoGrid from '@/components/admin/PhotoGrid';
import { toast } from 'sonner';

type PhotoCategory = 'selected' | 'commissioned' | 'editorial' | 'personal';
const CATEGORIES: PhotoCategory[] = ['selected', 'commissioned', 'editorial', 'personal'];

interface Photo {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  display_order: number;
  category: string;
}

export default function Admin() {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PhotoCategory>('selected');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);

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

  const fetchPhotos = async () => {
    setLoadingPhotos(true);
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('category', activeTab)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching photos:', error);
      toast.error('Failed to load photos');
    } else {
      setPhotos(data || []);
    }
    setLoadingPhotos(false);
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchPhotos();
    }
  }, [activeTab, user, isAdmin]);

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
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-playfair tracking-tight text-foreground">
            Photo Manager
          </h1>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PhotoCategory)}>
          <TabsList className="mb-6 w-full justify-start">
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

          {CATEGORIES.map((cat) => (
            <TabsContent key={cat} value={cat} className="space-y-8">
              <PhotoUploader 
                category={cat} 
                onUploadComplete={fetchPhotos} 
              />
              
              {loadingPhotos ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <PhotoGrid 
                  photos={photos} 
                  onUpdate={fetchPhotos} 
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}
