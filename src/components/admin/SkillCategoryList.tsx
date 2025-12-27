import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react';
import { TechnicalSkill } from '@/types/technicalSkills';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SkillCategoryListProps {
  skills: TechnicalSkill[];
  onEdit: (skill: TechnicalSkill) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, isVisible: boolean) => void;
  onReorder: (skills: TechnicalSkill[]) => void;
}

export const SkillCategoryList = ({ 
  skills, 
  onEdit, 
  onDelete, 
  onToggleVisibility,
  onReorder 
}: SkillCategoryListProps) => {
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newSkills = [...skills];
    [newSkills[index - 1], newSkills[index]] = [newSkills[index], newSkills[index - 1]];
    // Update order_index for all affected items
    const reordered = newSkills.map((skill, idx) => ({
      ...skill,
      order_index: idx + 1
    }));
    onReorder(reordered);
  };

  const handleMoveDown = (index: number) => {
    if (index === skills.length - 1) return;
    const newSkills = [...skills];
    [newSkills[index], newSkills[index + 1]] = [newSkills[index + 1], newSkills[index]];
    // Update order_index for all affected items
    const reordered = newSkills.map((skill, idx) => ({
      ...skill,
      order_index: idx + 1
    }));
    onReorder(reordered);
  };

  if (skills.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No skill categories yet. Create your first one!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {skills.map((skill, index) => (
        <Card key={skill.id} className="group">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="h-6 w-6 p-0"
                    aria-label="Move category up"
                  >
                    ▲
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === skills.length - 1}
                    className="h-6 w-6 p-0"
                    aria-label="Move category down"
                  >
                    ▼
                  </Button>
                </div>
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base uppercase tracking-wider flex items-center gap-2">
                  {skill.category}
                  {!skill.is_visible && (
                    <span className="text-xs text-muted-foreground font-normal">(Hidden)</span>
                  )}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {skill.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </span>
                  <Switch
                    checked={skill.is_visible}
                    onCheckedChange={(checked) => onToggleVisibility(skill.id, checked)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(skill)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Skill Category</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{skill.category}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(skill.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {skill.skills.map((item, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1 bg-muted rounded-md text-sm font-mono text-muted-foreground"
                >
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
