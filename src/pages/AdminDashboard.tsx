import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { Loader2, LogOut, Camera, FolderOpen, Code2, Trophy, Type, User } from 'lucide-react';
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
        {/* Hero Sections */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Type className="h-5 w-5 text-foreground" />
            <h2 className="text-lg font-semibold uppercase tracking-wider">Hero Sections</h2>
          </div>
          
          <Card 
            className="hover:border-foreground/20 transition-all duration-300 cursor-pointer max-w-md"
            onClick={() => navigate('/admin/hero/edit')}
          >
            <CardHeader>
              <CardTitle className="text-base uppercase tracking-wider">
                Hero Text Management
              </CardTitle>
              <CardDescription className="text-sm">
                Manage hero sections across all pages from one central location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full">
                Edit Hero Sections
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Photoshoots Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Camera className="h-5 w-5 text-foreground" />
            <h2 className="text-lg font-semibold uppercase tracking-wider">Photoshoots</h2>
          </div>
          
          <Card 
            className="hover:border-foreground/20 transition-all duration-300 cursor-pointer max-w-md"
            onClick={() => navigate('/admin/photoshoots/edit')}
          >
            <CardHeader>
              <CardTitle className="text-base uppercase tracking-wider">
                Photoshoot Management
              </CardTitle>
              <CardDescription className="text-sm">
                Manage all photoshoots in one unified location. Upload photos and assign category tags: selected, commissioned, editorial, or personal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full">
                Manage Photoshoots
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Technical Projects Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Code2 className="h-5 w-5 text-foreground" />
            <h2 className="text-lg font-semibold uppercase tracking-wider">Technical Projects</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
            <Card 
              className="hover:border-foreground/20 transition-all duration-300 cursor-pointer"
              onClick={() => navigate('/admin/technical/edit')}
            >
              <CardHeader>
                <CardTitle className="text-base uppercase tracking-wider">
                  Technical Portfolio
                </CardTitle>
                <CardDescription className="text-sm">
                  Manage technical projects, descriptions, links, and technologies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full">
                  Edit Projects
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="hover:border-foreground/20 transition-all duration-300 cursor-pointer"
              onClick={() => navigate('/admin/technical/skills/edit')}
            >
              <CardHeader>
                <CardTitle className="text-base uppercase tracking-wider">
                  Skills Manager
                </CardTitle>
                <CardDescription className="text-sm">
                  Manage skill categories and items displayed in the Technical Portfolio section
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full">
                  Manage Skills
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="hover:border-foreground/20 transition-all duration-300 cursor-pointer"
              onClick={() => navigate('/admin/technical/experience/edit')}
            >
              <CardHeader>
                <CardTitle className="text-base uppercase tracking-wider">
                  Experience Manager
                </CardTitle>
                <CardDescription className="text-sm">
                  Manage professional experience entries with role, company, and dates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full">
                  Manage Experience
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Artistic Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Camera className="h-5 w-5 text-foreground" />
            <h2 className="text-lg font-semibold uppercase tracking-wider">Artistic</h2>
          </div>
          
          <Card 
            className="hover:border-foreground/20 transition-all duration-300 cursor-pointer max-w-md"
            onClick={() => navigate('/admin/artistic/edit')}
          >
            <CardHeader>
              <CardTitle className="text-base uppercase tracking-wider">
                Artistic Works
              </CardTitle>
              <CardDescription className="text-sm">
                Manage artistic photography and creative works
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full">
                Edit Artworks
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* About Page Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <User className="h-5 w-5 text-foreground" />
            <h2 className="text-lg font-semibold uppercase tracking-wider">About Page</h2>
          </div>
          
          <Card 
            className="hover:border-foreground/20 transition-all duration-300 cursor-pointer max-w-md"
            onClick={() => navigate('/admin/about/edit')}
          >
            <CardHeader>
              <CardTitle className="text-base uppercase tracking-wider">
                About Page Content
              </CardTitle>
              <CardDescription className="text-sm">
                Manage profile image, bio, and services for the About page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full">
                Edit About Page
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Achievements Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="h-5 w-5 text-foreground" />
            <h2 className="text-lg font-semibold uppercase tracking-wider">Achievements</h2>
          </div>
          
          <Card 
            className="hover:border-foreground/20 transition-all duration-300 cursor-pointer max-w-md"
            onClick={() => navigate('/admin/achievement/edit')}
          >
            <CardHeader>
              <CardTitle className="text-base uppercase tracking-wider">
                Achievement Certificates
              </CardTitle>
              <CardDescription className="text-sm">
                Manage achievement certificates across 5 categories with drag-and-drop ranking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full">
                Manage Achievements
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
