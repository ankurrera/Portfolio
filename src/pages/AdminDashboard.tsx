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
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-[1400px]">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-base font-semibold uppercase tracking-wider">Admin Dashboard</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="h-8">
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-[1400px]">
        {/* Content Management Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Hero Sections Card */}
          <Card 
            className="hover:border-foreground/20 transition-all duration-300 cursor-pointer h-fit"
            onClick={() => navigate('/admin/hero/edit')}
          >
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Type className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                  Hero Sections
                </CardTitle>
              </div>
              <CardDescription className="text-xs leading-tight">
                Manage hero text across all pages
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Button variant="outline" size="sm" className="ml-auto">
                Edit
              </Button>
            </CardContent>
          </Card>

          {/* Photoshoots Card */}
          <Card 
            className="hover:border-foreground/20 transition-all duration-300 cursor-pointer h-fit"
            onClick={() => navigate('/admin/photoshoots/edit')}
          >
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Camera className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                  Photoshoots
                </CardTitle>
              </div>
              <CardDescription className="text-xs leading-tight">
                Manage photoshoots and photo categories
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Button variant="outline" size="sm" className="ml-auto">
                Manage
              </Button>
            </CardContent>
          </Card>

          {/* Achievements Card */}
          <Card 
            className="hover:border-foreground/20 transition-all duration-300 cursor-pointer h-fit"
            onClick={() => navigate('/admin/achievement/edit')}
          >
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                  Achievements
                </CardTitle>
              </div>
              <CardDescription className="text-xs leading-tight">
                Manage certificates across 5 categories
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Button variant="outline" size="sm" className="ml-auto">
                Manage
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Technical Section Header */}
        <div className="flex items-center gap-2 mb-3 mt-6">
          <Code2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Technical Portfolio</h2>
        </div>

        {/* Technical Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card 
            className="hover:border-foreground/20 transition-all duration-300 cursor-pointer h-fit"
            onClick={() => navigate('/admin/technical/edit')}
          >
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                Projects
              </CardTitle>
              <CardDescription className="text-xs leading-tight">
                Manage projects, descriptions, links
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Button variant="outline" size="sm" className="ml-auto">
                Edit
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="hover:border-foreground/20 transition-all duration-300 cursor-pointer h-fit"
            onClick={() => navigate('/admin/technical/about/edit')}
          >
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                About Section
              </CardTitle>
              <CardDescription className="text-xs leading-tight">
                Manage about content, paragraphs, and stats
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Button variant="outline" size="sm" className="ml-auto">
                Edit
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="hover:border-foreground/20 transition-all duration-300 cursor-pointer h-fit"
            onClick={() => navigate('/admin/technical/skills/edit')}
          >
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                Skills
              </CardTitle>
              <CardDescription className="text-xs leading-tight">
                Manage skill categories and items
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Button variant="outline" size="sm" className="ml-auto">
                Manage
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="hover:border-foreground/20 transition-all duration-300 cursor-pointer h-fit"
            onClick={() => navigate('/admin/technical/experience/edit')}
          >
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                Experience
              </CardTitle>
              <CardDescription className="text-xs leading-tight">
                Manage professional experience entries
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Button variant="outline" size="sm" className="ml-auto">
                Manage
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="hover:border-foreground/20 transition-all duration-300 cursor-pointer h-fit"
            onClick={() => navigate('/admin/technical/social-links/edit')}
          >
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                Social Links
              </CardTitle>
              <CardDescription className="text-xs leading-tight">
                Manage GitHub, LinkedIn, and Twitter links
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Button variant="outline" size="sm" className="ml-auto">
                Manage
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Creative & Personal Section Header */}
        <div className="flex items-center gap-2 mb-3 mt-6">
          <Camera className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Creative & Personal</h2>
        </div>

        {/* Artistic and About Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card 
            className="hover:border-foreground/20 transition-all duration-300 cursor-pointer h-fit"
            onClick={() => navigate('/admin/artistic/edit')}
          >
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                Artistic Works
              </CardTitle>
              <CardDescription className="text-xs leading-tight">
                Manage artistic photography and creative works
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Button variant="outline" size="sm" className="ml-auto">
                Edit
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="hover:border-foreground/20 transition-all duration-300 cursor-pointer h-fit"
            onClick={() => navigate('/admin/about/edit')}
          >
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                  About Page
                </CardTitle>
              </div>
              <CardDescription className="text-xs leading-tight">
                Manage profile image, bio, and services
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Button variant="outline" size="sm" className="ml-auto">
                Edit
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
