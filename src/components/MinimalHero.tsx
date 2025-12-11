import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';

const MinimalHero = () => {
  const scrollToWork = () => {
    const element = document.querySelector('#work');
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="split-screen">
      {/* Left Side - Light */}
      <div className="split-light flex flex-col justify-center items-start p-16">
        <motion.div
          initial={{
            opacity: 0,
            x: -50
          }}
          animate={{
            opacity: 1,
            x: 0
          }}
          transition={{
            duration: 0.8,
            delay: 0.2
          }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <div className="text-xs font-mono tracking-widest text-muted-foreground uppercase font-bold">
              FULL STACK WEB DEVELOPER
            </div>
            <h1 className="text-display font-heading text-foreground mx-0 my-[27px] px-0 text-9xl font-bold">
              Ankur
            </h1>
          </div>
          
          <div className="space-y-6">
            <p className="text-muted-foreground max-w-md leading-relaxed font-normal text-base">
              Crafting digital experiences with precision, creativity, and a passion for clean code.
            </p>
            
            <div className="flex items-center gap-4">
              <Button onClick={scrollToWork} variant="minimal" className="group">
                View Work
                <motion.div
                  className="ml-2"
                  animate={{
                    x: [0, 4, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity
                  }}
                >
                  →
                </motion.div>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Dark with subtle space theme */}
      <div className="split-dark star-field flex flex-col justify-center items-end p-16">
        <motion.div
          initial={{
            opacity: 0,
            x: 50
          }}
          animate={{
            opacity: 1,
            x: 0
          }}
          transition={{
            duration: 0.8,
            delay: 0.4
          }}
          className="text-right space-y-8 max-w-md"
        >
          <div className="space-y-4">
            <h2 className="text-hero font-heading text-primary-foreground text-5xl font-bold">
              Creative
              <br />
              Solutions
            </h2>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-2xl font-bold text-primary-foreground">5+</div>
                <div className="text-xs font-mono font-bold text-primary-foreground/60 uppercase tracking-widest">
                  Years
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary-foreground">50+</div>
                <div className="text-xs font-mono font-bold text-primary-foreground/60 uppercase tracking-widest">
                  Projects
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary-foreground">15+</div>
                <div className="text-xs font-mono font-bold text-primary-foreground/60 uppercase tracking-widest">
                  Clients
                </div>
              </div>
            </div>
            
            <p className="text-sm text-primary-foreground/70 leading-relaxed font-semibold">
              Building tomorrow's technology with today's vision. 
              Specializing in modern web applications, AI integration, 
              and seamless user experiences.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.button
        onClick={scrollToWork}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 p-3 text-muted-foreground hover:text-foreground transition-colors"
        animate={{
          y: [0, 8, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity
        }}
      >
        <ArrowDown className="w-4 h-4" />
      </motion.button>
    </section>
  );
};

export default MinimalHero;
