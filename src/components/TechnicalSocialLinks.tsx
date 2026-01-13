import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SocialLink, TECHNICAL_LINK_TYPES } from '@/types/socialLinks';
import { Github, Linkedin } from 'lucide-react';
import XIcon from '@/components/icons/XIcon';

const TechnicalSocialLinks = () => {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSocialLinks();
  }, []);

  const loadSocialLinks = async () => {
    try {
      // First try with page_context filter (for databases with the migration applied)
      const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .eq('page_context', 'technical')
        .eq('is_visible', true)
        .order('display_order', { ascending: true });

      if (error) {
        // If page_context column doesn't exist, fall back to querying without it
        // Only show github, linkedin, twitter for technical page
        if (error.code === '42703') {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('social_links')
            .select('*')
            .eq('is_visible', true)
            .order('display_order', { ascending: true });

          if (fallbackError) throw fallbackError;
          // Filter to only technical link types and non-empty URLs
          const validLinks = (fallbackData || []).filter(
            link => link.url && link.url.trim() !== '' && TECHNICAL_LINK_TYPES.includes(link.link_type)
          );
          setLinks(validLinks);
          return;
        }
        throw error;
      }
      // Filter out links with empty URLs
      const validLinks = (data || []).filter(link => link.url && link.url.trim() !== '');
      setLinks(validLinks);
    } catch (error) {
      console.error('Error loading technical social links:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (linkType: string) => {
    switch (linkType) {
      case 'github':
        return <Github className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />;
      case 'linkedin':
        return <Linkedin className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />;
      case 'twitter':
        return <XIcon className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />;
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

  if (loading || links.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-4">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={getLabel(link.link_type)}
          className="p-3 rounded-lg border border-border/50 hover:border-border hover:bg-muted/20 transition-all"
        >
          {getIcon(link.link_type)}
        </a>
      ))}
    </div>
  );
};

export default TechnicalSocialLinks;
