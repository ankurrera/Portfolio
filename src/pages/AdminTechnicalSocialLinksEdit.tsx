import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ChevronLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SocialLink, TECHNICAL_LINK_TYPES } from '@/types/socialLinks';
import { Button } from '@/components/ui/button';
import TechnicalSocialLinkItem from '@/components/admin/TechnicalSocialLinkItem';

const AdminTechnicalSocialLinksEdit = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Auth redirect effect
  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      navigate('/admin/login', { replace: true });
      return;
    }
    
    if (!isAdmin) {
      toast.error('You do not have admin access');
      signOut();
      navigate('/admin/login', { replace: true });
    }
  }, [user, isAdmin, isLoading, navigate, signOut]);

  // Load social links data
  useEffect(() => {
    if (!user || !isAdmin) return;
    
    loadSocialLinks();
  }, [user, isAdmin]);

  const loadSocialLinks = async () => {
    try {
      // First try with page_context filter (for databases with the migration applied)
      const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .eq('page_context', 'technical')
        .order('display_order', { ascending: true });

      if (error) {
        // If page_context column doesn't exist, fall back to querying without it
        // Filter to only show technical link types
        if (error.code === '42703') {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('social_links')
            .select('*')
            .order('display_order', { ascending: true });

          if (fallbackError) throw fallbackError;
          // Filter to only technical link types
          const filteredData = (fallbackData || []).filter(
            link => TECHNICAL_LINK_TYPES.includes(link.link_type)
          );
          setSocialLinks(filteredData as SocialLink[]);
          return;
        }
        throw error;
      }

      setSocialLinks(data as SocialLink[]);
    } catch (error) {
      console.error('Error loading social links:', error);
      toast.error('Failed to load social links data');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleUpdate = (id: string, updates: Partial<SocialLink>) => {
    setSocialLinks(links =>
      links.map(link =>
        link.id === id ? { ...link, ...updates } : link
      )
    );
  };

  const validateUrls = (): boolean => {
    for (const link of socialLinks) {
      if (link.url && link.url.trim() !== '') {
        try {
          new URL(link.url);
        } catch {
          toast.error(`Invalid URL for ${link.link_type}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateUrls()) {
      return;
    }

    setIsSaving(true);
    try {
      // Use Promise.all for parallel updates to improve performance
      const updatePromises = socialLinks.map(link => 
        supabase
          .from('social_links')
          .update({
            url: link.url,
            is_visible: link.is_visible,
            display_order: link.display_order
          })
          .eq('id', link.id)
      );

      const results = await Promise.all(updatePromises);
      
      // Check if any update failed
      const failedUpdate = results.find(result => result.error);
      if (failedUpdate?.error) {
        throw failedUpdate.error;
      }

      toast.success('Social links updated successfully');
    } catch (error) {
      console.error('Error saving social links:', error);
      toast.error('Failed to save social links');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-[1400px]">
          <div className="flex items-center gap-2">
            <Link to="/admin/dashboard">
              <Button variant="ghost" size="sm" className="h-8">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-base font-semibold uppercase tracking-wider">
              Technical Page - Social Links
            </h1>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            size="sm"
            className="h-8"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-[900px]">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Manage Social Links</h2>
            <p className="text-sm text-muted-foreground">
              Configure the social profile links displayed on the Technical page contact section. 
              Links will only appear if they are enabled and have a valid URL.
            </p>
          </div>

          <div className="space-y-4">
            {socialLinks.map((link) => (
              <TechnicalSocialLinkItem
                key={link.id}
                link={link}
                onUpdate={handleUpdate}
              />
            ))}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Changes will be reflected on the Technical page immediately after saving.
            </div>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTechnicalSocialLinksEdit;
