import { useState, useCallback } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatSupabaseError } from '@/lib/utils';
import { toast } from 'sonner';

type PhotoCategory = 'selected' | 'commissioned' | 'editorial' | 'personal';

interface PhotoUploaderProps {
  category: PhotoCategory;
  onUploadComplete: () => void;
}

export default function PhotoUploader({ category, onUploadComplete }: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);

  const compressImage = useCallback(async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        const maxWidth = 1920;
        const maxHeight = 1920;
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => resolve(blob!),
          'image/webp',
          0.85
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    try {
      // Compress image
      const compressedBlob = await compressImage(file);
      // Sanitize filename: remove extension, replace non-alphanumeric chars with hyphens
      const sanitizedName = file.name
        .replace(/\.[^/.]+$/, '') // Remove extension
        .replace(/[^a-zA-Z0-9]/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
      const fileName = `${category}/${Date.now()}-${sanitizedName || 'photo'}.webp`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, compressedBlob, {
          contentType: 'image/webp',
          cacheControl: '31536000'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName);

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

      // Calculate initial position for new photo (simple grid layout)
      const photosPerRow = 3;
      const photoWidth = 300;
      const photoHeight = 400;
      const gap = 20;
      const row = Math.floor(nextOrder / photosPerRow);
      const col = nextOrder % photosPerRow;
      
      const initialX = col * (photoWidth + gap);
      const initialY = row * (photoHeight + gap);

      // Insert into photos table with initial layout
      // Note: is_draft defaults to false (published) so photos appear immediately
      // They become drafts when layout is modified and saved, then published again
      const { error: insertError } = await supabase
        .from('photos')
        .insert({
          category,
          image_url: publicUrl,
          display_order: nextOrder,
          title: file.name.replace(/\.[^/.]+$/, ''),
          position_x: initialX,
          position_y: initialY,
          width: photoWidth,
          height: photoHeight,
          scale: 1.0,
          rotation: 0,
          z_index: nextZIndex,
          is_draft: false, // Explicitly set to published (matches DB default)
        });

      if (insertError) throw insertError;

      return file.name;
    } catch (error) {
      const errorMessage = formatSupabaseError(error);
      console.error('Upload error:', errorMessage);
      throw new Error(errorMessage);
    }
  }, [category, compressImage]);

  const handleFiles = useCallback(async (files: FileList) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast.error('Please select image files only');
      return;
    }

    setUploading(true);
    setUploadProgress([]);

    for (const file of imageFiles) {
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
    toast.success(`Uploaded ${imageFiles.length} photo(s)`);
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
          accept="image/*"
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
              Drag and drop images here, or click to select
            </p>
            <p className="text-xs text-muted-foreground">
              Images will be optimized and converted to WebP
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
