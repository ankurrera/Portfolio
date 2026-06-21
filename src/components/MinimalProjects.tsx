import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { MHSkeleton } from '@/components/MHSkeleton';
import { ProjectShowcase } from '@/components/ui/project-showcase';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { TechnicalProject } from '@/types/technical';

const MinimalProjects = () => {
  const [projects, setProjects] = useState<TechnicalProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('technical_projects')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Parse languages from JSONB
      const parsedProjects = data.map(project => ({
        ...project,
        languages: Array.isArray(project.languages) 
          ? project.languages 
          : JSON.parse(project.languages as string)
      })) as TechnicalProject[];

      setProjects(parsedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section id="work" className="py-section bg-background">
        <div className="max-w-content mx-auto px-8">
          <div className="mb-12">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="text-xs font-mono tracking-widest text-muted-foreground uppercase mb-4">
                  Selected Work
                </div>
                <h2 className="text-section font-heading font-light text-foreground">
                  Recent Projects
                </h2>
              </div>
              <Button variant="minimal" size="sm" disabled>
                All Projects
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-4">
                <MHSkeleton variant="rect" className="aspect-video w-full rounded-lg" />
                <div className="space-y-2">
                  <MHSkeleton variant="text" className="h-6 w-1/3" />
                  <MHSkeleton variant="text" className="h-4 w-full" />
                  <MHSkeleton variant="text" className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (projects.length === 0) {
    return (
      <section id="work" className="py-section bg-background">
        <div className="max-w-content mx-auto px-8">
          <div className="text-center py-20 text-muted-foreground">
            No projects available yet.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="work" className="py-section bg-background">
      <div className="max-w-content mx-auto px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="text-xs font-mono tracking-widest text-muted-foreground uppercase mb-4">
                Selected Work
              </div>
              <h2 className="text-section font-heading font-light text-foreground">
                Recent Projects
              </h2>
            </div>
            <Button variant="minimal" size="sm" onClick={() => navigate('/technical/projects')}>
              All Projects
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </motion.div>

        {/* Animated Project Showcase */}
        <ProjectShowcase projects={projects} />
      </div>
    </section>
  );
};

export default MinimalProjects;
