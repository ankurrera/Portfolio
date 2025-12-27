import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TechnicalSkill } from '@/types/technicalSkills';

export const useTechnicalSkills = () => {
  const [skills, setSkills] = useState<TechnicalSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('technical_skills')
          .select('*')
          .eq('is_visible', true)
          .order('order_index', { ascending: true });

        if (fetchError) throw fetchError;

        setSkills(data || []);
      } catch (err) {
        console.error('Error fetching technical skills:', err);
        setError(err instanceof Error ? err.message : 'Failed to load skills');
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, []);

  return { skills, loading, error };
};
