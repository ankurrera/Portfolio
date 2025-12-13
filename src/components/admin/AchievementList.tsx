import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AchievementData } from '@/types/achievement';
import { Pencil, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AchievementListProps {
  achievements: AchievementData[];
  onEdit: (achievement: AchievementData) => void;
  onDelete: (achievementId: string) => void;
  onRefresh: () => void;
}

const AchievementList = ({ achievements, onEdit, onDelete, onRefresh }: AchievementListProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [achievementToDelete, setAchievementToDelete] = useState<AchievementData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (achievement: AchievementData) => {
    setAchievementToDelete(achievement);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!achievementToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('achievements')
        .delete()
        .eq('id', achievementToDelete.id);

      if (error) throw error;

      toast.success('Achievement deleted successfully');
      onDelete(achievementToDelete.id);
    } catch (error) {
      console.error('Error deleting achievement:', error);
      toast.error('Failed to delete achievement');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setAchievementToDelete(null);
    }
  };

  const togglePublished = async (achievement: AchievementData) => {
    try {
      const { error } = await supabase
        .from('achievements')
        .update({ is_published: !achievement.is_published })
        .eq('id', achievement.id);

      if (error) throw error;

      toast.success(`Achievement ${achievement.is_published ? 'unpublished' : 'published'}`);
      onRefresh();
    } catch (error) {
      console.error('Error toggling published status:', error);
      toast.error('Failed to update achievement');
    }
  };

  if (achievements.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No achievements yet. Click "Add New Achievement" to create one.</p>
      </div>
    );
  }

  // Group achievements by category
  const groupedAchievements = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, AchievementData[]>);

  return (
    <>
      <div className="space-y-8">
        {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
          <div key={category}>
            <h3 className="text-lg font-semibold uppercase tracking-wider mb-4 flex items-center justify-between">
              {category}
              <Badge variant="secondary">
                {categoryAchievements.length} {categoryAchievements.length === 1 ? 'item' : 'items'}
              </Badge>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryAchievements
                .sort((a, b) => a.display_order - b.display_order)
                .map((achievement) => (
                  <Card key={achievement.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-[4/3] relative">
                      <img
                        src={achievement.image_url}
                        alt={achievement.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Badge variant={achievement.is_published ? 'default' : 'secondary'}>
                          {achievement.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        {achievement.external_link && (
                          <a
                            href={achievement.external_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-background/90 rounded-full p-1.5 hover:bg-background"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="outline" className="bg-background/90">
                          Order: {achievement.display_order}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2 line-clamp-2">{achievement.title}</h4>
                      {achievement.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {achievement.description}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => togglePublished(achievement)}
                          className="flex-1"
                        >
                          {achievement.is_published ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-1" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              Publish
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(achievement)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteClick(achievement)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Achievement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{achievementToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AchievementList;
