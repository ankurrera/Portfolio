import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ArrowLeft, Trophy, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { AchievementData } from '@/types/achievement';
import AchievementForm from '@/components/admin/AchievementForm';
import AchievementList from '@/components/admin/AchievementList';

const AdminAchievementEdit = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState<AchievementData[]>([]);
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(true);
  const [editingAchievement, setEditingAchievement] = useState<AchievementData | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Auth redirect effect
  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      navigate('/admin/login', { replace: true });
      return;
    }
    
    if (!isAdmin) {
      toast.error('You do not have admin access');
      signOut();
      navigate('/admin/login', { replace: true });
    }
  }, [user, isAdmin, isLoading, navigate, signOut]);

  // Load achievements
  useEffect(() => {
    if (!user || !isAdmin) return;
    
    loadAchievements();
  }, [user, isAdmin]);

  const loadAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true })
        .order('display_order', { ascending: true });

      if (error) throw error;

      setAchievements(data as AchievementData[] || []);
    } catch (error) {
      console.error('Error loading achievements:', error);
      toast.error('Failed to load achievements');
    } finally {
      setIsLoadingAchievements(false);
    }
  };

  const handleCreateNew = () => {
    setEditingAchievement(null);
    setShowForm(true);
  };

  const handleEdit = (achievement: AchievementData) => {
    setEditingAchievement(achievement);
    setShowForm(true);
  };

  const handleSave = (savedAchievement: AchievementData) => {
    if (editingAchievement) {
      // Update existing achievement in list
      setAchievements(achievements.map(a => a.id === savedAchievement.id ? savedAchievement : a));
    } else {
      // Add new achievement to list
      setAchievements([...achievements, savedAchievement]);
    }
    setShowForm(false);
    setEditingAchievement(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAchievement(null);
  };

  const handleDelete = (achievementId: string) => {
    setAchievements(achievements.filter(a => a.id !== achievementId));
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
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Achievement
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <p className="text-muted-foreground">
            Manage achievement certificates across different categories. Upload images, set titles, and configure display order.
          </p>
        </div>

        {isLoadingAchievements ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <AchievementList
            achievements={achievements}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRefresh={loadAchievements}
          />
        )}

        {/* Instructions */}
        <Card className="mt-8 bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Click "Add New Achievement" to create a certificate</p>
            <p>• Upload certificate images (JPG, PNG, WebP supported, max 10MB)</p>
            <p>• Add titles, descriptions, and select the appropriate category</p>
            <p>• Set display order (lower numbers appear first: 0, 1, 2...)</p>
            <p>• Toggle publish status to show/hide on the public page</p>
            <p>• Top 3 certificates per category will be shown in the folder preview</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAchievement ? 'Edit Achievement' : 'Create New Achievement'}
            </DialogTitle>
            <DialogDescription>
              {editingAchievement 
                ? 'Update the achievement details below.'
                : 'Fill in the details to create a new achievement certificate.'
              }
            </DialogDescription>
          </DialogHeader>
          <AchievementForm
            achievement={editingAchievement}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAchievementEdit;
