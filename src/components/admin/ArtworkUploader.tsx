import { useState, useCallback } from 'react';
import { Upload, X, Loader2, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { formatSupabaseError } from '@/lib/utils';
import { toast } from 'sonner';
import ArtworkMetadataForm, { ArtworkMetadata } from './ArtworkMetadataForm';

interface ArtworkUploaderProps {
  onUploadComplete: () => void;
}

export default function ArtworkUploader({ onUploadComplete }: ArtworkUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<ArtworkMetadata>({
    copyright: '© Ankur Bag.',
    dimension_unit: 'cm',
  });
  const [primaryImage, setPrimaryImage] = useState<File | null>(null);
  const [processImages, setProcessImages] = useState<File[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Generate web-optimized derivative with aspect ratio preservation
  const generateDerivative = useCallback(async (file: File, originalWidth: number, originalHeight: number): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        const maxDimension = 2400; // Max dimension for web derivative
        let { width, height } = img;
        
        // Preserve aspect ratio while limiting max dimension
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Use high-quality WebP encoding (0.95 quality)
        canvas.toBlob(
          (blob) => resolve(blob!),
          'image/webp',
          0.95
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Get original image dimensions
  const getImageDimensions = useCallback(async (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const uploadArtwork = useCallback(async () => {
    // Validate form inline
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

    if (!primaryImage) {
      newErrors.primaryImage = 'Primary artwork image is required';
    }

    if (metadata.external_link && !metadata.external_link.match(/^https?:\/\/.+/)) {
      newErrors.external_link = 'External link must be a valid URL';
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fix validation errors');
      return;
    }

    setUploading(true);
    setUploadProgress(['Validating artwork data...']);

    try {
      // Upload primary image
      setUploadProgress(prev => [...prev, 'Uploading primary image...']);
      
      const dimensions = await getImageDimensions(primaryImage!);
      const originalWidth = dimensions.width;
      const originalHeight = dimensions.height;

      const sanitizedName = primaryImage!.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      // Upload ORIGINAL file byte-for-byte (no compression)
      const originalExt = primaryImage!.name.split('.').pop() || 'jpg';
      const originalFileName = `artworks/originals/${Date.now()}-${sanitizedName || 'artwork'}.${originalExt}`;
      
      const { error: origUploadError } = await supabase.storage
        .from('photos')
        .upload(originalFileName, primaryImage!, {
          contentType: primaryImage!.type,
          cacheControl: '31536000'
        });

      if (origUploadError) throw origUploadError;

      const { data: { publicUrl: originalUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(originalFileName);

      // Generate and upload web-optimized derivative
      const derivativeBlob = await generateDerivative(primaryImage!, originalWidth, originalHeight);
      const derivativeFileName = `artworks/derivatives/${Date.now()}-${sanitizedName || 'artwork'}.webp`;
      
      const { error: derivUploadError } = await supabase.storage
        .from('photos')
        .upload(derivativeFileName, derivativeBlob, {
          contentType: 'image/webp',
          cacheControl: '31536000'
        });

      if (derivUploadError) throw derivUploadError;

      const { data: { publicUrl: derivativeUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(derivativeFileName);

      setUploadProgress(prev => [...prev, '✓ Primary image uploaded']);

      // Upload process images
      const processImagesData = [];
      if (processImages.length > 0) {
        setUploadProgress(prev => [...prev, `Uploading ${processImages.length} process image(s)...`]);
        
        for (const processImg of processImages) {
          try {
            const procDimensions = await getImageDimensions(processImg);
            const procSanitizedName = processImg.name
              .replace(/\.[^/.]+$/, '')
              .replace(/[^a-zA-Z0-9]/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '');
            
            // Upload original
            const procOrigExt = processImg.name.split('.').pop() || 'jpg';
            const procOrigFileName = `artworks/originals/process/${Date.now()}-${procSanitizedName}.${procOrigExt}`;
            
            const { error: procOrigError } = await supabase.storage
              .from('photos')
              .upload(procOrigFileName, processImg, {
                contentType: processImg.type,
                cacheControl: '31536000'
              });

            if (procOrigError) throw procOrigError;

            const { data: { publicUrl: procOrigUrl } } = supabase.storage
              .from('photos')
              .getPublicUrl(procOrigFileName);

            // Upload derivative
            const procDerivBlob = await generateDerivative(processImg, procDimensions.width, procDimensions.height);
            const procDerivFileName = `artworks/derivatives/process/${Date.now()}-${procSanitizedName}.webp`;
            
            const { error: procDerivError } = await supabase.storage
              .from('photos')
              .upload(procDerivFileName, procDerivBlob, {
                contentType: 'image/webp',
                cacheControl: '31536000'
              });

            if (procDerivError) throw procDerivError;

            const { data: { publicUrl: procDerivUrl } } = supabase.storage
              .from('photos')
              .getPublicUrl(procDerivFileName);

            processImagesData.push({
              url: procDerivUrl,
              original_url: procOrigUrl,
              caption: processImg.name.replace(/\.[^/.]+$/, ''),
            });
          } catch (error) {
            const errorMessage = formatSupabaseError(error);
            console.error(`Error uploading process image ${processImg.name}:`, errorMessage);
            setUploadProgress(prev => [...prev, `⚠️ Warning: Failed to upload process image ${processImg.name}`]);
            // Continue with other process images
          }
        }
        
        setUploadProgress(prev => [...prev, `✓ Uploaded ${processImagesData.length}/${processImages.length} process image(s)`]);
      }

      // Get current max z_index
      const { data: maxZData } = await supabase
        .from('artworks')
        .select('z_index')
        .order('z_index', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextZIndex = (maxZData?.z_index ?? -1) + 1;

      // Calculate initial position based on original aspect ratio
      const defaultWidth = 300;
      const aspectRatio = originalHeight / originalWidth;
      const initialHeight = Math.round(defaultWidth * aspectRatio);
      
      // Insert into artworks table
      setUploadProgress(prev => [...prev, 'Saving artwork data...']);
      
      const { error: insertError } = await supabase
        .from('artworks')
        .insert({
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
          primary_image_url: derivativeUrl,
          primary_image_original_url: originalUrl,
          primary_image_width: originalWidth,
          primary_image_height: originalHeight,
          process_images: processImagesData,
          is_published: isPublished,
          external_link: metadata.external_link?.trim() || null,
          position_x: 0,
          position_y: 0,
          width: defaultWidth,
          height: initialHeight,
          scale: 1.0,
          rotation: 0,
          z_index: nextZIndex,
        });

      if (insertError) throw insertError;

      setUploadProgress(prev => [...prev, '✓ Artwork saved successfully']);
      toast.success('Artwork uploaded successfully');
      
      // Reset form
      setMetadata({
        copyright: '© Ankur Bag.',
        dimension_unit: 'cm',
      });
      setPrimaryImage(null);
      setProcessImages([]);
      setIsPublished(false);
      setErrors({});
      
      onUploadComplete();
    } catch (error) {
      const errorMessage = formatSupabaseError(error);
      console.error('Upload error:', errorMessage);
      setUploadProgress(prev => [...prev, `✗ Error: ${errorMessage}`]);
      toast.error(`Failed to upload artwork: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  }, [metadata, primaryImage, processImages, isPublished, generateDerivative, getImageDimensions, onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setPrimaryImage(file);
        toast.success(`Primary image selected: ${file.name}`);
      } else {
        toast.error('Please select an image file');
      }
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleProcessImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
      setProcessImages(files);
      toast.success(`${files.length} process image(s) selected`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metadata Form */}
      <ArtworkMetadataForm 
        metadata={metadata} 
        onChange={setMetadata}
        errors={errors}
      />

      {/* Primary Image Upload */}
      <div>
        <Label className="text-sm font-medium">
          Primary Artwork Image <span className="text-destructive">*</span>
        </Label>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
            ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
          onClick={() => document.getElementById('primary-image-input')?.click()}
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
                toast.success(`Primary image selected: ${file.name}`);
              }
            }}
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
                disabled={uploading}
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag and drop primary image here, or click to select
              </p>
            </div>
          )}
        </div>
        {errors.primaryImage && (
          <p className="text-xs text-destructive mt-1">{errors.primaryImage}</p>
        )}
      </div>

      {/* Process Images Upload */}
      <div>
        <Label htmlFor="process-images" className="text-sm font-medium">
          Additional Images / Process Shots (Optional)
        </Label>
        <div className="mt-2 flex items-center gap-2">
          <input
            id="process-images"
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleProcessImagesChange}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('process-images')?.click()}
            disabled={uploading}
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
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Published Toggle */}
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
          disabled={uploading}
        />
      </div>

      {/* Upload Button */}
      <Button 
        onClick={uploadArtwork} 
        disabled={uploading || !primaryImage}
        className="w-full"
        size="lg"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Upload Artwork
          </>
        )}
      </Button>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="text-xs space-y-1 max-h-32 overflow-y-auto bg-secondary/50 p-3 rounded">
          {uploadProgress.map((msg, i) => (
            <p key={i} className={msg.startsWith('✓') ? 'text-green-600' : msg.startsWith('✗') ? 'text-destructive' : 'text-muted-foreground'}>
              {msg}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
