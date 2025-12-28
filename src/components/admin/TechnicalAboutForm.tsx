import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, X, GripVertical } from 'lucide-react';
import { TechnicalAbout, TechnicalAboutStat } from '@/types/technicalAbout';

interface TechnicalAboutFormProps {
  aboutData: TechnicalAbout | null;
  onSave: (data: Partial<TechnicalAbout>) => void;
  onCancel: () => void;
}

export const TechnicalAboutForm = ({ aboutData, onSave, onCancel }: TechnicalAboutFormProps) => {
  const [sectionLabel, setSectionLabel] = useState(aboutData?.section_label || 'About');
  const [heading, setHeading] = useState(aboutData?.heading || 'Who Am I?');
  const [contentBlocks, setContentBlocks] = useState<string[]>(aboutData?.content_blocks || ['']);
  const [stats, setStats] = useState<TechnicalAboutStat[]>(
    aboutData?.stats || [{ value: '', label: '' }]
  );

  const handleAddContentBlock = () => {
    setContentBlocks([...contentBlocks, '']);
  };

  const handleRemoveContentBlock = (index: number) => {
    if (contentBlocks.length > 1) {
      setContentBlocks(contentBlocks.filter((_, i) => i !== index));
    }
  };

  const handleUpdateContentBlock = (index: number, value: string) => {
    const newBlocks = [...contentBlocks];
    newBlocks[index] = value;
    setContentBlocks(newBlocks);
  };

  const handleAddStat = () => {
    setStats([...stats, { value: '', label: '' }]);
  };

  const handleRemoveStat = (index: number) => {
    if (stats.length > 1) {
      setStats(stats.filter((_, i) => i !== index));
    }
  };

  const handleUpdateStat = (index: number, field: 'value' | 'label', value: string) => {
    const newStats = [...stats];
    newStats[index] = { ...newStats[index], [field]: value };
    setStats(newStats);
  };

  const isFormValid = () => {
    return (
      sectionLabel.trim() !== '' &&
      heading.trim() !== '' &&
      contentBlocks.filter(block => block.trim() !== '').length > 0
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      return;
    }

    // Filter out empty content blocks and stats
    const filteredBlocks = contentBlocks.filter(block => block.trim() !== '');
    const filteredStats = stats.filter(stat => stat.value.trim() !== '' && stat.label.trim() !== '');

    const data: Partial<TechnicalAbout> = {
      section_label: sectionLabel.trim(),
      heading: heading.trim(),
      content_blocks: filteredBlocks,
      stats: filteredStats,
    };

    if (aboutData?.id) {
      data.id = aboutData.id;
    }

    onSave(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg uppercase tracking-wider">
          Technical About Section
        </CardTitle>
        <CardDescription>
          Manage the About section content for the Technical Portfolio page
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section Metadata */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Section Metadata</h3>
            
            <div className="space-y-2">
              <Label htmlFor="section-label">Section Label</Label>
              <Input
                id="section-label"
                value={sectionLabel}
                onChange={(e) => setSectionLabel(e.target.value)}
                placeholder="e.g., ABOUT"
                required
              />
              <p className="text-xs text-muted-foreground">
                Small label text displayed above the heading
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="heading">Main Heading</Label>
              <Input
                id="heading"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                placeholder="e.g., Who Am I?"
                required
              />
              <p className="text-xs text-muted-foreground">
                Main heading text for the section
              </p>
            </div>
          </div>

          {/* Content Blocks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">About Content</h3>
              <Button type="button" onClick={handleAddContentBlock} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Paragraph
              </Button>
            </div>
            
            <div className="space-y-3">
              {contentBlocks.map((block, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="pt-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`block-${index}`} className="text-xs text-muted-foreground">
                        Paragraph {index + 1}
                      </Label>
                      <Textarea
                        id={`block-${index}`}
                        value={block}
                        onChange={(e) => handleUpdateContentBlock(index, e.target.value)}
                        placeholder="Enter paragraph text..."
                        rows={3}
                        className="resize-none"
                        required={contentBlocks.length === 1}
                      />
                    </div>
                    {contentBlocks.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveContentBlock(index)}
                        className="mt-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Stats / Highlights</h3>
              <Button type="button" onClick={handleAddStat} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Stat
              </Button>
            </div>
            
            <div className="space-y-3">
              {stats.map((stat, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="pt-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor={`stat-value-${index}`} className="text-xs text-muted-foreground">
                        Value
                      </Label>
                      <Input
                        id={`stat-value-${index}`}
                        value={stat.value}
                        onChange={(e) => handleUpdateStat(index, 'value', e.target.value)}
                        placeholder="e.g., 10+"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`stat-label-${index}`} className="text-xs text-muted-foreground">
                        Label
                      </Label>
                      <Input
                        id={`stat-label-${index}`}
                        value={stat.label}
                        onChange={(e) => handleUpdateStat(index, 'label', e.target.value)}
                        placeholder="e.g., Projects Delivered"
                      />
                    </div>
                  </div>
                  {stats.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveStat(index)}
                      className="mt-6"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Add key statistics or highlights (e.g., projects delivered, happy clients)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={!isFormValid()}
            >
              Save Changes
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
