import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ChevronLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Experience } from '@/types/experience';
import ExperienceForm from '@/components/admin/ExperienceForm';
import ExperienceList from '@/components/admin/ExperienceList';

const AdminExperienceEdit = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isLoadingExperiences, setIsLoadingExperiences] = useState(true);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
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

  // Load experiences
  useEffect(() => {
    if (!user || !isAdmin) return;
    
    loadExperiences();
  }, [user, isAdmin]);

  const loadExperiences = async () => {
    try {
      const { data, error } = await supabase
        .from('experience')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      setExperiences(data as Experience[]);
    } catch (error) {
      console.error('Error loading experiences:', error);
      toast.error('Failed to load experiences');
    } finally {
      setIsLoadingExperiences(false);
    }
  };

  const handleCreateNew = () => {
    setEditingExperience(null);
    setShowForm(true);
  };

  const handleEdit = (experience: Experience) => {
    setEditingExperience(experience);
    setShowForm(true);
  };

  const handleSave = (savedExperience: Experience) => {
    if (editingExperience) {
      // Update existing experience in list
      setExperiences(experiences.map(e => e.id === savedExperience.id ? savedExperience : e));
    } else {
      // Add new experience to list
      setExperiences([...experiences, savedExperience]);
    }
    setShowForm(false);
    setEditingExperience(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingExperience(null);
  };

  const handleDelete = async (experienceId: string) => {
    try {
      const { error } = await supabase
        .from('experience')
        .delete()
        .eq('id', experienceId);

      if (error) throw error;

      setExperiences(experiences.filter(e => e.id !== experienceId));
      toast.success('Experience deleted successfully');
    } catch (error) {
      console.error('Error deleting experience:', error);
      toast.error('Failed to delete experience');
    }
  };

  const handleReorder = async (reorderedExperiences: Experience[]) => {
    // Optimistically update UI
    setExperiences(reorderedExperiences);

    try {
      // Update display_order for all experiences
      const updates = reorderedExperiences.map((exp, index) => ({
        id: exp.id,
        display_order: index + 1,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('experience')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast.success('Experiences reordered successfully');
    } catch (error) {
      console.error('Error reordering experiences:', error);
      toast.error('Failed to reorder experiences');
      // Reload to get correct order
      loadExperiences();
    }
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
            Admin / Technical Portfolio / Experience
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold uppercase tracking-wider">
            Experience Management
          </h1>
          {!showForm && (
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              New Experience
            </Button>
          )}
        </div>

        {isLoadingExperiences ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : showForm ? (
          <ExperienceForm
            experience={editingExperience}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <ExperienceList
            experiences={experiences}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReorder={handleReorder}
          />
        )}
      </div>
    </div>
  );
};

export default AdminExperienceEdit;
