import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export interface PhotoMetadata {
  caption?: string;
  photographer_name?: string;
  date_taken?: string;
  device_used?: string;
}

interface PhotoMetadataFormProps {
  metadata: PhotoMetadata;
  onMetadataChange: (metadata: PhotoMetadata) => void;
}

export default function PhotoMetadataForm({ metadata, onMetadataChange }: PhotoMetadataFormProps) {
  const handleChange = (field: keyof PhotoMetadata, value: string) => {
    onMetadataChange({
      ...metadata,
      [field]: value || undefined,
    });
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

      <div className="space-y-2">
        <Label htmlFor="photographer_name" className="text-xs">Shot by (Photographer Name)</Label>
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
        <Label htmlFor="date_taken" className="text-xs">Date Taken</Label>
        <Input
          id="date_taken"
          type="date"
          value={metadata.date_taken || ''}
          onChange={(e) => handleChange('date_taken', e.target.value)}
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="device_used" className="text-xs">Device Used</Label>
        <Input
          id="device_used"
          type="text"
          placeholder="e.g., iPhone 15 Pro, Nikon D850"
          value={metadata.device_used || ''}
          onChange={(e) => handleChange('device_used', e.target.value)}
          className="text-sm"
        />
      </div>
    </div>
  );
}
