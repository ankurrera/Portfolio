import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AboutPage } from '@/types/about';

export const useAboutPage = () => {
  const [aboutData, setAboutData] = useState<AboutPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('about_page')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" error
          throw fetchError;
        }

        if (data) {
          setAboutData(data);
        }
      } catch (err) {
        console.error('Error fetching about data:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch about data'));
      } finally {
        setLoading(false);
      }
    };

    fetchAboutData();

    // Set up real-time subscription for live updates
    const channel = supabase
      .channel('about_page_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'about_page'
        },
        () => {
          // Reload data when changes occur
          fetchAboutData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { aboutData, loading, error };
};
