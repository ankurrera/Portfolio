import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { Loader2, ArrowLeft, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AdminAchievementEdit = () => {
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

  const achievementCategories = [
    {
      id: 'school',
      title: 'School',
      description: 'School level achievements and certificates',
      count: 3,
    },
    {
      id: 'college',
      title: 'College',
      description: 'College and university achievements',
      count: 3,
    },
    {
      id: 'national',
      title: 'National',
      description: 'National level competitions and awards',
      count: 3,
    },
    {
      id: 'online-courses',
      title: 'Online Courses',
      description: 'Online certifications and course completions',
      count: 3,
    },
    {
      id: 'extra-curricular',
      title: 'Extra Curricular',
      description: 'Sports, arts, and community activities',
      count: 3,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-foreground" />
              <h1 className="text-xl font-semibold uppercase tracking-wider">Achievement Management</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <p className="text-muted-foreground">
            Manage achievement certificates across different categories. Upload images, set titles, and drag to reorder.
          </p>
        </div>

        {/* Achievement Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievementCategories.map((category) => (
            <Card key={category.id} className="hover:border-foreground/20 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-base uppercase tracking-wider flex items-center justify-between">
                  {category.title}
                  <span className="text-xs font-normal text-muted-foreground">
                    {category.count} items
                  </span>
                </CardTitle>
                <CardDescription className="text-sm">
                  {category.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => toast.info('Certificate management coming soon!')}
                >
                  Manage Certificates
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instructions */}
        <Card className="mt-8 bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Click on any category to manage its certificates</p>
            <p>• Upload certificate images (JPG, PNG, WebP supported)</p>
            <p>• Add titles and descriptions for each certificate</p>
            <p>• Drag and drop to reorder certificates by rank</p>
            <p>• Top 3 certificates will be shown in the folder preview</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAchievementEdit;
