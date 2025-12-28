import { SocialLink } from '@/types/socialLinks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { GripVertical, FileText, Github, Linkedin, Twitter, Send, Upload, X, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { toast } from 'sonner';

interface SocialLinkItemProps {
  link: SocialLink;
  onUpdate: (id: string, updates: Partial<SocialLink>) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}

const SocialLinkItem = ({ link, onUpdate, onDragStart, onDragOver, onDrop, onMoveUp, onMoveDown, index, isFirst, isLast }: SocialLinkItemProps) => {
  const [uploading, setUploading] = useState(false);

  const getIcon = (linkType: string) => {
    switch (linkType) {
      case 'resume':
        return <FileText className="w-5 h-5" />;
      case 'github':
        return <Github className="w-5 h-5" />;
      case 'linkedin':
        return <Linkedin className="w-5 h-5" />;
      case 'twitter':
        return <Twitter className="w-5 h-5" />;
      case 'telegram':
        return <Send className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getLabel = (linkType: string) => {
    switch (linkType) {
      case 'resume':
        return 'Resume';
      case 'github':
        return 'GitHub';
      case 'linkedin':
        return 'LinkedIn';
      case 'twitter':
        return 'X (Twitter)';
      case 'telegram':
        return 'Telegram';
      default:
        return linkType;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (PDF only for resume)
    if (link.link_type === 'resume' && file.type !== 'application/pdf') {
      toast.error('Please select a PDF file for resume');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `resume-${Date.now()}.${fileExt}`;
      const filePath = `resume/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      onUpdate(link.id, { url: publicUrl });
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      className="flex items-start gap-4 p-4 border border-border rounded-lg bg-card hover:shadow-md transition-shadow cursor-move"
    >
      <div className="flex flex-col items-center gap-2 flex-shrink-0">
        <GripVertical className="w-5 h-5 text-muted-foreground" />
        <div className="p-2 border border-border rounded-md">
          {getIcon(link.link_type)}
        </div>
        <div className="flex flex-col gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => onMoveUp(index)}
            disabled={isFirst}
            title="Move up"
            aria-label="Move up"
          >
            <ChevronUp className="w-3 h-3" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => onMoveDown(index)}
            disabled={isLast}
            title="Move down"
            aria-label="Move down"
          >
            <ChevronDown className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">{getLabel(link.link_type)}</Label>
          <div className="flex items-center gap-2">
            <Label htmlFor={`visible-${link.id}`} className="text-sm text-muted-foreground">
              Visible
            </Label>
            <Switch
              id={`visible-${link.id}`}
              checked={link.is_visible}
              onCheckedChange={(checked) => onUpdate(link.id, { is_visible: checked })}
            />
          </div>
        </div>

        {link.link_type === 'resume' ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={link.url}
                onChange={(e) => onUpdate(link.id, { url: e.target.value })}
                placeholder="Enter resume URL or upload a PDF"
                className="flex-1"
              />
              {link.url && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onUpdate(link.id, { url: '' })}
                  title="Clear URL"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor={`resume-upload-${link.id}`} className="cursor-pointer">
                <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-md hover:bg-accent transition-colors">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">{uploading ? 'Uploading...' : 'Upload PDF'}</span>
                </div>
              </Label>
              <Input
                id={`resume-upload-${link.id}`}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </div>
          </div>
        ) : (
          <Input
            type="url"
            value={link.url}
            onChange={(e) => onUpdate(link.id, { url: e.target.value })}
            placeholder={`Enter ${getLabel(link.link_type)} profile URL`}
          />
        )}
      </div>
    </div>
  );
};

export default SocialLinkItem;
