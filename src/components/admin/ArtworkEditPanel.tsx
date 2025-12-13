import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatSupabaseError } from '@/lib/utils';
import { ArtworkData, ArtworkMetadata } from '@/types/artwork';
import ArtworkMetadataForm from './ArtworkMetadataForm';

interface ArtworkEditPanelProps {
  artwork: ArtworkData;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<ArtworkData>) => void;
}

export default function ArtworkEditPanel({ artwork, onClose, onUpdate }: ArtworkEditPanelProps) {
  const [metadata, setMetadata] = useState<ArtworkMetadata>({
    title: artwork.title,
    creation_date: artwork.creation_date || undefined,
    description: artwork.description || undefined,
    dimension_preset: artwork.dimension_preset || undefined,
    custom_width: artwork.custom_width || undefined,
    custom_height: artwork.custom_height || undefined,
    dimension_unit: artwork.dimension_unit || 'cm',
    pencil_grades: artwork.pencil_grades || undefined,
    charcoal_types: artwork.charcoal_types || undefined,
    paper_type: artwork.paper_type || undefined,
    time_taken: artwork.time_taken || undefined,
    tags: artwork.tags || undefined,
    copyright: artwork.copyright || '© Ankur Bag.',
    external_link: artwork.external_link || undefined,
  });
  const [isPublished, setIsPublished] = useState(artwork.is_published);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate fields
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!metadata.title?.trim()) {
      newErrors.title = 'Artwork title is required';
    } else if (metadata.title.length > 200) {
      newErrors.title = 'Title must be 200 characters or less';
    }

    if (metadata.description && metadata.description.length > 1000) {
      newErrors.description = 'Description must be 1000 characters or less';
    }

    if (metadata.dimension_preset === 'Custom') {
      if (!metadata.custom_width || metadata.custom_width <= 0) {
        newErrors.custom_width = 'Width is required for custom dimensions';
      }
      if (!metadata.custom_height || metadata.custom_height <= 0) {
        newErrors.custom_height = 'Height is required for custom dimensions';
      }
    }

    if (metadata.external_link && !metadata.external_link.match(/^https?:\/\/.+/)) {
      newErrors.external_link = 'External link must be a valid URL';
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
        title: metadata.title!.trim(),
        creation_date: metadata.creation_date || null,
        description: metadata.description?.trim() || null,
        dimension_preset: metadata.dimension_preset || null,
        custom_width: metadata.custom_width || null,
        custom_height: metadata.custom_height || null,
        dimension_unit: metadata.dimension_unit || 'cm',
        pencil_grades: metadata.pencil_grades || null,
        charcoal_types: metadata.charcoal_types || null,
        paper_type: metadata.paper_type?.trim() || null,
        time_taken: metadata.time_taken?.trim() || null,
        tags: metadata.tags || null,
        copyright: metadata.copyright || '© Ankur Bag.',
        external_link: metadata.external_link?.trim() || null,
        is_published: isPublished,
      };

      const { error } = await supabase
        .from('artworks')
        .update(updates)
        .eq('id', artwork.id);

      if (error) throw error;

      // Update local state
      onUpdate(artwork.id, updates);

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
        <h2 className="text-lg font-semibold">Edit Artwork</h2>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Artwork Preview */}
      <div className="p-4 border-b">
        <img
          src={artwork.primary_image_url}
          alt={artwork.title || 'Artwork'}
          className="w-full h-48 object-contain rounded"
        />
      </div>

      {/* Form */}
      <div className="p-4 space-y-6 max-h-[calc(100vh-20rem)] overflow-y-auto">
        <ArtworkMetadataForm 
          metadata={metadata} 
          onChange={setMetadata}
          errors={errors}
        />

        {/* Published Toggle */}
        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
          <div>
            <Label htmlFor="is-published-edit" className="text-sm font-medium">
              Published
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Make this artwork visible to the public
            </p>
          </div>
          <Switch
            id="is-published-edit"
            checked={isPublished}
            onCheckedChange={setIsPublished}
            disabled={isSaving}
          />
        </div>

        {/* Process Images (Read-only display) */}
        {artwork.process_images && Array.isArray(artwork.process_images) && artwork.process_images.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Process Images ({artwork.process_images.length})</Label>
            <div className="grid grid-cols-2 gap-2">
              {artwork.process_images.slice(0, 4).map((img: { url: string; original_url?: string; caption?: string }, index: number) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={img.url}
                    alt={img.caption || `Process ${index + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              ))}
            </div>
            {artwork.process_images.length > 4 && (
              <p className="text-xs text-muted-foreground">
                +{artwork.process_images.length - 4} more
              </p>
            )}
          </div>
        )}

        {/* Original File Info (Read-only) */}
        {artwork.primary_image_original_url && (
          <div className="p-3 bg-muted/50 rounded-lg space-y-1">
            <Label className="text-xs font-semibold">Original File</Label>
            <p className="text-xs text-muted-foreground">
              {artwork.primary_image_width} × {artwork.primary_image_height} px
            </p>
            <a 
              href={artwork.primary_image_original_url} 
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
