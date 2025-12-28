import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SocialLink } from '@/types/socialLinks';
import { FileText, Github, Linkedin, Twitter, Send } from 'lucide-react';
import { toast } from 'sonner';

const SocialLinks = () => {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSocialLinks();
  }, []);

  const loadSocialLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .eq('is_visible', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setLinks(data || []);
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
      supabase.from('resume_download_logs').insert(logData).then(({ error }) => {
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
          className="p-3 border border-foreground/20 rounded-full hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-300 hover:scale-110"
          title={getLabel(link.link_type)}
        >
          {getIcon(link.link_type)}
        </a>
      ))}
    </div>
  );
};

export default SocialLinks;
