import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { Loader2, ArrowLeft, Plus, GripVertical, Pencil, Trash2, ExternalLink, Github, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TechnicalProject {
  id: string;
  title: string;
  description: string | null;
  tech_stack: string[];
  year: string;
  status: string;
  github_link: string | null;
  live_link: string | null;
  thumbnail_url: string | null;
  display_order: number;
  is_published: boolean;
}

interface ProjectFormData {
  title: string;
  description: string;
  tech_stack: string[];
  year: string;
  status: string;
  github_link: string;
  live_link: string;
  thumbnail_url: string;
  is_published: boolean;
}

const emptyFormData: ProjectFormData = {
  title: '',
  description: '',
  tech_stack: [],
  year: new Date().getFullYear().toString(),
  status: 'In Development',
  github_link: '',
  live_link: '',
  thumbnail_url: '',
  is_published: true,
};

const AdminTechnicalEdit = () => {
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState<TechnicalProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<TechnicalProject | null>(null);
  const [deletingProject, setDeletingProject] = useState<TechnicalProject | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>(emptyFormData);
  const [newTag, setNewTag] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (!isAdmin) {
      toast.error('You do not have admin access');
      signOut();
      navigate('/admin/login', { replace: true });
    }
  }, [user, isAdmin, authLoading, navigate, signOut]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchProjects();
    }
  }, [user, isAdmin]);

  const fetchProjects = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('technical_projects')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      toast.error('Failed to load projects');
      console.error(error);
    } else {
      setProjects(data || []);
    }
    setIsLoading(false);
  };

  const handleAddNew = () => {
    setEditingProject(null);
    setFormData(emptyFormData);
    setDialogOpen(true);
  };

  const handleEdit = (project: TechnicalProject) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description || '',
      tech_stack: project.tech_stack,
      year: project.year,
      status: project.status,
      github_link: project.github_link || '',
      live_link: project.live_link || '',
      thumbnail_url: project.thumbnail_url || '',
      is_published: project.is_published,
    });
    setDialogOpen(true);
  };

  const handleDelete = (project: TechnicalProject) => {
    setDeletingProject(project);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingProject) return;
    
    const { error } = await supabase
      .from('technical_projects')
      .delete()
      .eq('id', deletingProject.id);

    if (error) {
      toast.error('Failed to delete project');
      console.error(error);
    } else {
      toast.success('Project deleted');
      fetchProjects();
    }
    setDeleteDialogOpen(false);
    setDeletingProject(null);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsSaving(true);

    if (editingProject) {
      // Update existing
      const { error } = await supabase
        .from('technical_projects')
        .update({
          title: formData.title,
          description: formData.description || null,
          tech_stack: formData.tech_stack,
          year: formData.year,
          status: formData.status,
          github_link: formData.github_link || null,
          live_link: formData.live_link || null,
          thumbnail_url: formData.thumbnail_url || null,
          is_published: formData.is_published,
        })
        .eq('id', editingProject.id);

      if (error) {
        toast.error('Failed to update project');
        console.error(error);
      } else {
        toast.success('Project updated');
        fetchProjects();
        setDialogOpen(false);
      }
    } else {
      // Create new
      const maxOrder = projects.length > 0 
        ? Math.max(...projects.map(p => p.display_order)) + 1 
        : 0;

      const { error } = await supabase
        .from('technical_projects')
        .insert({
          title: formData.title,
          description: formData.description || null,
          tech_stack: formData.tech_stack,
          year: formData.year,
          status: formData.status,
          github_link: formData.github_link || null,
          live_link: formData.live_link || null,
          thumbnail_url: formData.thumbnail_url || null,
          is_published: formData.is_published,
          display_order: maxOrder,
        });

      if (error) {
        toast.error('Failed to create project');
        console.error(error);
      } else {
        toast.success('Project created');
        fetchProjects();
        setDialogOpen(false);
      }
    }

    setIsSaving(false);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tech_stack.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tech_stack: [...prev.tech_stack, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tech_stack: prev.tech_stack.filter(t => t !== tag),
    }));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newProjects = [...projects];
    const draggedItem = newProjects[draggedIndex];
    newProjects.splice(draggedIndex, 1);
    newProjects.splice(index, 0, draggedItem);
    
    setProjects(newProjects);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;
    
    // Update display_order for all projects
    const updates = projects.map((project, index) => ({
      id: project.id,
      display_order: index,
    }));

    for (const update of updates) {
      await supabase
        .from('technical_projects')
        .update({ display_order: update.display_order })
        .eq('id', update.id);
    }

    setDraggedIndex(null);
    toast.success('Order updated');
  };

  if (authLoading || isLoading) {
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
            <h1 className="text-xl font-semibold uppercase tracking-wider">
              Technical Projects
            </h1>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>
      </div>

      {/* Projects List */}
      <div className="container mx-auto px-4 py-8">
        {projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">No projects yet</p>
              <Button onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {projects.map((project, index) => (
              <Card
                key={project.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`cursor-move transition-all ${
                  draggedIndex === index ? 'opacity-50 scale-[1.02]' : ''
                } ${!project.is_published ? 'opacity-60' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    
                    {project.thumbnail_url && (
                      <img 
                        src={project.thumbnail_url} 
                        alt={project.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{project.title}</h3>
                        {!project.is_published && (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                        <Badge variant={project.status === 'Live' ? 'default' : 'outline'}>
                          {project.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mb-2">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {project.tech_stack.map((tech) => (
                          <Badge key={tech} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {project.year}
                    </div>

                    <div className="flex items-center gap-1">
                      {project.github_link && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={project.github_link} target="_blank" rel="noopener noreferrer">
                            <Github className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {project.live_link && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={project.live_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(project)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(project)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? 'Edit Project' : 'New Project'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Project title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                  placeholder="2024"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Project description"
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Live">Live</SelectItem>
                    <SelectItem value="In Development">In Development</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex items-end">
                <div className="flex items-center gap-2">
                  <Switch
                    id="published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                  />
                  <Label htmlFor="published">Published</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tech Stack / Languages</Label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add technology..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="secondary" onClick={addTag}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tech_stack.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="github">GitHub Link</Label>
                <Input
                  id="github"
                  type="url"
                  value={formData.github_link}
                  onChange={(e) => setFormData(prev => ({ ...prev, github_link: e.target.value }))}
                  placeholder="https://github.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="live">Live Link</Label>
                <Input
                  id="live"
                  type="url"
                  value={formData.live_link}
                  onChange={(e) => setFormData(prev => ({ ...prev, live_link: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input
                id="thumbnail"
                type="url"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProject?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminTechnicalEdit;
