import { useState, useEffect, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatSupabaseError } from '@/lib/utils';
import { PhotoLayoutData } from '@/types/wysiwyg';

interface PhotoEditPanelProps {
  photo: PhotoLayoutData;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<PhotoLayoutData>) => void;
}

// Validation constants
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 500;

export default function PhotoEditPanel({ photo, onClose, onUpdate }: PhotoEditPanelProps) {
  const [title, setTitle] = useState(photo.title || '');
  const [description, setDescription] = useState(photo.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate fields
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (title.length > MAX_TITLE_LENGTH) {
      newErrors.title = `Title must be ${MAX_TITLE_LENGTH} characters or less`;
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      newErrors.description = `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Please fix validation errors');
      return;
    }

    setIsSaving(true);

    try {
      const updates = {
        title: title.trim() || null,
        description: description.trim() || null,
      };

      const { error } = await supabase
        .from('photos')
        .update(updates)
        .eq('id', photo.id);

      if (error) throw error;

      // Update local state
      onUpdate(photo.id, updates);

      toast.success('Changes saved successfully');
      onClose();
    } catch (error) {
      const errorMessage = formatSupabaseError(error);
      console.error('Save error:', errorMessage);
      toast.error(`Failed to save changes: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [handleCancel]);

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-background border-l shadow-lg z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Edit Photo</h2>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Photo Preview */}
      <div className="p-4 border-b">
        <img
          src={photo.image_url}
          alt={photo.title || 'Photo'}
          className="w-full h-48 object-contain rounded"
        />
      </div>

      {/* Form */}
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">
            Title
            <span className="text-xs text-muted-foreground ml-2">
              ({title.length}/{MAX_TITLE_LENGTH})
            </span>
          </Label>
          <Input
            id="title"
            type="text"
            placeholder="Enter a title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={errors.title ? 'border-destructive' : ''}
            disabled={isSaving}
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Description
            <span className="text-xs text-muted-foreground ml-2">
              ({description.length}/{MAX_DESCRIPTION_LENGTH})
            </span>
          </Label>
          <Textarea
            id="description"
            placeholder="Enter a description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={errors.description ? 'border-destructive' : ''}
            rows={3}
            disabled={isSaving}
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description}</p>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="sticky bottom-0 bg-background border-t p-4 flex gap-2">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isSaving}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </div>
  );
}