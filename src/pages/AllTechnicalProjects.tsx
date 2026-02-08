import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Loader2, Github, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { TechnicalProject } from '@/types/technical';
import { cn } from '@/lib/utils';
import { getStatusBadgeColor } from '@/lib/projectUtils';
import { useNavigate } from 'react-router-dom';
import PortfolioHeader from '@/components/PortfolioHeader';
import PortfolioFooter from '@/components/PortfolioFooter';
import PageLayout from '@/components/PageLayout';

const AllTechnicalProjects = () => {
  const [projects, setProjects] = useState<TechnicalProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
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
      const parsedProjects = data.map(project => {
        let languages: string[] = [];
        try {
          if (Array.isArray(project.languages)) {
            languages = project.languages;
          } else if (project.languages && typeof project.languages === 'string') {
            languages = JSON.parse(project.languages);
          }
        } catch (error) {
          console.error('Error parsing languages for project:', project.id, error);
          languages = [];
        }
        return {
          ...project,
          languages
        };
      }) as TechnicalProject[];

      setProjects(parsedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <PageLayout hasSidebar>
        <PortfolioHeader activeCategory="TECHNICAL" />
        <main className="flex-1 min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <PortfolioFooter />
      </PageLayout>
    );
  }

  return (
    <PageLayout hasSidebar>
      <PortfolioHeader activeCategory="TECHNICAL" />
      
      <main className="flex-1 min-h-screen transition-colors duration-500 w-full bg-background">
        <div className="min-h-screen flex flex-col items-center justify-start p-8 pt-24 w-full">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-4xl mb-12"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/technical')}
              className="mb-8 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Technical
            </Button>

            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-12 bg-foreground/20 dark:bg-foreground/10" />
              <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-muted-foreground">
                Portfolio
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-light text-foreground mb-4 tracking-tight">
              All Technical Projects
            </h1>
            
            <p className="text-muted-foreground text-lg">
              Explore my complete collection of technical projects, ordered by priority and impact.
            </p>
          </motion.div>

          {/* Projects List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-4xl"
          >
            {projects.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                No projects available yet.
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {projects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="group relative"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div
                      className={cn(
                        "relative py-6 px-6 -mx-4 cursor-pointer",
                        "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                        "rounded-lg",
                        hoveredIndex === index ? "bg-foreground/[0.03] dark:bg-foreground/[0.05]" : "bg-transparent",
                      )}
                    >
                      {/* Grid layout for consistent alignment */}
                      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 md:gap-6 items-start">
                        {/* Rank indicator */}
                        <div className="hidden md:flex items-start gap-3 pt-1">
                          <div
                            className={cn(
                              "h-5 w-0.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                              hoveredIndex === index ? "bg-accent scale-y-100 opacity-100" : "bg-border scale-y-50 opacity-0",
                            )}
                          />
                          <span className="text-xs font-mono text-muted-foreground/60 tabular-nums min-w-[2ch]">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>

                        {/* Project content - center column */}
                        <div className="flex-1 min-w-0">
                          {/* Mobile rank and title */}
                          <div className="flex items-start gap-3 mb-2 md:mb-0">
                            <span className="md:hidden text-xs font-mono text-muted-foreground/60 tabular-nums pt-1">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <div className="flex-1">
                              <h3
                                className={cn(
                                  "text-lg md:text-xl font-medium tracking-tight transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] mb-2",
                                  hoveredIndex === index ? "text-foreground" : "text-muted-foreground",
                                )}
                              >
                                {project.title}
                              </h3>

                              {/* Project description */}
                              <p
                                className={cn(
                                  "text-sm text-muted-foreground/80 mb-3 line-clamp-2 transition-all duration-500",
                                  hoveredIndex === index && "text-muted-foreground"
                                )}
                              >
                                {project.description}
                              </p>

                              {/* Technologies */}
                              <div className="flex flex-wrap gap-2 mb-3">
                                {project.languages.slice(0, 5).map((tech) => (
                                  <span
                                    key={tech}
                                    className="text-[10px] font-mono text-muted-foreground/60 px-2 py-1 bg-muted/30 rounded-md border border-border/50"
                                  >
                                    {tech}
                                  </span>
                                ))}
                                {project.languages.length > 5 && (
                                  <span className="text-[10px] font-mono text-muted-foreground/60 px-2 py-1">
                                    +{project.languages.length - 5} more
                                  </span>
                                )}
                              </div>

                              {/* Status and Year */}
                              <div className="flex gap-2">
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground border border-border rounded-full px-2 py-0.5">
                                  <span className={`w-1 h-1 rounded-full ${getStatusBadgeColor(project.status)}`} />
                                  {project.status || 'Live'}
                                </span>
                                <span className="inline-flex items-center gap-2 text-[10px] font-mono text-muted-foreground border border-border rounded-full px-2 py-0.5">
                                  {project.dev_year}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action column - fixed width for alignment */}
                        <div className="flex items-center gap-3 md:min-w-[200px] justify-end">
                          {/* Progress bar with percentage */}
                          <div className="flex items-center gap-2 flex-1 md:flex-initial">
                            <div
                              className={cn(
                                "relative w-full md:w-24 h-1.5 rounded-full overflow-hidden bg-border/50 dark:bg-border/30",
                              )}
                            >
                              {/* Background track */}
                              <div className="absolute inset-0 bg-muted/50 dark:bg-muted/20" />

                              {/* Animated progress fill */}
                              <div
                                className={cn(
                                  "absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                                  project.status?.toLowerCase() === 'paused'
                                    ? "bg-gradient-to-r from-destructive/80 to-destructive"
                                    : "bg-gradient-to-r from-accent/80 to-accent",
                                )}
                                style={{
                                  width: hoveredIndex === index ? `${project.progress || 0}%` : "0%",
                                  transitionDelay: hoveredIndex === index ? "100ms" : "0ms",
                                }}
                              />

                              {/* Shine effect on hover */}
                              <div
                                className={cn(
                                  "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent",
                                  "transition-transform duration-700 ease-out",
                                  hoveredIndex === index ? "translate-x-full" : "-translate-x-full",
                                )}
                                style={{
                                  transitionDelay: hoveredIndex === index ? "300ms" : "0ms",
                                }}
                              />
                            </div>
                            
                            {/* Animated percentage reveal */}
                            <div className="relative w-10 overflow-hidden">
                              <span
                                className={cn(
                                  "block text-[10px] font-mono text-right tabular-nums min-w-[3ch]",
                                  "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                                  hoveredIndex === index
                                    ? "text-muted-foreground opacity-100 translate-y-0 blur-0"
                                    : "text-muted-foreground/60 opacity-0 translate-y-2 blur-sm",
                                )}
                                style={{
                                  transitionDelay: hoveredIndex === index ? "200ms" : "0ms",
                                }}
                              >
                                {project.progress || 0}%
                              </span>
                            </div>
                          </div>

                          {/* Action icons */}
                          <div className="flex gap-2">
                            {project.github_link && (
                              <a
                                href={project.github_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:border-foreground/50 hover:bg-muted/30 transition-all"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Github className="w-4 h-4" />
                              </a>
                            )}
                            {project.live_link && (
                              <a
                                href={project.live_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:border-foreground/50 hover:bg-muted/30 transition-all"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {index < projects.length - 1 && (
                      <div
                        className={cn(
                          "mx-4 h-px transition-all duration-500",
                          hoveredIndex === index || hoveredIndex === index + 1
                            ? "bg-transparent"
                            : "bg-border/30 dark:bg-border/20",
                        )}
                      />
                    )}
                  </motion.div>
                ))}
              </div>
            )}


          </motion.div>
        </div>
      </main>

      <PortfolioFooter />
    </PageLayout>
  );
};

export default AllTechnicalProjects;
