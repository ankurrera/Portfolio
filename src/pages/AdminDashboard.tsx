import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { Loader2, LogOut, Camera, FolderOpen, Code } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AdminDashboard = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

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

  const photoshootCategories = [
    {
      category: 'selected',
      title: 'Selected Works',
      description: 'Curated selection of luxury fashion campaigns and editorial work',
    },
    {
      category: 'commissioned',
      title: 'Commissioned Projects',
      description: 'Commercial fashion campaigns for luxury brands',
    },
    {
      category: 'editorial',
      title: 'Editorial Photography',
      description: 'Editorial fashion photography for leading publications',
    },
    {
      category: 'personal',
      title: 'Personal Projects',
      description: 'Artistic personal projects and creative experimentation',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-foreground" />
            <h1 className="text-xl font-semibold uppercase tracking-wider">Admin Dashboard</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Technical Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Code className="h-5 w-5 text-foreground" />
            <h2 className="text-lg font-semibold uppercase tracking-wider">Technical</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card 
              className="hover:border-foreground/20 transition-all duration-300 cursor-pointer"
              onClick={() => navigate('/admin/technical/edit')}
            >
              <CardHeader>
                <CardTitle className="text-base uppercase tracking-wider">
                  Technical Projects
                </CardTitle>
                <CardDescription className="text-sm">
                  Manage technical projects, add new projects, update metadata, and reorder
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full">
                  Manage Projects
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Photoshoots Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Camera className="h-5 w-5 text-foreground" />
            <h2 className="text-lg font-semibold uppercase tracking-wider">Photoshoots</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {photoshootCategories.map((item) => (
              <Card 
                key={item.category} 
                className="hover:border-foreground/20 transition-all duration-300 cursor-pointer"
                onClick={() => navigate(`/admin/photoshoots/${item.category}/edit`)}
              >
                <CardHeader>
                  <CardTitle className="text-base uppercase tracking-wider">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="w-full">
                    Edit Photos
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
