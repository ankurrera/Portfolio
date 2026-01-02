import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

export interface PhotoFormData {
  caption?: string;
  photographer_name?: string;
  date_taken?: string;
  device_used?: string;
  year?: number;
  tags?: string[];
  credits?: string;
  camera_lens?: string;
  project_visibility?: string;
  external_links?: Array<{ title: string; url: string }>;
}

// Discriminated union for mode-specific props
type UnifiedPhotoFormProps = 
  | {
      mode: 'add';
      initialData?: PhotoFormData;
      photo?: never;
      onClose?: never;
      onUpdate?: never;
      onChange?: (data: PhotoFormData) => void;
      showActions?: false;
      disabled?: boolean;
    }
  | {
      mode: 'edit';
      initialData?: PhotoFormData;
      photo: PhotoLayoutData; // Required for edit mode
      onClose: () => void;
      onUpdate: (id: string, updates: Partial<PhotoLayoutData>) => void;
      onChange?: never;
      showActions?: boolean;
      disabled?: boolean;
    };

// Validation constants
const MAX_CAPTION_LENGTH = 500;
const MAX_CREDITS_LENGTH = 500;

// Helper functions
const processTags = (tagsString: string): string[] => {
  return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
};

const filterValidLinks = (links: Array<{ title: string; url: string }>): Array<{ title: string; url: string }> => {
  return links.filter(link => link.title.trim() && link.url.trim());
};

export default function UnifiedPhotoForm({
  mode,
  initialData = {},
  photo,
  onClose,
  onUpdate,
  onChange,
  showActions = false,
  disabled = false,
}: UnifiedPhotoFormProps) {
  const [caption, setCaption] = useState(initialData.caption || '');
  const [photographerName, setPhotographerName] = useState(initialData.photographer_name || '');
  const [dateTaken, setDateTaken] = useState(initialData.date_taken || '');
  const [deviceUsed, setDeviceUsed] = useState(initialData.device_used || '');
  const [year, setYear] = useState<number | ''>(initialData.year || '');
  const [tags, setTags] = useState<string>(initialData.tags?.join(', ') || '');
  const [credits, setCredits] = useState(initialData.credits || '');
  const [cameraLens, setCameraLens] = useState(initialData.camera_lens || '');
  const [projectVisibility, setProjectVisibility] = useState(initialData.project_visibility || 'public');
  const [externalLinks, setExternalLinks] = useState<Array<{ title: string; url: string }>>(
    initialData.external_links || []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Track if initial data has been loaded (for edit mode only)
  const initializedRef = useRef(false);
  
  // Sync local state with initialData only once on mount (for edit mode)
  // This ensures the form is populated from DB data initially,
  // but user edits are not overwritten by the initialData prop
  useEffect(() => {
    if (mode === 'edit' && initialData && !initializedRef.current) {
      // Initialize all fields from initialData on first mount
      setCaption(initialData.caption || '');
      setPhotographerName(initialData.photographer_name || '');
      setDateTaken(initialData.date_taken || '');
      setDeviceUsed(initialData.device_used || '');
      setYear(initialData.year || '');
      setCredits(initialData.credits || '');
      setCameraLens(initialData.camera_lens || '');
      setProjectVisibility(initialData.project_visibility || 'public');
      setTags(initialData.tags?.join(', ') || '');
      setExternalLinks(initialData.external_links || []);
      
      initializedRef.current = true;
    }
  }, [mode, initialData]);

  // Notify parent of changes (for add mode) - debounced via useMemo
  const formData = useMemo(() => {
    if (mode !== 'add') return null;
    
    const tagArray = processTags(tags);
    return {
      caption: caption || undefined,
      photographer_name: photographerName || undefined,
      date_taken: dateTaken || undefined,
      device_used: deviceUsed || undefined,
      year: year || undefined,
      tags: tagArray.length > 0 ? tagArray : undefined,
      credits: credits || undefined,
      camera_lens: cameraLens || undefined,
      project_visibility: projectVisibility,
      external_links: filterValidLinks(externalLinks),
    };
  }, [mode, caption, photographerName, dateTaken, deviceUsed, year, tags, credits, cameraLens, projectVisibility, externalLinks]);

  useEffect(() => {
    if (formData && onChange) {
      onChange(formData);
    }
  }, [formData, onChange]);

  // Validate fields
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (caption.length > MAX_CAPTION_LENGTH) {
      newErrors.caption = `Caption must be ${MAX_CAPTION_LENGTH} characters or less`;
    }

    if (credits.length > MAX_CREDITS_LENGTH) {
      newErrors.credits = `Credits must be ${MAX_CREDITS_LENGTH} characters or less`;
    }

    // Check for incomplete external links
    const incompleteLinks = externalLinks.filter(link => 
      (link.title.trim() && !link.url.trim()) || (!link.title.trim() && link.url.trim())
    );
    if (incompleteLinks.length > 0) {
      newErrors.external_links = `${incompleteLinks.length} incomplete external link(s) will be removed. Both title and URL are required.`;
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

    if (mode !== 'edit') {
      console.error('handleSave called in non-edit mode');
      return;
    }

    setIsSaving(true);

    try {
      const tagArray = processTags(tags);
      
      const updates = {
        caption: caption.trim() || null,
        photographer_name: photographerName.trim() || null,
        date_taken: dateTaken || null,
        device_used: deviceUsed.trim() || null,
        year: year || null,
        tags: tagArray.length > 0 ? tagArray : null,
        credits: credits.trim() || null,
        camera_lens: cameraLens.trim() || null,
        project_visibility: projectVisibility,
        external_links: filterValidLinks(externalLinks),
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
    if (mode === 'edit') {
      onClose();
    }
  }, [mode, onClose]);

  // Handle Escape key
  useEffect(() => {
    if (mode === 'edit') {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleCancel();
        }
      };

      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [mode, handleCancel]);

  const containerClass = mode === 'add' 
    ? 'space-y-4 p-4 border rounded-lg bg-secondary/20'
    : 'space-y-4';

  return (
    <div className={containerClass}>
      {mode === 'add' && (
        <h3 className="text-sm font-semibold">Image Metadata (Optional)</h3>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="caption" className="text-xs">
          Caption/Description
          <span className="text-xs text-muted-foreground ml-2">
            ({caption.length}/{MAX_CAPTION_LENGTH})
          </span>
        </Label>
        <Textarea
          id="caption"
          placeholder="Enter a descriptive caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className={`text-sm min-h-[60px] ${errors.caption ? 'border-destructive' : ''}`}
          disabled={disabled || isSaving}
        />
        {errors.caption && (
          <p className="text-xs text-destructive">{errors.caption}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="photographer_name" className="text-xs">Photographer Name</Label>
          <Input
            id="photographer_name"
            type="text"
            placeholder="Photographer's name"
            value={photographerName}
            onChange={(e) => setPhotographerName(e.target.value)}
            className="text-sm"
            disabled={disabled || isSaving}
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
            disabled={disabled || isSaving}
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
          disabled={disabled || isSaving}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="device_used" className="text-xs">Device Used</Label>
          <Input
            id="device_used"
            type="text"
            placeholder="e.g., iPhone 15 Pro"
            value={deviceUsed}
            onChange={(e) => setDeviceUsed(e.target.value)}
            className="text-sm"
            disabled={disabled || isSaving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="camera_lens" className="text-xs">Camera/Lens</Label>
          <Input
            id="camera_lens"
            type="text"
            placeholder="e.g., Canon EOS R5 + RF 50mm"
            value={cameraLens}
            onChange={(e) => setCameraLens(e.target.value)}
            className="text-sm"
            disabled={disabled || isSaving}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="credits" className="text-xs">
          Credits (Collaborators)
          <span className="text-xs text-muted-foreground ml-2">
            ({credits.length}/{MAX_CREDITS_LENGTH})
          </span>
        </Label>
        <Textarea
          id="credits"
          placeholder="e.g., Model: Jane Doe, Stylist: John Smith"
          value={credits}
          onChange={(e) => setCredits(e.target.value)}
          className={`text-sm min-h-[50px] ${errors.credits ? 'border-destructive' : ''}`}
          disabled={disabled || isSaving}
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
          placeholder="e.g., fashion, portrait, editorial"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="text-sm"
          disabled={disabled || isSaving}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="project_visibility" className="text-xs">Project Visibility</Label>
        <Select
          value={projectVisibility}
          onValueChange={setProjectVisibility}
          disabled={disabled || isSaving}
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
            className="h-7 px-2"
            disabled={disabled || isSaving}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Link
          </Button>
        </div>
        {externalLinks.length > 0 && (
          <div className="space-y-2">
            {externalLinks.map((link, index) => (
              <div key={index} className="flex gap-2 items-start">
                <Input
                  type="text"
                  placeholder="Link title"
                  value={link.title}
                  onChange={(e) => updateExternalLink(index, 'title', e.target.value)}
                  className="text-sm flex-1"
                  disabled={disabled || isSaving}
                />
                <Input
                  type="url"
                  placeholder="https://..."
                  value={link.url}
                  onChange={(e) => updateExternalLink(index, 'url', e.target.value)}
                  className="text-sm flex-1"
                  disabled={disabled || isSaving}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExternalLink(index)}
                  className="h-9 px-2"
                  disabled={disabled || isSaving}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        {errors.external_links && (
          <p className="text-xs text-amber-600">{errors.external_links}</p>
        )}
      </div>

      {/* Action buttons for edit mode */}
      {showActions && mode === 'edit' && (
        <div className="flex gap-2 pt-4">
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
      )}
    </div>
  );
}
