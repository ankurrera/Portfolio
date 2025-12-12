import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArtworkMetadata, 
  DimensionPreset, 
  DimensionUnit,
  DEFAULT_ARTWORK_TAGS,
  PENCIL_GRADES,
  CHARCOAL_TYPES
} from '@/types/artwork';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ArtworkMetadataFormProps {
  metadata: ArtworkMetadata;
  onChange: (metadata: ArtworkMetadata) => void;
  errors?: Record<string, string>;
}

export default function ArtworkMetadataForm({ metadata, onChange, errors = {} }: ArtworkMetadataFormProps) {
  const [customTagInput, setCustomTagInput] = useState('');
  const [showCustomDimensions, setShowCustomDimensions] = useState(
    metadata.dimension_preset === 'Custom'
  );

  useEffect(() => {
    setShowCustomDimensions(metadata.dimension_preset === 'Custom');
  }, [metadata.dimension_preset]);

  const handleDimensionPresetChange = (value: DimensionPreset) => {
    onChange({
      ...metadata,
      dimension_preset: value,
      ...(value !== 'Custom' && {
        custom_width: undefined,
        custom_height: undefined,
      }),
    });
  };

  const handlePencilGradeToggle = (grade: string, checked: boolean) => {
    const currentGrades = metadata.pencil_grades || [];
    const newGrades = checked
      ? [...currentGrades, grade]
      : currentGrades.filter(g => g !== grade);
    onChange({ ...metadata, pencil_grades: newGrades });
  };

  const handleCharcoalTypeToggle = (type: string, checked: boolean) => {
    const currentTypes = metadata.charcoal_types || [];
    const newTypes = checked
      ? [...currentTypes, type]
      : currentTypes.filter(t => t !== type);
    onChange({ ...metadata, charcoal_types: newTypes });
  };

  const handleTagToggle = (tag: string, checked: boolean) => {
    const currentTags = metadata.tags || [];
    const newTags = checked
      ? [...currentTags, tag]
      : currentTags.filter(t => t !== tag);
    onChange({ ...metadata, tags: newTags });
  };

  const handleAddCustomTag = () => {
    if (!customTagInput.trim()) return;
    const currentTags = metadata.tags || [];
    if (!currentTags.includes(customTagInput.trim())) {
      onChange({ ...metadata, tags: [...currentTags, customTagInput.trim()] });
    }
    setCustomTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    const currentTags = metadata.tags || [];
    onChange({ ...metadata, tags: currentTags.filter(t => t !== tag) });
  };

  return (
    <div className="space-y-6">
      {/* Artwork Title */}
      <div>
        <Label htmlFor="title" className="text-sm font-medium">
          Artwork Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          value={metadata.title || ''}
          onChange={(e) => onChange({ ...metadata, title: e.target.value })}
          placeholder="Enter artwork title"
          className="mt-1.5"
        />
        {errors.title && (
          <p className="text-xs text-destructive mt-1">{errors.title}</p>
        )}
      </div>

      {/* Creation Date */}
      <div>
        <Label htmlFor="creation_date" className="text-sm font-medium">
          Creation Date
        </Label>
        <Input
          id="creation_date"
          type="date"
          value={metadata.creation_date || ''}
          onChange={(e) => onChange({ ...metadata, creation_date: e.target.value })}
          className="mt-1.5"
        />
      </div>

      {/* Dimensions */}
      <div>
        <Label className="text-sm font-medium">Dimensions</Label>
        <div className="mt-1.5 space-y-3">
          <Select
            value={metadata.dimension_preset || ''}
            onValueChange={(value) => handleDimensionPresetChange(value as DimensionPreset)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select dimension preset" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A4">A4 (21 × 29.7 cm)</SelectItem>
              <SelectItem value="A3">A3 (29.7 × 42 cm)</SelectItem>
              <SelectItem value="Custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          {showCustomDimensions && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="custom_width" className="text-xs">Width</Label>
                <Input
                  id="custom_width"
                  type="number"
                  step="0.1"
                  value={metadata.custom_width || ''}
                  onChange={(e) => onChange({ 
                    ...metadata, 
                    custom_width: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  placeholder="Width"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="custom_height" className="text-xs">Height</Label>
                <Input
                  id="custom_height"
                  type="number"
                  step="0.1"
                  value={metadata.custom_height || ''}
                  onChange={(e) => onChange({ 
                    ...metadata, 
                    custom_height: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  placeholder="Height"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dimension_unit" className="text-xs">Unit</Label>
                <Select
                  value={metadata.dimension_unit || 'cm'}
                  onValueChange={(value) => onChange({ 
                    ...metadata, 
                    dimension_unit: value as DimensionUnit 
                  })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="in">in</SelectItem>
                    <SelectItem value="mm">mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description / Concept */}
      <div>
        <Label htmlFor="description" className="text-sm font-medium">
          Description / Concept
        </Label>
        <Textarea
          id="description"
          value={metadata.description || ''}
          onChange={(e) => onChange({ ...metadata, description: e.target.value })}
          placeholder="Describe the artwork concept (2-3 lines recommended)"
          rows={3}
          className="mt-1.5"
        />
        {errors.description && (
          <p className="text-xs text-destructive mt-1">{errors.description}</p>
        )}
      </div>

      {/* Materials Used - Pencil Grades */}
      <div>
        <Label className="text-sm font-medium">Pencil Grades</Label>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {PENCIL_GRADES.map((grade) => (
            <label key={grade} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={(metadata.pencil_grades || []).includes(grade)}
                onCheckedChange={(checked) => handlePencilGradeToggle(grade, checked as boolean)}
              />
              <span className="text-xs">{grade}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Materials Used - Charcoal Types */}
      <div>
        <Label className="text-sm font-medium">Charcoal Types</Label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {CHARCOAL_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={(metadata.charcoal_types || []).includes(type)}
                onCheckedChange={(checked) => handleCharcoalTypeToggle(type, checked as boolean)}
              />
              <span className="text-xs">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Paper Type */}
      <div>
        <Label htmlFor="paper_type" className="text-sm font-medium">
          Paper Type
        </Label>
        <Input
          id="paper_type"
          value={metadata.paper_type || ''}
          onChange={(e) => onChange({ ...metadata, paper_type: e.target.value })}
          placeholder="e.g., Canson Bristol, Strathmore 400"
          className="mt-1.5"
        />
      </div>

      {/* Time Taken */}
      <div>
        <Label htmlFor="time_taken" className="text-sm font-medium">
          Time Taken to Complete
        </Label>
        <Input
          id="time_taken"
          value={metadata.time_taken || ''}
          onChange={(e) => onChange({ ...metadata, time_taken: e.target.value })}
          placeholder="e.g., 3 hours, 2 days, 1 week"
          className="mt-1.5"
        />
      </div>

      {/* Category / Collection Tags */}
      <div>
        <Label className="text-sm font-medium">Category / Collection Tags</Label>
        <div className="mt-2 space-y-3">
          {/* Default tags */}
          <div className="grid grid-cols-2 gap-2">
            {DEFAULT_ARTWORK_TAGS.map((tag) => (
              <label key={tag} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={(metadata.tags || []).includes(tag)}
                  onCheckedChange={(checked) => handleTagToggle(tag, checked as boolean)}
                />
                <span className="text-xs">{tag}</span>
              </label>
            ))}
          </div>

          {/* Custom tags */}
          <div className="flex gap-2">
            <Input
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTag())}
              placeholder="Add custom tag"
              className="flex-1"
            />
            <Button type="button" onClick={handleAddCustomTag} size="sm">
              Add
            </Button>
          </div>

          {/* Display all selected tags */}
          {metadata.tags && metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {metadata.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Copyright */}
      <div>
        <Label htmlFor="copyright" className="text-sm font-medium">
          Copyright
        </Label>
        <Input
          id="copyright"
          value={metadata.copyright || '© Ankur Bag.'}
          onChange={(e) => onChange({ ...metadata, copyright: e.target.value })}
          className="mt-1.5"
        />
      </div>

      {/* External / Purchase Link */}
      <div>
        <Label htmlFor="external_link" className="text-sm font-medium">
          External / Purchase Link
        </Label>
        <Input
          id="external_link"
          type="url"
          value={metadata.external_link || ''}
          onChange={(e) => onChange({ ...metadata, external_link: e.target.value })}
          placeholder="https://..."
          className="mt-1.5"
        />
        {errors.external_link && (
          <p className="text-xs text-destructive mt-1">{errors.external_link}</p>
        )}
      </div>
    </div>
  );
}

export type { ArtworkMetadata };
