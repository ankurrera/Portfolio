import { useHeroText } from '@/hooks/useHeroText';
import { Loader2 } from 'lucide-react';

interface DynamicHeroProps {
  pageSlug: string;
  fallbackTitle?: string;
  fallbackSubtitle?: string;
  fallbackDescription?: string;
}

const DynamicHero = ({ 
  pageSlug, 
  fallbackTitle = 'Ankur Bag', 
  fallbackSubtitle = 'FASHION PRODUCTION & PHOTOGRAPHY',
  fallbackDescription = 'Production photographer specializing in fashion, editorial, and commercial work.'
}: DynamicHeroProps) => {
  const { heroText, loading, error } = useHeroText(pageSlug);

  if (loading) {
    return (
      <section className="max-w-[1600px] mx-auto px-3 md:px-5 pt-16 pb-12 md:pt-20 md:pb-16">
        <div className="space-y-4 text-center flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  // Use fallback data if error or no data
  const title = heroText?.hero_title || fallbackTitle;
  const subtitle = heroText?.hero_subtitle || fallbackSubtitle;
  const description = heroText?.hero_description || fallbackDescription;

  return (
    <section 
      className="max-w-[1600px] mx-auto px-3 md:px-5 pt-16 pb-12 md:pt-20 md:pb-16"
      style={heroText?.background_media_url ? {
        backgroundImage: `url(${heroText.background_media_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : undefined}
    >
      <div className="space-y-4 text-center">
        <h2 className="font-playfair text-4xl md:text-5xl text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-inter">
            {subtitle}
          </p>
        )}
        {description && (
          <p className="text-sm text-foreground/80 max-w-2xl leading-relaxed mx-auto">
            {description}
          </p>
        )}
        {heroText?.cta_text && heroText?.cta_link && (
          <div className="pt-4">
            <a
              href={heroText.cta_link}
              className="inline-block px-6 py-3 text-sm uppercase tracking-wider border border-foreground/20 hover:bg-foreground hover:text-background transition-all"
            >
              {heroText.cta_text}
            </a>
          </div>
        )}
      </div>
    </section>
  );
};

export default DynamicHero;
