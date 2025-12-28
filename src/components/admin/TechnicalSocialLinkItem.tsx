import { SocialLink } from '@/types/socialLinks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Github, Linkedin, Twitter } from 'lucide-react';

interface TechnicalSocialLinkItemProps {
  link: SocialLink;
  onUpdate: (id: string, updates: Partial<SocialLink>) => void;
}

const TechnicalSocialLinkItem = ({ link, onUpdate }: TechnicalSocialLinkItemProps) => {
  const getIcon = (linkType: string) => {
    switch (linkType) {
      case 'github':
        return <Github className="w-5 h-5" />;
      case 'linkedin':
        return <Linkedin className="w-5 h-5" />;
      case 'twitter':
        return <Twitter className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getLabel = (linkType: string) => {
    switch (linkType) {
      case 'github':
        return 'GitHub';
      case 'linkedin':
        return 'LinkedIn';
      case 'twitter':
        return 'X (Twitter)';
      default:
        return linkType;
    }
  };

  const validateUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return true; // Empty is valid (will be hidden)
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    onUpdate(link.id, { url: newUrl });
  };

  const isUrlValid = validateUrl(link.url);

  return (
    <div className="flex items-start gap-4 p-4 border border-border rounded-lg bg-card hover:shadow-md transition-shadow">
      <div className="p-2 border border-border rounded-md flex-shrink-0">
        {getIcon(link.link_type)}
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

        <div className="space-y-2">
          <Input
            type="url"
            value={link.url}
            onChange={handleUrlChange}
            placeholder={`Enter ${getLabel(link.link_type)} profile URL`}
            className={!isUrlValid ? 'border-red-500' : ''}
          />
          {!isUrlValid && (
            <p className="text-xs text-red-500">Please enter a valid URL</p>
          )}
          {link.url && isUrlValid && (
            <p className="text-xs text-muted-foreground">
              Preview: <a href={link.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">{link.url}</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechnicalSocialLinkItem;
