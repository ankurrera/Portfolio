import { useState, useCallback } from 'react';
import { Upload, X, Loader2, Video, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatSupabaseError } from '@/lib/utils';
import { toast } from 'sonner';
import PhotoMetadataForm, { PhotoMetadata } from './PhotoMetadataForm';

interface PhotoUploaderProps {
  onUploadComplete: () => void;
  onCancel?: () => void;
}

interface PendingFile {
  file: File;
  previewUrl: string;
}

// Interface for photo insert data to ensure type safety
// Note: category is optional for backward compatibility with schemas where it may not exist
interface PhotoInsertData {
  image_url: string;
  display_order: number;
  title: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
  z_index: number;
  is_draft: boolean;
  caption: string | null;
  photographer_name: string | null;
  date_taken: string | null;
  device_used: string | null;
  video_thumbnail_url: string | null;
  original_file_url: string;
  original_width: number | null;
  original_height: number | null;
  original_mime_type: string;
  original_size_bytes: number;
  year: number | null;
  tags: string[] | null;
  credits: string | null;
  camera_lens: string | null;
  project_visibility: string;
  external_links: Record<string, unknown>[] | null;
  // Category is optional to support both:
  // 1. Old schema where category column exists with photo_category enum ('selected' | 'commissioned' | 'editorial' | 'personal' | 'artistic')
  // 2. New schema where category column has been dropped
  category?: 'selected' | 'commissioned' | 'editorial' | 'personal' | 'artistic';
}

export default function PhotoUploader({ onUploadComplete, onCancel }: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<PhotoMetadata>({});
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

  // Helper function to extract storage path from Supabase public URL
  const extractStoragePath = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      // Extract path after /storage/v1/object/public/photos/
      const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/photos\/(.+)$/);
      if (pathMatch && pathMatch[1]) {
        return pathMatch[1];
      }
      // Fallback: try simple split if URL format is different
      const parts = url.split('/photos/');
      return parts.length > 1 ? parts[parts.length - 1] : null;
    } catch {
      return null;
    }
  };

  // PostgreSQL constraint error codes to detect
  const CONSTRAINT_ERROR_CODES = ['23502', '23503', '23505'] as const;

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
        const fileName = `photoshoots/${Date.now()}-${sanitizedName || 'video'}.mp4`;
        
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
        const originalFileName = `photoshoots/originals/${Date.now()}-${sanitizedName || 'photo'}.${originalExt}`;
        
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
        const derivativeFileName = `photoshoots/derivatives/${Date.now()}-${sanitizedName || 'photo'}.webp`;
        
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

      // Prepare base insert data with proper typing
      const insertData: PhotoInsertData = {
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
      };

      // Add category field for backward compatibility if the column still exists in DB
      // This handles cases where the drop category migration hasn't been applied yet
      // Use 'selected' as it's a valid photo_category enum value
      insertData.category = 'selected';

      // Insert into photos table with all metadata and original file info
      const { error: insertError } = await supabase
        .from('photos')
        .insert(insertData);

      if (insertError) {
        // If database insert fails, try to clean up uploaded files to prevent orphaned storage
        console.error('Database insert failed, attempting to clean up uploaded files:', insertError);
        
        try {
          // Delete uploaded files from storage
          const filesToDelete: string[] = [];
          
          if (isVideo) {
            // Extract video file path from URL
            const videoPath = extractStoragePath(originalUrl);
            if (videoPath) filesToDelete.push(videoPath);
          } else {
            // Extract original and derivative paths
            const origPath = extractStoragePath(originalUrl);
            const derivPath = extractStoragePath(derivativeUrl);
            if (origPath) filesToDelete.push(origPath);
            if (derivPath) filesToDelete.push(derivPath);
          }
          
          if (filesToDelete.length > 0) {
            await supabase.storage.from('photos').remove(filesToDelete);
            console.log('Cleaned up uploaded files after database error');
          }
        } catch (cleanupError) {
          console.error('Failed to clean up uploaded files:', cleanupError);
          // Don't throw cleanup error, throw original insert error
        }
        
        throw insertError;
      }

      return file.name;
    } catch (error) {
      const errorMessage = formatSupabaseError(error);
      console.error('Upload error:', errorMessage);
      
      // Check if error is a database constraint violation
      // Type guard for checking if error has a code property of expected type
      const isErrorWithCode = (err: unknown): err is { code: string } => {
        return err !== null && typeof err === 'object' && 'code' in err && typeof (err as any).code === 'string';
      };
      
      const isConstraintError = 
        (isErrorWithCode(error) && CONSTRAINT_ERROR_CODES.includes(error.code as typeof CONSTRAINT_ERROR_CODES[number])) ||
        CONSTRAINT_ERROR_CODES.some(code => errorMessage.includes(code));
      
      // Provide more specific error message for database constraint errors
      if (isConstraintError) {
        throw new Error(`Database constraint error: ${errorMessage}. Photo uploaded to storage but metadata save failed. Please contact administrator.`);
      }
      
      throw new Error(errorMessage);
    }
  }, [generateDerivative, getImageDimensions, metadata]);

  // Handle file selection (preview only, no upload yet)
  const handleFiles = useCallback((files: FileList) => {
    const mediaFiles = Array.from(files).filter(f => 
      f.type.startsWith('image/') || f.type.startsWith('video/')
    );
    
    if (mediaFiles.length === 0) {
      toast.error('Please select image or video files only');
      return;
    }

    // Create preview URLs for selected files
    const newPendingFiles: PendingFile[] = mediaFiles.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    setPendingFiles(prev => [...prev, ...newPendingFiles]);
    toast.success(`${mediaFiles.length} file(s) selected. Fill metadata and click "Upload & Publish" to confirm.`);
  }, []);

  // Handle actual upload when user clicks the button
  const handleUploadAndPublish = useCallback(async () => {
    if (pendingFiles.length === 0) {
      toast.error('No files selected for upload');
      return;
    }

    setUploading(true);
    setUploadProgress([]);
    
    let successCount = 0;
    let failCount = 0;

    for (const { file } of pendingFiles) {
      try {
        setUploadProgress(prev => [...prev, `Uploading ${file.name}...`]);
        await uploadFile(file);
        setUploadProgress(prev => 
          prev.map(p => p === `Uploading ${file.name}...` ? `✓ ${file.name}` : p)
        );
        successCount++;
      } catch (error) {
        const errorMessage = formatSupabaseError(error);
        setUploadProgress(prev => 
          prev.map(p => p === `Uploading ${file.name}...` ? `✗ ${file.name}: ${errorMessage}` : p)
        );
        toast.error(`Failed to upload ${file.name}: ${errorMessage}`);
        failCount++;
      }
    }

    setUploading(false);
    
    // Show appropriate success/failure message
    if (successCount > 0 && failCount === 0) {
      toast.success(`Successfully uploaded ${successCount} file(s)`);
    } else if (successCount > 0 && failCount > 0) {
      toast.warning(`Uploaded ${successCount} file(s), ${failCount} failed. Check details above.`);
    } else {
      toast.error(`All uploads failed. Please check the errors and try again.`);
    }
    
    // Clean up preview URLs
    pendingFiles.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
    
    // Reset form after successful upload
    if (successCount > 0) {
      // Reset everything after successful upload
      setPendingFiles([]);
      setMetadata({});
      
      onUploadComplete();
    }
  }, [pendingFiles, uploadFile, onUploadComplete]);

  const handleRemovePendingFile = useCallback((index: number) => {
    setPendingFiles(prev => {
      const newFiles = [...prev];
      // Clean up preview URL
      URL.revokeObjectURL(newFiles[index].previewUrl);
      newFiles.splice(index, 1);
      return newFiles;
    });
    toast.info('File removed from upload queue');
  }, []);

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
    <div className="space-y-4 flex flex-col min-h-0">
      {/* Metadata Form */}
      <PhotoMetadataForm 
        metadata={metadata} 
        onMetadataChange={setMetadata} 
      />

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
              Files will not be uploaded until you click "Upload & Publish"
            </p>
          </div>
        )}
      </div>

      {/* Pending Files Preview */}
      {pendingFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              Selected Files ({pendingFiles.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                pendingFiles.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
                setPendingFiles([]);
                toast.info('All files removed');
              }}
              disabled={uploading}
            >
              Clear All
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {pendingFiles.map(({ file, previewUrl }, index) => (
              <div key={index} className="relative group border rounded-lg overflow-hidden">
                {file.type.startsWith('image/') ? (
                  <img 
                    src={previewUrl} 
                    alt={file.name} 
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="w-full h-32 bg-secondary flex items-center justify-center">
                    <Video className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePendingFile(index);
                    }}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
                <div className="p-2 bg-secondary/50">
                  <p className="text-xs truncate" title={file.name}>
                    {file.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadProgress.length > 0 && (
        <div className="text-xs space-y-1 max-h-32 overflow-y-auto bg-secondary/50 p-3 rounded">
          {uploadProgress.map((msg, i) => (
            <p key={i} className={msg.startsWith('✓') ? 'text-green-600' : msg.startsWith('✗') ? 'text-destructive' : 'text-muted-foreground'}>
              {msg}
            </p>
          ))}
        </div>
      )}

      {/* Sticky Action Bar - Always visible at bottom */}
      {pendingFiles.length > 0 && (
        <div className="sticky bottom-0 -mx-2 -mb-2 mt-4 p-4 bg-background border-t shadow-lg flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {pendingFiles.length} file(s) ready to upload
          </div>
          <Button
            onClick={handleUploadAndPublish}
            disabled={uploading || pendingFiles.length === 0}
            size="lg"
            className="font-semibold"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload & Publish ({pendingFiles.length})
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
