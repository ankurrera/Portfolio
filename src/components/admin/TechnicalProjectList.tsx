import { useState } from 'react';
import { TechnicalProject } from '@/types/technical';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, GripVertical, Github, ExternalLink } from 'lucide-react';
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

interface TechnicalProjectListProps {
  projects: TechnicalProject[];
  onEdit: (project: TechnicalProject) => void;
  onDelete: (projectId: string) => void;
  onReorder: (projects: TechnicalProject[]) => void;
}

const TechnicalProjectList = ({ projects, onEdit, onDelete, onReorder }: TechnicalProjectListProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

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

    // Update display_order based on new positions
    const reorderedProjects = newProjects.map((project, idx) => ({
      ...project,
      display_order: idx + 1,
    }));

    onReorder(reorderedProjects);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDeleteClick = (projectId: string) => {
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (projectToDelete) {
      onDelete(projectToDelete);
      setProjectToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No projects yet. Create your first project!
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {projects.map((project, index) => (
          <Card
            key={project.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`cursor-move hover:border-foreground/20 transition-all ${
              draggedIndex === index ? 'opacity-50' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Drag Handle */}
                <div className="flex-shrink-0 pt-1 cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* Thumbnail */}
                {project.thumbnail_url && (
                  <div className="flex-shrink-0">
                    <img
                      src={project.thumbnail_url}
                      alt={project.title}
                      className="w-24 h-24 object-cover rounded"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{project.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(project)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteClick(project.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span>{project.dev_year}</span>
                    {project.status && (
                      <span className={`font-mono uppercase tracking-widest ${
                        project.status === 'Live' ? 'text-success' : 'text-warning'
                      }`}>
                        {project.status}
                      </span>
                    )}
                    {project.github_link && (
                      <a
                        href={project.github_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        <Github className="h-4 w-4" />
                        <span>GitHub</span>
                      </a>
                    )}
                    {project.live_link && (
                      <a
                        href={project.live_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Live</span>
                      </a>
                    )}
                  </div>

                  {/* Languages */}
                  {project.languages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {project.languages.map((lang) => (
                        <span
                          key={lang}
                          className="text-xs font-mono text-muted-foreground/60 px-2 py-1 bg-muted/30 rounded"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TechnicalProjectList;
