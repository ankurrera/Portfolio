import { useState } from 'react';
import { Experience } from '@/types/experience';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, GripVertical, Briefcase } from 'lucide-react';
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

interface ExperienceListProps {
  experiences: Experience[];
  onEdit: (experience: Experience) => void;
  onDelete: (experienceId: string) => void;
  onReorder: (experiences: Experience[]) => void;
}

const ExperienceList = ({ experiences, onEdit, onDelete, onReorder }: ExperienceListProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [experienceToDelete, setExperienceToDelete] = useState<string | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newExperiences = [...experiences];
    const draggedItem = newExperiences[draggedIndex];
    newExperiences.splice(draggedIndex, 1);
    newExperiences.splice(index, 0, draggedItem);

    // Update display_order based on new positions
    const reorderedExperiences = newExperiences.map((exp, idx) => ({
      ...exp,
      display_order: idx + 1,
    }));

    onReorder(reorderedExperiences);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDeleteClick = (experienceId: string) => {
    setExperienceToDelete(experienceId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (experienceToDelete) {
      onDelete(experienceToDelete);
      setExperienceToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const formatDateRange = (exp: Experience) => {
    const endDateDisplay = exp.is_current ? 'Present' : (exp.end_date || '');
    return `${exp.start_date} - ${endDateDisplay}`;
  };

  if (experiences.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No experience entries yet. Create your first one!
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {experiences.map((exp, index) => (
          <Card
            key={exp.id}
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

                {/* Icon */}
                <div className="flex-shrink-0 pt-1">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{exp.role_title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {exp.company_name}
                        {exp.employment_type && (
                          <span className="ml-2 text-xs font-mono uppercase">
                            ({exp.employment_type})
                          </span>
                        )}
                      </p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(exp)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteClick(exp.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-mono">{formatDateRange(exp)}</span>
                    {exp.is_current && (
                      <span className="text-xs font-mono uppercase tracking-widest text-success">
                        Current
                      </span>
                    )}
                  </div>
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
            <AlertDialogTitle>Delete Experience</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this experience entry? This action cannot be undone.
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

export default ExperienceList;
