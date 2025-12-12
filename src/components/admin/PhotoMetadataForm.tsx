import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';

export interface PhotoMetadata {
  caption?: string;
  photographer_name?: string;
  date_taken?: string;
  device_used?: string;
  year?: number;
  tags?: string[];
  credits?: string;
  camera_lens?: string;
  project_visibility?: string;
  external_links?: Array<{ title: string; url: string }>;
}

interface PhotoMetadataFormProps {
  metadata: PhotoMetadata;
  onMetadataChange: (metadata: PhotoMetadata) => void;
}

export default function PhotoMetadataForm({ metadata, onMetadataChange }: PhotoMetadataFormProps) {
  const handleChange = (field: keyof PhotoMetadata, value: string | number | string[] | Array<{ title: string; url: string }>) => {
    onMetadataChange({
      ...metadata,
      [field]: value || undefined,
    });
  };

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    handleChange('tags', tags.length > 0 ? tags : undefined);
  };

  const addExternalLink = () => {
    const links = metadata.external_links || [];
    handleChange('external_links', [...links, { title: '', url: '' }]);
  };

  const updateExternalLink = (index: number, field: 'title' | 'url', value: string) => {
    const links = [...(metadata.external_links || [])];
    links[index] = { ...links[index], [field]: value };
    handleChange('external_links', links);
  };

  const removeExternalLink = (index: number) => {
    const links = [...(metadata.external_links || [])];
    links.splice(index, 1);
    handleChange('external_links', links.length > 0 ? links : undefined);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-secondary/20">
      <h3 className="text-sm font-semibold">Image Metadata (Optional)</h3>
      
      <div className="space-y-2">
        <Label htmlFor="caption" className="text-xs">Caption/Description</Label>
        <Textarea
          id="caption"
          placeholder="Enter a descriptive caption..."
          value={metadata.caption || ''}
          onChange={(e) => handleChange('caption', e.target.value)}
          className="text-sm min-h-[60px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="photographer_name" className="text-xs">Photographer Name</Label>
          <Input
            id="photographer_name"
            type="text"
            placeholder="Photographer's name"
            value={metadata.photographer_name || ''}
            onChange={(e) => handleChange('photographer_name', e.target.value)}
            className="text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="year" className="text-xs">Year</Label>
          <Input
            id="year"
            type="number"
            placeholder="e.g., 2024"
            value={metadata.year || ''}
            onChange={(e) => handleChange('year', e.target.value ? parseInt(e.target.value, 10) : undefined)}
            className="text-sm"
            min="1900"
            max="2100"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date_taken" className="text-xs">Date Taken</Label>
        <Input
          id="date_taken"
          type="date"
          value={metadata.date_taken || ''}
          onChange={(e) => handleChange('date_taken', e.target.value)}
          className="text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="device_used" className="text-xs">Device Used</Label>
          <Input
            id="device_used"
            type="text"
            placeholder="e.g., iPhone 15 Pro"
            value={metadata.device_used || ''}
            onChange={(e) => handleChange('device_used', e.target.value)}
            className="text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="camera_lens" className="text-xs">Camera/Lens</Label>
          <Input
            id="camera_lens"
            type="text"
            placeholder="e.g., Canon EOS R5 + RF 50mm"
            value={metadata.camera_lens || ''}
            onChange={(e) => handleChange('camera_lens', e.target.value)}
            className="text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="credits" className="text-xs">Credits (Collaborators)</Label>
        <Textarea
          id="credits"
          placeholder="e.g., Model: Jane Doe, Stylist: John Smith"
          value={metadata.credits || ''}
          onChange={(e) => handleChange('credits', e.target.value)}
          className="text-sm min-h-[50px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags" className="text-xs">Tags (comma-separated)</Label>
        <Input
          id="tags"
          type="text"
          placeholder="e.g., fashion, portrait, editorial"
          value={metadata.tags?.join(', ') || ''}
          onChange={(e) => handleTagsChange(e.target.value)}
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="project_visibility" className="text-xs">Project Visibility</Label>
        <Select
          value={metadata.project_visibility || 'public'}
          onValueChange={(value) => handleChange('project_visibility', value)}
        >
          <SelectTrigger id="project_visibility" className="text-sm">
            <SelectValue placeholder="Select visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="unlisted">Unlisted</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">External Links</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addExternalLink}
            className="h-7 px-2"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Link
          </Button>
        </div>
        {metadata.external_links && metadata.external_links.length > 0 && (
          <div className="space-y-2">
            {metadata.external_links.map((link, index) => (
              <div key={index} className="flex gap-2 items-start">
                <Input
                  type="text"
                  placeholder="Link title"
                  value={link.title}
                  onChange={(e) => updateExternalLink(index, 'title', e.target.value)}
                  className="text-sm flex-1"
                />
                <Input
                  type="url"
                  placeholder="https://..."
                  value={link.url}
                  onChange={(e) => updateExternalLink(index, 'url', e.target.value)}
                  className="text-sm flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExternalLink(index)}
                  className="h-9 px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
