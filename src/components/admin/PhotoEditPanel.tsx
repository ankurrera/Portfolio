import { useState, useEffect } from 'react';
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
const MAX_CAPTION_LENGTH = 500;
const MAX_PHOTOGRAPHER_NAME_LENGTH = 100;
const MAX_DEVICE_USED_LENGTH = 100;
const MAX_VIDEO_THUMBNAIL_LENGTH = 500;

export default function PhotoEditPanel({ photo, onClose, onUpdate }: PhotoEditPanelProps) {
  const [caption, setCaption] = useState(photo.caption || '');
  const [photographerName, setPhotographerName] = useState(photo.photographer_name || '');
  const [dateTaken, setDateTaken] = useState(photo.date_taken || '');
  const [deviceUsed, setDeviceUsed] = useState(photo.device_used || '');
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState(photo.video_thumbnail_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate fields
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (caption.length > MAX_CAPTION_LENGTH) {
      newErrors.caption = `Caption must be ${MAX_CAPTION_LENGTH} characters or less`;
    }

    if (photographerName.length > MAX_PHOTOGRAPHER_NAME_LENGTH) {
      newErrors.photographerName = `Photographer name must be ${MAX_PHOTOGRAPHER_NAME_LENGTH} characters or less`;
    }

    if (deviceUsed.length > MAX_DEVICE_USED_LENGTH) {
      newErrors.deviceUsed = `Device used must be ${MAX_DEVICE_USED_LENGTH} characters or less`;
    }

    if (videoThumbnailUrl.length > MAX_VIDEO_THUMBNAIL_LENGTH) {
      newErrors.videoThumbnailUrl = `Video thumbnail URL must be ${MAX_VIDEO_THUMBNAIL_LENGTH} characters or less`;
    }

    // Validate date format if provided
    if (dateTaken && !/^\d{4}-\d{2}-\d{2}$/.test(dateTaken)) {
      newErrors.dateTaken = 'Date must be in YYYY-MM-DD format';
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
      const updates: Partial<PhotoLayoutData> = {
        caption: caption.trim() || null,
        photographer_name: photographerName.trim() || null,
        date_taken: dateTaken || null,
        device_used: deviceUsed.trim() || null,
        video_thumbnail_url: videoThumbnailUrl.trim() || null,
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

  const handleCancel = () => {
    onClose();
  };

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

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
          className="w-full h-48 object-cover rounded"
        />
        {photo.title && (
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            {photo.title}
          </p>
        )}
      </div>

      {/* Form */}
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="caption">
            Caption
            <span className="text-xs text-muted-foreground ml-2">
              ({caption.length}/{MAX_CAPTION_LENGTH})
            </span>
          </Label>
          <Textarea
            id="caption"
            placeholder="Enter a descriptive caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className={errors.caption ? 'border-destructive' : ''}
            rows={4}
            disabled={isSaving}
          />
          {errors.caption && (
            <p className="text-xs text-destructive">{errors.caption}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="photographer_name">
            Photographer
            <span className="text-xs text-muted-foreground ml-2">
              ({photographerName.length}/{MAX_PHOTOGRAPHER_NAME_LENGTH})
            </span>
          </Label>
          <Input
            id="photographer_name"
            type="text"
            placeholder="Photographer's name"
            value={photographerName}
            onChange={(e) => setPhotographerName(e.target.value)}
            className={errors.photographerName ? 'border-destructive' : ''}
            disabled={isSaving}
          />
          {errors.photographerName && (
            <p className="text-xs text-destructive">{errors.photographerName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="date_taken">Date Taken</Label>
          <Input
            id="date_taken"
            type="date"
            value={dateTaken}
            onChange={(e) => setDateTaken(e.target.value)}
            className={errors.dateTaken ? 'border-destructive' : ''}
            disabled={isSaving}
          />
          {errors.dateTaken && (
            <p className="text-xs text-destructive">{errors.dateTaken}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="device_used">
            Device Used
            <span className="text-xs text-muted-foreground ml-2">
              ({deviceUsed.length}/{MAX_DEVICE_USED_LENGTH})
            </span>
          </Label>
          <Input
            id="device_used"
            type="text"
            placeholder="e.g., iPhone 15 Pro, Nikon D850"
            value={deviceUsed}
            onChange={(e) => setDeviceUsed(e.target.value)}
            className={errors.deviceUsed ? 'border-destructive' : ''}
            disabled={isSaving}
          />
          {errors.deviceUsed && (
            <p className="text-xs text-destructive">{errors.deviceUsed}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="video_thumbnail_url">
            Video Thumbnail URL
            <span className="text-xs text-muted-foreground ml-2">
              ({videoThumbnailUrl.length}/{MAX_VIDEO_THUMBNAIL_LENGTH})
            </span>
          </Label>
          <Input
            id="video_thumbnail_url"
            type="text"
            placeholder="URL to video thumbnail"
            value={videoThumbnailUrl}
            onChange={(e) => setVideoThumbnailUrl(e.target.value)}
            className={errors.videoThumbnailUrl ? 'border-destructive' : ''}
            disabled={isSaving}
          />
          {errors.videoThumbnailUrl && (
            <p className="text-xs text-destructive">{errors.videoThumbnailUrl}</p>
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
