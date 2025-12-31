import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PhotoLayoutData } from '@/types/wysiwyg';
import UnifiedPhotoForm from './UnifiedPhotoForm';

interface PhotoEditPanelProps {
  photo: PhotoLayoutData;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<PhotoLayoutData>) => void;
}

export default function PhotoEditPanel({ photo, onClose, onUpdate }: PhotoEditPanelProps) {
  // Helper to safely parse external links
  const parseExternalLinks = (links: any): Array<{ title: string; url: string }> => {
    if (!links) return [];
    if (!Array.isArray(links)) return [];
    
    return links.filter(
      (link): link is { title: string; url: string } => 
        typeof link === 'object' && 
        link !== null && 
        'title' in link && 
        'url' in link &&
        (typeof link.title === 'string' || link.title === null) &&
        (typeof link.url === 'string' || link.url === null)
    ).map(link => ({
      title: link.title || '',
      url: link.url || ''
    }));
  };

  // Prepare initial data from photo
  const initialData = {
    caption: photo.caption || undefined,
    photographer_name: photo.photographer_name || undefined,
    date_taken: photo.date_taken || undefined,
    device_used: photo.device_used || undefined,
    year: photo.year || undefined,
    tags: photo.tags || undefined,
    credits: photo.credits || undefined,
    camera_lens: photo.camera_lens || undefined,
    project_visibility: photo.project_visibility || 'public',
    external_links: parseExternalLinks(photo.external_links),
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-background border-l shadow-lg z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Edit Photo</h2>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Photo Preview */}
      <div className="p-4 border-b">
        <img
          src={photo.image_url}
          alt={photo.caption || 'Photo'}
          className="w-full h-48 object-contain rounded"
        />
      </div>

      {/* Form */}
      <div className="p-4 space-y-4">
        <UnifiedPhotoForm
          mode="edit"
          initialData={initialData}
          photo={photo}
          onClose={onClose}
          onUpdate={onUpdate}
          showActions={true}
        />

        {/* Original File Info (Read-only) */}
        {photo.original_file_url && (
          <div className="p-3 bg-muted/50 rounded-lg space-y-1 mt-4">
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
    </div>
  );
}
