import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ChevronLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { TechnicalProject } from '@/types/technical';
import TechnicalProjectForm from '@/components/admin/TechnicalProjectForm';
import TechnicalProjectList from '@/components/admin/TechnicalProjectList';

const AdminTechnicalEdit = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<TechnicalProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [editingProject, setEditingProject] = useState<TechnicalProject | null>(null);
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

  // Load projects
  useEffect(() => {
    if (!user || !isAdmin) return;
    
    loadProjects();
  }, [user, isAdmin]);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('technical_projects')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Parse languages from JSONB
      const parsedProjects = data.map(project => ({
        ...project,
        languages: Array.isArray(project.languages) 
          ? project.languages 
          : JSON.parse(project.languages as string)
      })) as TechnicalProject[];

      setProjects(parsedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleCreateNew = () => {
    setEditingProject(null);
    setShowForm(true);
  };

  const handleEdit = (project: TechnicalProject) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleSave = (savedProject: TechnicalProject) => {
    if (editingProject) {
      // Update existing project in list
      setProjects(projects.map(p => p.id === savedProject.id ? savedProject : p));
    } else {
      // Add new project to list
      setProjects([...projects, savedProject]);
    }
    setShowForm(false);
    setEditingProject(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProject(null);
  };

  const handleDelete = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('technical_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(projects.filter(p => p.id !== projectId));
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const handleReorder = async (reorderedProjects: TechnicalProject[]) => {
    // Optimistically update UI
    setProjects(reorderedProjects);

    try {
      // Update display_order for all projects
      const updates = reorderedProjects.map((project, index) => ({
        id: project.id,
        display_order: index + 1,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('technical_projects')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast.success('Projects reordered successfully');
    } catch (error) {
      console.error('Error reordering projects:', error);
      toast.error('Failed to reorder projects');
      // Reload to get correct order
      loadProjects();
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
            Admin / Technical Projects
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold uppercase tracking-wider">
            Technical Projects
          </h1>
          {!showForm && (
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          )}
        </div>

        {isLoadingProjects ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : showForm ? (
          <TechnicalProjectForm
            project={editingProject}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <TechnicalProjectList
            projects={projects}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReorder={handleReorder}
          />
        )}
      </div>
    </div>
  );
};

export default AdminTechnicalEdit;
