import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AchievementData, AchievementCategory } from '@/types/achievement';
import { Loader2, Upload, X } from 'lucide-react';

interface AchievementFormProps {
  achievement?: AchievementData | null;
  onSave: (achievement: AchievementData) => void;
  onCancel: () => void;
}

const categories: AchievementCategory[] = [
  'School',
  'College',
  'National',
  'Online Courses',
  'Extra Curricular',
];

const AchievementForm = ({ achievement, onSave, onCancel }: AchievementFormProps) => {
  const [title, setTitle] = useState(achievement?.title || '');
  const [description, setDescription] = useState(achievement?.description || '');
  const [category, setCategory] = useState<AchievementCategory>(achievement?.category || 'School');
  const [externalLink, setExternalLink] = useState(achievement?.external_link || '');
  const [displayOrder, setDisplayOrder] = useState(achievement?.display_order || 0);
  const [isPublished, setIsPublished] = useState(achievement?.is_published || false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(achievement?.image_url || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (achievement) {
      setTitle(achievement.title);
      setDescription(achievement.description || '');
      setCategory(achievement.category);
      setExternalLink(achievement.external_link || '');
      setDisplayOrder(achievement.display_order);
      setIsPublished(achievement.is_published);
      setImagePreview(achievement.image_url);
    }
  }, [achievement]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be less than 10MB');
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<{ url: string; width: number; height: number } | null> => {
    try {
      setIsUploading(true);

      // Get image dimensions
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(objectUrl); // Clean up memory
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl); // Clean up memory on error too
          reject(new Error('Failed to load image'));
        };
        img.src = objectUrl;
      });

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `achievements/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      return { url: publicUrl, width: dimensions.width, height: dimensions.height };
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!imagePreview && !imageFile) {
      toast.error('Please select an image');
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = achievement?.image_url || '';
      let imageWidth = achievement?.image_width || null;
      let imageHeight = achievement?.image_height || null;

      // Upload new image if selected
      if (imageFile) {
        const uploadResult = await uploadImage(imageFile);
        if (!uploadResult) {
          setIsSubmitting(false);
          return;
        }
        imageUrl = uploadResult.url;
        imageWidth = uploadResult.width;
        imageHeight = uploadResult.height;
      }

      const achievementData = {
        title: title.trim(),
        description: description.trim() || null,
        category,
        image_url: imageUrl,
        image_original_url: imageUrl,
        image_width: imageWidth,
        image_height: imageHeight,
        display_order: displayOrder,
        is_published: isPublished,
        external_link: externalLink.trim() || null,
      };

      if (achievement?.id) {
        // Update existing achievement
        const { data, error } = await supabase
          .from('achievements')
          .update(achievementData)
          .eq('id', achievement.id)
          .select()
          .single();

        if (error) throw error;
        
        toast.success('Achievement updated successfully');
        onSave(data as AchievementData);
      } else {
        // Create new achievement
        const { data, error } = await supabase
          .from('achievements')
          .insert([achievementData])
          .select()
          .single();

        if (error) throw error;
        
        toast.success('Achievement created successfully');
        onSave(data as AchievementData);
      }
    } catch (error) {
      console.error('Error saving achievement:', error);
      toast.error('Failed to save achievement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Academic Excellence Award"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={category} onValueChange={(value) => setCategory(value as AchievementCategory)}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the achievement"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Certificate Image *</Label>
          <div className="flex gap-4 items-start">
            {imagePreview && (
              <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="flex-1">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supported formats: JPG, PNG, WebP (Max 10MB)
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="externalLink">External Link</Label>
          <Input
            id="externalLink"
            type="url"
            value={externalLink}
            onChange={(e) => setExternalLink(e.target.value)}
            placeholder="https://example.com/certificate"
          />
          <p className="text-xs text-muted-foreground">
            Optional link to certificate verification or external source
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayOrder">Display Order</Label>
          <Input
            id="displayOrder"
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground">
            Lower numbers appear first (0, 1, 2, ...)
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="isPublished">Published</Label>
          <Switch
            id="isPublished"
            checked={isPublished}
            onCheckedChange={setIsPublished}
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || isUploading}>
          {isSubmitting || isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isUploading ? 'Uploading...' : 'Saving...'}
            </>
          ) : (
            <>
              {achievement ? 'Update' : 'Create'} Achievement
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default AchievementForm;
