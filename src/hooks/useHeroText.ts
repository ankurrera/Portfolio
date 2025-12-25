import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HeroText {
  id: string;
  page_slug: string;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_description: string | null;
  cta_text: string | null;
  cta_link: string | null;
  background_media_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useHeroText = (pageSlug: string) => {
  const [heroText, setHeroText] = useState<HeroText | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeroText = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('hero_text')
          .select('*')
          .eq('page_slug', pageSlug)
          .single();

        if (fetchError) throw fetchError;

        setHeroText(data);
      } catch (err) {
        console.error(`Error fetching hero text for ${pageSlug}:`, err);
        setError(err instanceof Error ? err.message : 'Failed to load hero content');
      } finally {
        setLoading(false);
      }
    };

    fetchHeroText();
  }, [pageSlug]);

  return { heroText, loading, error };
};
