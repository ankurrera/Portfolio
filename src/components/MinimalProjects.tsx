import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { TechnicalProject } from '@/types/technical';
import { ProjectShowcase } from '@/components/ui/project-showcase';
import { useNavigate } from 'react-router-dom';

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
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

        {/* CTA - Completely isolated from animated layout flow 
            - No motion.div wrapper (removes Framer Motion layout recalculation)
            - Fixed min-height container prevents any height changes
            - CSS containment ensures this section never reflows during project animations
            - Position: relative with explicit positioning prevents inherited transforms
        */}
        <div 
          className="relative isolate mt-20" 
          style={{ 
            contain: 'strict',
            minHeight: '120px'
          }}
        >
          <div 
            className="text-center"
            style={{ 
              position: 'relative',
              transform: 'none',
              willChange: 'auto'
            }}
          >
            <p className="text-muted-foreground mb-6">
              Interested in working together?
            </p>
            <Button 
              variant="default" 
              size="lg"
              onClick={() => {
                const element = document.querySelector('#contact');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Start a Project
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MinimalProjects;
