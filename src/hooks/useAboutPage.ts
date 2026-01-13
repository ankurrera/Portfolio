import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AboutPage } from '@/types/about';
import { formatSupabaseError } from '@/lib/utils';

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

        if (fetchError) {
          // PGRST116 is "no rows returned" error - this is expected when table is empty
          if (fetchError.code === 'PGRST116') {
            console.log('[useAboutPage] No about data found in database');
            setAboutData(null);
            return;
          }
          // Log detailed error for debugging
          const errorMessage = formatSupabaseError(fetchError);
          console.error('[useAboutPage] Error fetching about data:', errorMessage);
          throw new Error(errorMessage);
        }

        // Defensive check: validate data structure before setting state
        if (data && typeof data === 'object' && 'id' in data) {
          setAboutData(data as AboutPage);
        } else {
          console.warn('[useAboutPage] Received unexpected data format:', typeof data);
          setAboutData(null);
        }
      } catch (err) {
        console.error('[useAboutPage] Error loading about data:', err);
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
