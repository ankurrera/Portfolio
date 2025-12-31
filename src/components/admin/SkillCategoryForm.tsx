import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, GripVertical, Plus, X } from 'lucide-react';
import { TechnicalSkill } from '@/types/technicalSkills';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { useBeforeUnload } from '@/hooks/useBeforeUnload';
import { DraftIndicator } from '@/components/admin/DraftIndicator';
import { toast } from 'sonner';

interface SkillCategoryFormProps {
  skill: TechnicalSkill | null;
  onSave: (skill: TechnicalSkill | Omit<TechnicalSkill, 'id' | 'created_at'>) => void;
  onCancel: () => void;
}

export const SkillCategoryForm = ({ skill, onSave, onCancel }: SkillCategoryFormProps) => {
  const [category, setCategory] = useState(skill?.category || '');
  const [skills, setSkills] = useState<string[]>(skill?.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [isVisible, setIsVisible] = useState(skill?.is_visible ?? true);

  // Create form data object for persistence
  const formData = useMemo(() => ({
    category,
    skills,
    isVisible,
  }), [category, skills, isVisible]);

  // Generate unique key for draft storage
  const draftKey = skill 
    ? `admin:skill_category:draft:${skill.id}` 
    : 'admin:skill_category:draft:new';

  // Use form persistence hook
  const { draftRestored, isSaving: isDraftSaving, clearDraft, hasUnsavedChanges } = useFormPersistence({
    key: draftKey,
    data: formData,
    onRestore: (restored) => {
      setCategory(restored.category);
      setSkills(restored.skills);
      setIsVisible(restored.isVisible);
    },
  });

  // Warn before leaving page with unsaved changes
  useBeforeUnload(hasUnsavedChanges);

  const handleDiscardDraft = () => {
    clearDraft();
    // Reset form to initial state
    setCategory(skill?.category || '');
    setSkills(skill?.skills || []);
    setIsVisible(skill?.is_visible ?? true);
    toast.success('Draft discarded');
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleUpdateSkill = (index: number, value: string) => {
    const newSkills = [...skills];
    newSkills[index] = value;
    setSkills(newSkills);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category.trim() || skills.length === 0) {
      return;
    }

    const data = {
      ...(skill?.id ? { id: skill.id } : {}),
      category: category.trim(),
      skills,
      order_index: skill?.order_index || 0,
      is_visible: isVisible,
      ...(skill?.created_at ? { created_at: skill.created_at } : {})
    };

    // Clear draft on successful save
    clearDraft();
    onSave(data as TechnicalSkill);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg uppercase tracking-wider">
            {skill ? 'Edit Skill Category' : 'Add Skill Category'}
          </CardTitle>
          <DraftIndicator 
            draftRestored={draftRestored}
            isSaving={isDraftSaving}
            onDiscard={handleDiscardDraft}
          />
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Name */}
          <div className="space-y-2">
            <Label htmlFor="category">Category Name</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Frontend, Backend, Tools"
              required
            />
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="visible">Visible on Public Page</Label>
            <Switch
              id="visible"
              checked={isVisible}
              onCheckedChange={setIsVisible}
            />
          </div>

          {/* Skills List */}
          <div className="space-y-2">
            <Label>Skills</Label>
            <div className="space-y-2">
              {skills.map((skill, index) => (
                <div key={index} className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    value={skill}
                    onChange={(e) => handleUpdateSkill(index, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSkill(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add New Skill */}
            <div className="flex gap-2 pt-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
              />
              <Button type="button" onClick={handleAddSkill} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={!category.trim() || skills.length === 0}>
              Save Category
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
