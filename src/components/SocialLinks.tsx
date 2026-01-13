import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SocialLink } from '@/types/socialLinks';
import { FileText, Github, Linkedin, Send } from 'lucide-react';
import XIcon from '@/components/icons/XIcon';

const SocialLinks = () => {
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
        .eq('page_context', 'about')
        .eq('is_visible', true)
        .order('display_order', { ascending: true });

      if (error) {
        // If page_context column doesn't exist, fall back to querying without it
        if (error.code === '42703') {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('social_links')
            .select('*')
            .eq('is_visible', true)
            .order('display_order', { ascending: true });

          if (fallbackError) throw fallbackError;
          // Filter out links with empty URLs
          const validLinks = (fallbackData || []).filter(link => link.url && link.url.trim() !== '');
          setLinks(validLinks);
          return;
        }
        throw error;
      }
      // Filter out links with empty URLs
      const validLinks = (data || []).filter(link => link.url && link.url.trim() !== '');
      setLinks(validLinks);
    } catch (error) {
      console.error('Error loading social links:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackResumeDownload = async () => {
    try {
      // Track download in background (non-blocking)
      const logData = {
        user_agent: navigator.userAgent,
        referrer: 'about',
      };

      // Fire and forget - don't wait for response
      // Using void to explicitly indicate intentional discard
      void supabase.from('resume_download_logs').insert(logData).then(({ error }) => {
        if (error) {
          console.error('Error tracking resume download:', error);
        }
      });
    } catch (error) {
      console.error('Error tracking resume download:', error);
    }
  };

  const handleLinkClick = (link: SocialLink) => {
    // Track resume downloads specifically
    if (link.link_type === 'resume') {
      trackResumeDownload();
    }
  };

  const getIcon = (linkType: string) => {
    switch (linkType) {
      case 'resume':
        return <FileText className="w-5 h-5" />;
      case 'github':
        return <Github className="w-5 h-5" />;
      case 'linkedin':
        return <Linkedin className="w-5 h-5" />;
      case 'twitter':
        return <XIcon className="w-5 h-5" />;
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

  if (loading || links.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-4 mt-6">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={getLabel(link.link_type)}
          onClick={() => handleLinkClick(link)}
          className="p-3 border border-border/50 rounded-lg hover:border-border hover:bg-muted/20 transition-all"
          title={getLabel(link.link_type)}
        >
          {getIcon(link.link_type)}
        </a>
      ))}
    </div>
  );
};

export default SocialLinks;
