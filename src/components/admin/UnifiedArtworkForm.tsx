import { useState, useEffect, useCallback } from 'react';
import { Upload, X, Loader2, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import ArtworkMetadataForm, { ArtworkMetadata } from './ArtworkMetadataForm';
import { ArtworkData } from '@/types/artwork';

export interface UnifiedArtworkFormData {
  metadata: ArtworkMetadata;
  primaryImage: File | null;
  processImages: File[];
  isPublished: boolean;
}

// Discriminated union for mode-specific props
type UnifiedArtworkFormProps = 
  | {
      mode: 'add';
      initialData?: Partial<UnifiedArtworkFormData>;
      artwork?: never;
      onClose?: never;
      onChange?: (data: UnifiedArtworkFormData) => void;
      showActions?: false;
      disabled?: boolean;
      errors?: Record<string, string>;
    }
  | {
      mode: 'edit';
      initialData?: never;
      artwork: ArtworkData; // Required for edit mode
      onClose?: () => void;
      onChange?: never;
      showActions?: boolean;
      disabled?: boolean;
      errors?: Record<string, string>;
    };

/**
 * Unified Artwork Form Component
 * 
 * Used for both "Upload New Artwork" (mode="add") and "Edit Artwork" (mode="edit")
 * Ensures both forms have the same fields in the same order with consistent validation.
 * 
 * Field Order (Canonical):
 * 1. Artwork Title
 * 2. Creation Date
 * 3. Dimensions
 * 4. Description / Concept
 * 5. Pencil Grades
 * 6. Charcoal Types
 * 7. Paper Type
 * 8. Time Taken to Complete
 * 9. Category / Collection Tags
 * 10. Copyright
 * 11. External / Purchase Link
 * 12. Primary Artwork Image
 * 13. Additional Images / Process Shots
 * 14. Published (Visibility Toggle)
 */
export default function UnifiedArtworkForm({
  mode,
  initialData,
  artwork,
  onClose,
  onChange,
  showActions = false,
  disabled = false,
  errors = {},
}: UnifiedArtworkFormProps) {
  // Initialize state based on mode
  const [metadata, setMetadata] = useState<ArtworkMetadata>(() => {
    if (mode === 'edit' && artwork) {
      return {
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
      };
    }
    return initialData?.metadata || {
      copyright: '© Ankur Bag.',
      dimension_unit: 'cm',
    };
  });

  const [primaryImage, setPrimaryImage] = useState<File | null>(
    initialData?.primaryImage || null
  );
  const [processImages, setProcessImages] = useState<File[]>(
    initialData?.processImages || []
  );
  const [isPublished, setIsPublished] = useState(
    mode === 'edit' && artwork ? artwork.is_published : initialData?.isPublished || false
  );
  const [isDragging, setIsDragging] = useState(false);

  // Notify parent of changes (for add mode)
  useEffect(() => {
    if (mode === 'add' && onChange) {
      onChange({
        metadata,
        primaryImage,
        processImages,
        isPublished,
      });
    }
  }, [mode, metadata, primaryImage, processImages, isPublished, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setPrimaryImage(file);
      }
    }
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleProcessImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
      setProcessImages(files);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metadata Form - Fields 1-11 in canonical order */}
      <ArtworkMetadataForm 
        metadata={metadata} 
        onChange={setMetadata}
        errors={errors}
      />

      {/* Field 12: Primary Artwork Image */}
      <div>
        <Label className="text-sm font-medium">
          Primary Artwork Image {mode === 'add' && <span className="text-destructive">*</span>}
        </Label>
        
        {mode === 'edit' && artwork && (
          <div className="mt-2 mb-4">
            <img
              src={artwork.primary_image_url}
              alt={artwork.title || 'Artwork'}
              className="w-full max-w-md h-48 object-contain rounded border"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Current image will be kept unless you upload a new one
            </p>
          </div>
        )}
        
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
            ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
            ${disabled ? 'pointer-events-none opacity-50' : ''}
          `}
          onClick={() => !disabled && document.getElementById('primary-image-input')?.click()}
        >
          <input
            id="primary-image-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setPrimaryImage(file);
              }
            }}
            disabled={disabled}
          />
          
          {primaryImage ? (
            <div className="flex flex-col items-center gap-2">
              <ImagePlus className="h-6 w-6 text-primary" />
              <p className="text-sm font-medium">{primaryImage.name}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setPrimaryImage(null);
                }}
                disabled={disabled}
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {mode === 'edit' 
                  ? 'Drop new image here to replace, or click to select'
                  : 'Drag and drop primary image here, or click to select'
                }
              </p>
            </div>
          )}
        </div>
        {errors.primaryImage && (
          <p className="text-xs text-destructive mt-1">{errors.primaryImage}</p>
        )}
      </div>

      {/* Field 13: Additional Images / Process Shots */}
      <div>
        <Label htmlFor="process-images" className="text-sm font-medium">
          Additional Images / Process Shots (Optional)
        </Label>
        
        {mode === 'edit' && artwork && artwork.process_images && artwork.process_images.length > 0 && (
          <div className="mt-2 mb-4">
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
              <p className="text-xs text-muted-foreground mt-2">
                +{artwork.process_images.length - 4} more
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Current process images will be kept. Upload new files to add more.
            </p>
          </div>
        )}
        
        <div className="mt-2 flex items-center gap-2">
          <input
            id="process-images"
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleProcessImagesChange}
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('process-images')?.click()}
            disabled={disabled}
          >
            <ImagePlus className="h-4 w-4 mr-2" />
            {processImages.length > 0 ? `${processImages.length} image(s) selected` : 'Select Process Images'}
          </Button>
          {processImages.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setProcessImages([])}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Field 14: Published Toggle */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <Label htmlFor="is-published" className="text-sm font-medium">
            Published
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Make this artwork visible to the public
          </p>
        </div>
        <Switch
          id="is-published"
          checked={isPublished}
          onCheckedChange={setIsPublished}
          disabled={disabled}
        />
      </div>

      {/* Original File Info (Edit mode only - read-only) */}
      {mode === 'edit' && artwork && artwork.primary_image_original_url && (
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
  );
}
