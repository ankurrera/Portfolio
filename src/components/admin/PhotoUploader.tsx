import { useState, useCallback } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
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

  const compressImage = async (file: File): Promise<Blob> => {
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
  };

  const uploadFile = async (file: File) => {
    try {
      // Compress image
      const compressedBlob = await compressImage(file);
      const fileName = `${category}/${Date.now()}-${file.name.replace(/\.[^/.]+$/, '')}.webp`;
      
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

      // Get current max display order
      const { data: maxOrderData } = await supabase
        .from('photos')
        .select('display_order')
        .eq('category', category)
        .order('display_order', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextOrder = (maxOrderData?.display_order ?? -1) + 1;

      // Insert into photos table
      const { error: insertError } = await supabase
        .from('photos')
        .insert({
          category,
          image_url: publicUrl,
          display_order: nextOrder,
          title: file.name.replace(/\.[^/.]+$/, '')
        });

      if (insertError) throw insertError;

      return file.name;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleFiles = async (files: FileList) => {
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
        setUploadProgress(prev => 
          prev.map(p => p === `Uploading ${file.name}...` ? `✗ ${file.name} failed` : p)
        );
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
    toast.success(`Uploaded ${imageFiles.length} photo(s)`);
    onUploadComplete();
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [category]);

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
