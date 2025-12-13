import { useState, useEffect, useRef } from "react";
import PortfolioHeader from "@/components/PortfolioHeader";
import PortfolioFooter from "@/components/PortfolioFooter";
import PageLayout from "@/components/PageLayout";
import SEO from "@/components/SEO";
import { AnimatedFolder } from "@/components/ui/3d-folder";
import { supabase } from "@/integrations/supabase/client";
import { AchievementData, groupAchievementsByCategory } from "@/types/achievement";
import { Loader2 } from "lucide-react";

const Achievement = () => {
  const [achievementFolders, setAchievementFolders] = useState<ReturnType<typeof groupAchievementsByCategory>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const loadAchievements = async () => {
      // Cancel any in-flight requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller with timeout
      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(() => {
        abortControllerRef.current?.abort();
      }, 8000); // 8 second timeout

      try {
        setLoading(true);
        setError(null);
        
        console.info('[Achievement] Fetching achievements');
        
        // Fetch from achievements table
        const { data, error: fetchError } = await supabase
          .from('achievements')
          .select('*')
          .eq('is_published', true)
          .order('display_order', { ascending: true })
          .abortSignal(abortControllerRef.current.signal);

        clearTimeout(timeoutId);

        if (fetchError) throw fetchError;

        console.info(`[Achievement] Successfully fetched ${data?.length || 0} achievements`);

        // Group achievements by category
        const folders = groupAchievementsByCategory(data as AchievementData[] || []);
        setAchievementFolders(folders);
      } catch (err: unknown) {
        clearTimeout(timeoutId);

        // Don't show error if request was aborted intentionally
        if (err instanceof Error && (err.name === 'AbortError' || abortControllerRef.current?.signal.aborted)) {
          console.warn('[Achievement] Request aborted (timeout or navigation)');
          setError('Request timed out. Please check your network connection.');
        } else {
          console.error('[Achievement] Failed to fetch achievements:', err);
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
          setError(`Failed to load achievements: ${errorMessage}`);
        }
      } finally {
        setLoading(false);
      }
    };

    loadAchievements();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <PageLayout>
      <SEO 
        title="Achievement | Raya"
        description="Awards, recognitions, and notable achievements across various categories including school, college, national competitions, online courses, and extra-curricular activities."
        canonicalUrl="/achievement"
      />
      <PortfolioHeader activeCategory="ACHIEVEMENT" />
      <main id="main-content" className="min-h-screen pt-24 px-4 md:px-8 pb-16">
        <div className="max-w-[1400px] mx-auto">
          <h1 className="text-3xl md:text-4xl font-light tracking-wide mb-4 text-center">
            Achievements
          </h1>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Explore achievements across different categories. Hover over each folder to preview certificates.
          </p>
          
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <p className="text-destructive mb-4">{error}</p>
              <p className="text-sm text-muted-foreground">
                Please try refreshing the page or contact support if the problem persists.
              </p>
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 items-start justify-items-center">
              {achievementFolders.map((folder) => (
                <AnimatedFolder 
                  key={folder.title} 
                  title={folder.title} 
                  projects={folder.projects}
                  className="w-full max-w-[320px]"
                />
              ))}
            </div>
          )}

          {!loading && !error && achievementFolders.every(f => f.projects.length === 0) && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No achievements published yet.</p>
            </div>
          )}
        </div>
      </main>
      <PortfolioFooter />
    </PageLayout>
  );
};

export default Achievement;
