import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { useTechnicalSkills } from '@/hooks/useTechnicalSkills';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Experience } from '@/types/experience';
import { TechnicalAbout } from '@/types/technicalAbout';
import { Loader2 } from 'lucide-react';

const MinimalAbout = () => {
  const { skills: skillsData, loading } = useTechnicalSkills();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loadingExperiences, setLoadingExperiences] = useState(true);
  const [aboutData, setAboutData] = useState<TechnicalAbout | null>(null);
  const [loadingAbout, setLoadingAbout] = useState(true);
  
  // Transform data to match existing structure
  const skills = skillsData.map(skill => ({
    category: skill.category,
    items: skill.skills
  }));

  // Load experiences from Supabase
  useEffect(() => {
    loadExperiences();
    loadAboutData();
  }, []);

  const loadExperiences = async () => {
    try {
      const { data, error } = await supabase
        .from('technical_experience')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      setExperiences(data as Experience[]);
    } catch (error) {
      console.error('Error loading experiences:', error);
    } finally {
      setLoadingExperiences(false);
    }
  };

  const loadAboutData = async () => {
    try {
      const { data, error } = await supabase
        .from('technical_about')
        .select('*')
        .single();

      if (error) throw error;

      setAboutData(data as TechnicalAbout);
    } catch (error) {
      console.error('Error loading about data:', error);
      // Use default data if no data exists
      setAboutData({
        id: '',
        section_label: 'About',
        heading: 'Who Am I?',
        content_blocks: [
          "I'm a passionate full-stack Web developer with over 1 year of experience creating digital solutions that matter.",
          "My journey began with a curiosity about how things work. Today, I specialize in building scalable web applications, integrating AI capabilities, and crafting user experiences that feel natural and intuitive.",
          "When I'm not coding, you'll find me exploring new technologies, contributing to open source projects, or sharing knowledge with the developer community."
        ],
        stats: [
          { value: "10+", label: "Projects Delivered" },
          { value: "9+", label: "Happy Clients" }
        ]
      });
    } finally {
      setLoadingAbout(false);
    }
  };

  const formatDateDisplay = (exp: Experience) => {
    const endDate = exp.is_current ? 'Present' : (exp.end_date || '');
    return `${exp.start_date} - ${endDate}`;
  };

  return (
    <section id="about" className="py-section bg-muted/20">
      <div className="max-w-content mx-auto px-8">
        {/* Header */}
        {loadingAbout ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : aboutData && (
          <>
            <motion.div
              initial={{
                opacity: 0,
                y: 30
              }}
              whileInView={{
                opacity: 1,
                y: 0
              }}
              viewport={{
                once: true
              }}
              transition={{
                duration: 0.6
              }}
              className="mb-20"
            >
              <div className="text-xs font-mono tracking-widest text-muted-foreground uppercase mb-4">
                {aboutData.section_label}
              </div>
              <h2 className="text-section font-heading font-light text-foreground mb-8">
                {aboutData.heading}
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
              {/* Story */}
              <motion.div
                initial={{
                  opacity: 0,
                  x: -30
                }}
                whileInView={{
                  opacity: 1,
                  x: 0
                }}
                viewport={{
                  once: true
                }}
                transition={{
                  duration: 0.6
                }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  {aboutData.content_blocks.map((block, index) => (
                    <p 
                      key={index}
                      className={index === 0 ? "text-lg font-light text-foreground leading-relaxed" : "text-muted-foreground leading-relaxed"}
                    >
                      {block}
                    </p>
                  ))}
                </div>

                {/* Key Stats */}
                {aboutData.stats.length > 0 && (
                  <div className={`grid gap-8 pt-8 border-t border-border`} style={{ gridTemplateColumns: `repeat(${Math.min(aboutData.stats.length, 2)}, minmax(0, 1fr))` }}>
                    {aboutData.stats.map((stat, index) => (
                      <div key={index}>
                        <div className="text-2xl font-light text-foreground mb-1">{stat.value}</div>
                        <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                  </motion.div>

              {/* Skills */}
              <motion.div
            initial={{
              opacity: 0,
              x: 30
            }}
            whileInView={{
              opacity: 1,
              x: 0
            }}
            viewport={{
              once: true
            }}
            transition={{
              duration: 0.6,
              delay: 0.2
            }}
            className="space-y-8"
          >
            {!loading && skills.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {skills.map((skillGroup, index) => (
                <motion.div
                  key={skillGroup.category}
                  initial={{
                    opacity: 0,
                    y: 20
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0
                  }}
                  viewport={{
                    once: true
                  }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.1
                  }}
                >
                  <Card className="minimal-card bg-card/50 hover:bg-card transition-all duration-300">
                    <CardContent className="p-6 space-y-4">
                      <h4 className="text-sm font-medium text-foreground">
                        {skillGroup.category}
                      </h4>
                      <div className="space-y-2">
                        {skillGroup.items.map((item) => (
                          <div key={item} className="text-xs font-mono text-muted-foreground py-1">
                            {item}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            )}

            {/* Experience Timeline */}
            <div className="space-y-6 pt-8">
              <h4 className="text-sm font-medium text-foreground">Experience</h4>
              {loadingExperiences ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : experiences.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4">
                  No experience entries yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {experiences.map((exp, index) => (
                    <motion.div
                      key={exp.id}
                      initial={{
                        opacity: 0,
                        x: 20
                      }}
                      whileInView={{
                        opacity: 1,
                        x: 0
                      }}
                      viewport={{
                        once: true
                      }}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.1
                      }}
                      className="flex justify-between items-start py-3 border-b border-border/50 last:border-0"
                    >
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {exp.role_title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {exp.company_name}
                        </div>
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">
                        {formatDateDisplay(exp)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
        </>
        )}
      </div>
    </section>
  );
};

export default MinimalAbout;
