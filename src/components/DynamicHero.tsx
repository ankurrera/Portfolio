import { useHeroText } from '@/hooks/useHeroText';
import { Link } from 'react-router-dom';
import { MHSkeleton } from '@/components/MHSkeleton';
import { TextGenerateEffect } from '@/components/ui/text-generate-effect';

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
        <div className="space-y-4 text-center max-w-2xl mx-auto py-6">
          <MHSkeleton variant="text" className="h-10 w-2/3 mx-auto" />
          <MHSkeleton variant="text" className="h-4 w-1/3 mx-auto animate-pulse" />
          <div className="space-y-2 pt-2">
            <MHSkeleton variant="text" className="h-4 w-full" />
            <MHSkeleton variant="text" className="h-4 w-[90%]" />
          </div>
        </div>
      </section>
    );
  }

  // Use fallback data if error or no data
  const title = heroText?.hero_title || fallbackTitle;
  const subtitle = heroText?.hero_subtitle || fallbackSubtitle;
  const description = heroText?.hero_description || fallbackDescription;

  // Check if CTA link is internal (starts with /) or external
  const isInternalLink = heroText?.cta_link?.startsWith('/');
  const ctaElement = heroText?.cta_text && heroText?.cta_link && (
    isInternalLink ? (
      <Link
        to={heroText.cta_link}
        className="inline-block px-6 py-3 text-sm uppercase tracking-wider border border-foreground/20 hover:bg-foreground hover:text-background transition-all"
      >
        {heroText.cta_text}
      </Link>
    ) : (
      <a
        href={heroText.cta_link}
        className="inline-block px-6 py-3 text-sm uppercase tracking-wider border border-foreground/20 hover:bg-foreground hover:text-background transition-all"
        target="_blank"
        rel="noopener noreferrer"
      >
        {heroText.cta_text}
      </a>
    )
  );

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
        <h1 className="font-playfair text-4xl md:text-5xl text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-inter">
            {subtitle}
          </p>
        )}
        {description && (
          <TextGenerateEffect
            words={description}
            className="text-sm text-foreground/80 max-w-2xl leading-relaxed mx-auto font-normal"
            filter={false}
            duration={0.5}
          />
        )}
        {ctaElement && (
          <div className="pt-4">
            {ctaElement}
          </div>
        )}
      </div>
    </section>
  );
};

export default DynamicHero;
