import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
const MAX_CAPTION_LENGTH = 500;
const MAX_CREDITS_LENGTH = 500;

export default function PhotoEditPanel({ photo, onClose, onUpdate }: PhotoEditPanelProps) {
  const [title, setTitle] = useState(photo.title || '');
  const [description, setDescription] = useState(photo.description || '');
  const [caption, setCaption] = useState(photo.caption || '');
  const [photographerName, setPhotographerName] = useState(photo.photographer_name || '');
  const [dateTaken, setDateTaken] = useState(photo.date_taken || '');
  const [deviceUsed, setDeviceUsed] = useState(photo.device_used || '');
  const [year, setYear] = useState<number | ''>(photo.year || '');
  const [tags, setTags] = useState<string>(photo.tags?.join(', ') || '');
  const [credits, setCredits] = useState(photo.credits || '');
  const [cameraLens, setCameraLens] = useState(photo.camera_lens || '');
  const [projectVisibility, setProjectVisibility] = useState(photo.project_visibility || 'public');
  const [externalLinks, setExternalLinks] = useState<Array<{ title: string; url: string }>>(
    Array.isArray(photo.external_links) ? photo.external_links as Array<{ title: string; url: string }> : []
  );
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

    if (caption.length > MAX_CAPTION_LENGTH) {
      newErrors.caption = `Caption must be ${MAX_CAPTION_LENGTH} characters or less`;
    }

    if (credits.length > MAX_CREDITS_LENGTH) {
      newErrors.credits = `Credits must be ${MAX_CREDITS_LENGTH} characters or less`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addExternalLink = () => {
    setExternalLinks([...externalLinks, { title: '', url: '' }]);
  };

  const updateExternalLink = (index: number, field: 'title' | 'url', value: string) => {
    const newLinks = [...externalLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setExternalLinks(newLinks);
  };

  const removeExternalLink = (index: number) => {
    const newLinks = [...externalLinks];
    newLinks.splice(index, 1);
    setExternalLinks(newLinks);
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Please fix validation errors');
      return;
    }

    setIsSaving(true);

    try {
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      
      const updates = {
        title: title.trim() || null,
        description: description.trim() || null,
        caption: caption.trim() || null,
        photographer_name: photographerName.trim() || null,
        date_taken: dateTaken || null,
        device_used: deviceUsed.trim() || null,
        year: year || null,
        tags: tagArray.length > 0 ? tagArray : null,
        credits: credits.trim() || null,
        camera_lens: cameraLens.trim() || null,
        project_visibility: projectVisibility,
        external_links: externalLinks.filter(link => link.title || link.url),
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
      <div className="p-4 space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto">
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

        <div className="space-y-2">
          <Label htmlFor="caption">
            Caption
            <span className="text-xs text-muted-foreground ml-2">
              ({caption.length}/{MAX_CAPTION_LENGTH})
            </span>
          </Label>
          <Textarea
            id="caption"
            placeholder="Enter a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className={errors.caption ? 'border-destructive' : ''}
            rows={2}
            disabled={isSaving}
          />
          {errors.caption && (
            <p className="text-xs text-destructive">{errors.caption}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="photographer_name" className="text-xs">Photographer</Label>
            <Input
              id="photographer_name"
              type="text"
              placeholder="Name"
              value={photographerName}
              onChange={(e) => setPhotographerName(e.target.value)}
              className="text-sm"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="year" className="text-xs">Year</Label>
            <Input
              id="year"
              type="number"
              placeholder="e.g., 2024"
              value={year}
              onChange={(e) => setYear(e.target.value ? parseInt(e.target.value, 10) : '')}
              className="text-sm"
              min="1900"
              max="2100"
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date_taken" className="text-xs">Date Taken</Label>
          <Input
            id="date_taken"
            type="date"
            value={dateTaken}
            onChange={(e) => setDateTaken(e.target.value)}
            className="text-sm"
            disabled={isSaving}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="device_used" className="text-xs">Device</Label>
            <Input
              id="device_used"
              type="text"
              placeholder="e.g., iPhone 15"
              value={deviceUsed}
              onChange={(e) => setDeviceUsed(e.target.value)}
              className="text-sm"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="camera_lens" className="text-xs">Camera/Lens</Label>
            <Input
              id="camera_lens"
              type="text"
              placeholder="e.g., Canon R5"
              value={cameraLens}
              onChange={(e) => setCameraLens(e.target.value)}
              className="text-sm"
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="credits">
            Credits
            <span className="text-xs text-muted-foreground ml-2">
              ({credits.length}/{MAX_CREDITS_LENGTH})
            </span>
          </Label>
          <Textarea
            id="credits"
            placeholder="Model, Stylist, etc."
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            className={errors.credits ? 'border-destructive' : ''}
            rows={2}
            disabled={isSaving}
          />
          {errors.credits && (
            <p className="text-xs text-destructive">{errors.credits}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags" className="text-xs">Tags (comma-separated)</Label>
          <Input
            id="tags"
            type="text"
            placeholder="e.g., fashion, portrait"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="text-sm"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="project_visibility" className="text-xs">Visibility</Label>
          <Select
            value={projectVisibility}
            onValueChange={setProjectVisibility}
            disabled={isSaving}
          >
            <SelectTrigger id="project_visibility" className="text-sm">
              <SelectValue placeholder="Select visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="unlisted">Unlisted</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">External Links</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addExternalLink}
              className="h-6 px-2 text-xs"
              disabled={isSaving}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
          {externalLinks.length > 0 && (
            <div className="space-y-2">
              {externalLinks.map((link, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <Input
                    type="text"
                    placeholder="Title"
                    value={link.title}
                    onChange={(e) => updateExternalLink(index, 'title', e.target.value)}
                    className="text-xs flex-1"
                    disabled={isSaving}
                  />
                  <Input
                    type="url"
                    placeholder="URL"
                    value={link.url}
                    onChange={(e) => updateExternalLink(index, 'url', e.target.value)}
                    className="text-xs flex-1"
                    disabled={isSaving}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExternalLink(index)}
                    className="h-8 px-2"
                    disabled={isSaving}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Original File Info (Read-only) */}
        {photo.original_file_url && (
          <div className="p-3 bg-muted/50 rounded-lg space-y-1">
            <Label className="text-xs font-semibold">Original File</Label>
            <p className="text-xs text-muted-foreground">
              {photo.original_width} × {photo.original_height} px
            </p>
            {photo.original_size_bytes && (
              <p className="text-xs text-muted-foreground">
                {(photo.original_size_bytes / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
            <a 
              href={photo.original_file_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline block"
            >
              View Original
            </a>
          </div>
        )}
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
