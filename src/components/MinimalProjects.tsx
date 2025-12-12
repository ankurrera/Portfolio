import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Github, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { TechnicalProject } from '@/types/technical';

const MinimalProjects = () => {
  const [projects, setProjects] = useState<TechnicalProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
          className="mb-20"
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
            <Button variant="minimal" size="sm">
              All Projects
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </motion.div>

        {/* Projects Grid */}
        <div className="space-y-24">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <Card className="minimal-card border-0 shadow-none bg-transparent hover:bg-card/50 transition-all duration-500">
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center py-12 border-b border-border/50">
                    {/* Project Number */}
                    <div className="order-1 lg:order-1">
                      <div className="text-6xl font-heading font-light text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                    </div>

                    {/* Project Info */}
                    <div className="order-3 lg:order-2 space-y-4">
                      <div>
                        <h3 className="text-xl font-heading font-medium text-foreground mb-2 group-hover:text-primary transition-colors">
                          {project.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {project.description}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {project.languages.map((tech) => (
                          <span 
                            key={tech} 
                            className="text-xs font-mono text-muted-foreground/60 px-2 py-1 bg-muted/30 rounded"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Project Meta */}
                    <div className="order-2 lg:order-3 flex lg:flex-col items-start lg:items-end justify-between lg:justify-start gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground mb-1">
                          {project.dev_year}
                        </div>
                        <div className={`text-xs font-mono uppercase tracking-widest ${
                          project.status === 'Live' ? 'text-success' : 'text-warning'
                        }`}>
                          {project.status || 'Live'}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {project.live_link && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-muted/50"
                            asChild
                          >
                            <a href={project.live_link} target="_blank" rel="noopener noreferrer">
                              <ArrowUpRight className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        {project.github_link && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-muted/50"
                            asChild
                          >
                            <a href={project.github_link} target="_blank" rel="noopener noreferrer">
                              <Github className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-20"
        >
          <p className="text-muted-foreground mb-6">
            Interested in working together?
          </p>
          <Button variant="default" size="lg">
            Start a Project
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default MinimalProjects;
