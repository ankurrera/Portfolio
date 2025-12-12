import { useState, useCallback } from 'react';
import { Upload, X, Loader2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatSupabaseError } from '@/lib/utils';
import { toast } from 'sonner';
import PhotoMetadataForm, { PhotoMetadata } from './PhotoMetadataForm';
import { PhotoCategory } from '@/types/wysiwyg';

interface PhotoUploaderProps {
  category: PhotoCategory;
  onUploadComplete: () => void;
}

export default function PhotoUploader({ category, onUploadComplete }: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<PhotoMetadata>({});
  const [videoThumbnail, setVideoThumbnail] = useState<File | null>(null);

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

  const uploadFile = useCallback(async (file: File) => {
    try {
      const isVideo = file.type.startsWith('video/');
      let derivativeUrl: string;
      let originalUrl: string;
      let thumbnailUrl: string | null = null;
      let originalWidth: number | null = null;
      let originalHeight: number | null = null;

      if (isVideo) {
        // Upload video file directly without compression
        const sanitizedName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[^a-zA-Z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        const fileName = `${category}/${Date.now()}-${sanitizedName || 'video'}.mp4`;
        
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, file, {
            contentType: file.type,
            cacheControl: '31536000'
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl: videoUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(fileName);
        
        derivativeUrl = videoUrl;
        originalUrl = videoUrl; // For videos, original and derivative are the same

        // Upload video thumbnail if provided
        if (videoThumbnail) {
          const thumbDimensions = await getImageDimensions(videoThumbnail);
          const compressedThumbnail = await generateDerivative(videoThumbnail, thumbDimensions.width, thumbDimensions.height);
          const thumbnailFileName = `${category}/${Date.now()}-${sanitizedName || 'video'}-thumbnail.webp`;
          
          const { error: thumbError } = await supabase.storage
            .from('photos')
            .upload(thumbnailFileName, compressedThumbnail, {
              contentType: 'image/webp',
              cacheControl: '31536000'
            });

          if (!thumbError) {
            const { data: { publicUrl: thumbUrl } } = supabase.storage
              .from('photos')
              .getPublicUrl(thumbnailFileName);
            thumbnailUrl = thumbUrl;
          }
        }
      } else {
        // Get original dimensions
        const dimensions = await getImageDimensions(file);
        originalWidth = dimensions.width;
        originalHeight = dimensions.height;

        const sanitizedName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[^a-zA-Z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        
        // Upload ORIGINAL file byte-for-byte (no compression)
        const originalExt = file.name.split('.').pop() || 'jpg';
        const originalFileName = `${category}/originals/${Date.now()}-${sanitizedName || 'photo'}.${originalExt}`;
        
        const { error: origUploadError } = await supabase.storage
          .from('photos')
          .upload(originalFileName, file, {
            contentType: file.type,
            cacheControl: '31536000'
          });

        if (origUploadError) throw origUploadError;

        const { data: { publicUrl: origUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(originalFileName);
        
        originalUrl = origUrl;

        // Generate and upload web-optimized derivative
        const derivativeBlob = await generateDerivative(file, originalWidth, originalHeight);
        const derivativeFileName = `${category}/derivatives/${Date.now()}-${sanitizedName || 'photo'}.webp`;
        
        const { error: derivUploadError } = await supabase.storage
          .from('photos')
          .upload(derivativeFileName, derivativeBlob, {
            contentType: 'image/webp',
            cacheControl: '31536000'
          });

        if (derivUploadError) throw derivUploadError;

        const { data: { publicUrl: derivUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(derivativeFileName);
        
        derivativeUrl = derivUrl;
      }

      // Get current max display order and z_index
      const { data: maxOrderData } = await supabase
        .from('photos')
        .select('display_order, z_index')
        .eq('category', category)
        .order('display_order', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextOrder = (maxOrderData?.display_order ?? -1) + 1;
      const nextZIndex = (maxOrderData?.z_index ?? -1) + 1;

      // Calculate initial position based on original aspect ratio
      const photosPerRow = 3;
      const defaultWidth = 300;
      let initialWidth = defaultWidth;
      let initialHeight = 400;
      
      // If we have original dimensions, calculate height to preserve aspect ratio
      if (originalWidth && originalHeight) {
        const aspectRatio = originalHeight / originalWidth;
        initialHeight = Math.round(defaultWidth * aspectRatio);
      }
      
      const gap = 20;
      const row = Math.floor(nextOrder / photosPerRow);
      const col = nextOrder % photosPerRow;
      
      const initialX = col * (defaultWidth + gap);
      const initialY = row * (initialHeight + gap);

      // Prepare external links as JSONB
      const externalLinksJson = metadata.external_links || [];

      // Insert into photos table with all metadata and original file info
      const { error: insertError } = await supabase
        .from('photos')
        .insert({
          category,
          image_url: derivativeUrl,
          display_order: nextOrder,
          title: file.name.replace(/\.[^/.]+$/, ''),
          position_x: initialX,
          position_y: initialY,
          width: initialWidth,
          height: initialHeight,
          scale: 1.0,
          rotation: 0,
          z_index: nextZIndex,
          is_draft: false,
          caption: metadata.caption || null,
          photographer_name: metadata.photographer_name || null,
          date_taken: metadata.date_taken || null,
          device_used: metadata.device_used || null,
          video_thumbnail_url: thumbnailUrl,
          // Original file tracking
          original_file_url: originalUrl,
          original_width: originalWidth,
          original_height: originalHeight,
          original_mime_type: file.type,
          original_size_bytes: file.size,
          // Extended metadata
          year: metadata.year || null,
          tags: metadata.tags || null,
          credits: metadata.credits || null,
          camera_lens: metadata.camera_lens || null,
          project_visibility: metadata.project_visibility || 'public',
          external_links: externalLinksJson,
        });

      if (insertError) throw insertError;

      return file.name;
    } catch (error) {
      const errorMessage = formatSupabaseError(error);
      console.error('Upload error:', errorMessage);
      throw new Error(errorMessage);
    }
  }, [category, generateDerivative, getImageDimensions, metadata, videoThumbnail]);

  const handleFiles = useCallback(async (files: FileList) => {
    const mediaFiles = Array.from(files).filter(f => 
      f.type.startsWith('image/') || f.type.startsWith('video/')
    );
    
    if (mediaFiles.length === 0) {
      toast.error('Please select image or video files only');
      return;
    }

    setUploading(true);
    setUploadProgress([]);

    for (const file of mediaFiles) {
      try {
        setUploadProgress(prev => [...prev, `Uploading ${file.name}...`]);
        await uploadFile(file);
        setUploadProgress(prev => 
          prev.map(p => p === `Uploading ${file.name}...` ? `✓ ${file.name}` : p)
        );
      } catch (error) {
        const errorMessage = formatSupabaseError(error);
        setUploadProgress(prev => 
          prev.map(p => p === `Uploading ${file.name}...` ? `✗ ${file.name}: ${errorMessage}` : p)
        );
        toast.error(`Failed to upload ${file.name}: ${errorMessage}`);
      }
    }

    setUploading(false);
    toast.success(`Uploaded ${mediaFiles.length} file(s)`);
    
    // Reset metadata and video thumbnail after successful upload
    setMetadata({});
    setVideoThumbnail(null);
    
    onUploadComplete();
  }, [uploadFile, onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div className="space-y-4">
      {/* Metadata Form */}
      <PhotoMetadataForm 
        metadata={metadata} 
        onMetadataChange={setMetadata} 
      />

      {/* Video Thumbnail Upload */}
      <div className="p-4 border rounded-lg bg-secondary/20">
        <h3 className="text-sm font-semibold mb-3">Video Thumbnail (Optional)</h3>
        <p className="text-xs text-muted-foreground mb-2">
          Upload a separate image to use as a thumbnail for videos
        </p>
        <div className="flex items-center gap-2">
          <input
            id="thumbnail-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setVideoThumbnail(file);
                toast.success(`Thumbnail selected: ${file.name}`);
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('thumbnail-input')?.click()}
            disabled={uploading}
          >
            <Video className="h-4 w-4 mr-2" />
            {videoThumbnail ? 'Change Thumbnail' : 'Select Thumbnail'}
          </Button>
          {videoThumbnail && (
            <>
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                {videoThumbnail.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setVideoThumbnail(null);
                  toast.info('Thumbnail removed');
                }}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag and drop images or videos here, or click to select
            </p>
            <p className="text-xs text-muted-foreground">
              Originals preserved • Derivatives auto-generated • Aspect ratio maintained
            </p>
          </div>
        )}
      </div>

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
