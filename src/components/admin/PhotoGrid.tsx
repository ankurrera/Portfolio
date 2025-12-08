import { useState } from 'react';
import { Trash2, GripVertical, Pencil, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Photo {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  display_order: number;
  category: string;
}

interface PhotoGridProps {
  photos: Photo[];
  onUpdate: () => void;
}

export default function PhotoGrid({ photos, onUpdate }: PhotoGridProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (photo: Photo) => {
    setDeleting(photo.id);
    
    try {
      // Extract file path from URL
      const urlParts = photo.image_url.split('/photos/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('photos').remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photo.id);

      if (error) throw error;

      toast.success('Photo deleted');
      onUpdate();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete photo');
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = (photo: Photo) => {
    setEditingId(photo.id);
    setEditTitle(photo.title || '');
  };

  const handleSaveEdit = async (photoId: string) => {
    try {
      const { error } = await supabase
        .from('photos')
        .update({ title: editTitle })
        .eq('id', photoId);

      if (error) throw error;

      toast.success('Title updated');
      setEditingId(null);
      onUpdate();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update title');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No photos in this category yet. Upload some above!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="group relative aspect-square bg-secondary rounded overflow-hidden"
        >
          <img
            src={photo.image_url}
            alt={photo.title || 'Photo'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
            <div className="flex justify-end gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => handleEdit(photo)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    disabled={deleting === photo.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete photo?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The photo will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(photo)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            
            {editingId === photo.id ? (
              <div className="flex gap-1">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="Photo title"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  onClick={() => handleSaveEdit(photo.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  onClick={handleCancelEdit}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <p className="text-xs text-foreground truncate">
                {photo.title || 'Untitled'}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
