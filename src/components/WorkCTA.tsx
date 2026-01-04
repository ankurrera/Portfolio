import { Button } from '@/components/ui/button';

/**
 * WorkCTA - A dedicated, static CTA section that sits after the Selected Work section.
 * 
 * This component is intentionally isolated from the ProjectShowcase animations to prevent
 * any layout shift during project transitions. It must:
 * - Be a sibling (not a child) of the Selected Work section
 * - Have no Framer Motion props or animations
 * - Maintain a fixed vertical position regardless of project animations
 */
const WorkCTA = () => {
  const handleScrollToContact = () => {
    const element = document.querySelector('#contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-20 bg-background">
      <div className="max-w-content mx-auto px-8">
        <div className="text-center">
          <p className="text-muted-foreground mb-6">
            Interested in working together?
          </p>
          <Button 
            variant="default" 
            size="lg"
            onClick={handleScrollToContact}
          >
            Start a Project
          </Button>
        </div>
      </div>
    </section>
  );
};

export default WorkCTA;
