import { useState, useEffect, useRef } from "react";
import PortfolioHeader from "@/components/PortfolioHeader";
import DynamicHero from "@/components/DynamicHero";
import PortfolioFooter from "@/components/PortfolioFooter";
import PageLayout from "@/components/PageLayout";
import DevErrorBanner from "@/components/DevErrorBanner";
import LayoutGallery from "@/components/LayoutGallery";
import ArtworkLightbox from "@/components/ArtworkLightbox";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";
import { supabase } from "@/integrations/supabase/client";
import { GalleryImage, DEFAULT_PHOTO_WIDTH, DEFAULT_PHOTO_HEIGHT } from "@/types/gallery";
import { ArtworkData } from "@/types/artwork";

const Artistic = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [artworks, setArtworks] = useState<ArtworkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | undefined>(undefined);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const loadImages = async () => {
      // Cancel any in-flight requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller with timeout
      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(() => {
        abortControllerRef.current?.abort();
      }, 15000); // 15 second timeout

      try {
        setLoading(true);
        setError(null);
        setErrorDetails(undefined);
        
        console.info('[Artistic] Fetching artworks');
        
        // Fetch from artworks table instead of photos
        const { data, error: fetchError } = await supabase
          .from('artworks')
          .select('*')
          .eq('is_published', true)
          .order('z_index', { ascending: true })
          .abortSignal(abortControllerRef.current.signal);

        clearTimeout(timeoutId);

        if (fetchError) throw fetchError;

        console.info(`[Artistic] Successfully fetched ${data?.length || 0} artworks`);

        // Store original artworks for lightbox
        setArtworks(data || []);

        // Transform artworks to gallery format for grid display
        const transformedImages = (data || []).map((artwork: ArtworkData) => ({
          type: 'image' as const,
          src: artwork.primary_image_url, // Display derivative (web-optimized)
          highResSrc: artwork.primary_image_original_url || artwork.primary_image_url, // Use original for high-res
          alt: artwork.title || 'Artwork',
          photographer: 'Ankur Bag',
          client: '',
          location: '',
          details: artwork.description || '',
          width: artwork.width || DEFAULT_PHOTO_WIDTH,
          height: artwork.height || DEFAULT_PHOTO_HEIGHT,
          // Include WYSIWYG layout fields
          position_x: artwork.position_x,
          position_y: artwork.position_y,
          scale: artwork.scale,
          rotation: artwork.rotation,
          z_index: artwork.z_index,
          // Include metadata fields
          caption: artwork.title,
          photographer_name: 'Ankur Bag',
          date_taken: artwork.creation_date,
          device_used: artwork.paper_type,
          camera_lens: [
            ...(artwork.pencil_grades || []),
            ...(artwork.charcoal_types || []),
          ].join(', ') || undefined,
          credits: artwork.copyright,
        }));

        setImages(transformedImages);
      } catch (err: unknown) {
        clearTimeout(timeoutId);

        // Don't show error if request was aborted intentionally
        if (err instanceof Error && (err.name === 'AbortError' || abortControllerRef.current?.signal.aborted)) {
          console.warn('[Artistic] Request aborted (timeout or navigation)');
          setError('Request timed out. Please check your network connection.');
          setErrorDetails('The request took longer than 15 seconds to complete.');
          return;
        }
        
        console.error('[Artistic] Error fetching artworks from Supabase:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError('Failed to load images. Please try again later.');
        setErrorDetails(`Error: ${errorMessage}\n\nCheck browser console and network tab for more details.`);
      } finally {
        setLoading(false);
      }
    };

    loadImages();

    // Cleanup function to abort in-flight requests when component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Artistic - Ankur Bag",
    "description": "Artistic photography exploring creative expression and visual storytelling.",
    "url": "https://morganblake.com/artistic",
    "creator": {
      "@type": "Person",
      "name": "Ankur Bag"
    }
  };

  return (
    <PageLayout hasSidebar>
      <SEO 
        title="Artistic - Ankur Bag"
        description="Artistic photography exploring creative expression and visual storytelling."
        canonicalUrl="/artistic"
        jsonLd={jsonLd}
      />

      <DevErrorBanner error={error} details={errorDetails} />

      <PortfolioHeader activeCategory="ARTISTIC" />

      <main className="flex-1">
        <DynamicHero 
          pageSlug="artistic"
          fallbackTitle="Ankur Bag"
          fallbackSubtitle="FASHION PRODUCTION & PHOTOGRAPHY"
          fallbackDescription="Production photographer specializing in fashion, editorial, and commercial work. Creating compelling imagery for global brands and publications."
        />
        
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'ARTISTIC' }
          ]}
        />

        {error && (
          <div className="text-center py-20">
            <p className="text-destructive">{error}</p>
            {import.meta.env.DEV && (
              <p className="text-xs text-muted-foreground mt-2">
                See console/network tab for error details
              </p>
            )}
          </div>
        )}

        {!error && images.length > 0 && (
          <LayoutGallery
            images={images}
            onImageClick={handleImageClick}
          />
        )}

        {!loading && !error && images.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No artworks yet.</p>
            {import.meta.env.DEV && (
              <p className="text-xs text-muted-foreground mt-2">
                Check console for errors or upload artworks via /admin/artistic/edit
              </p>
            )}
          </div>
        )}
      </main>

      {lightboxOpen && artworks.length > 0 && (
        <ArtworkLightbox
          artworks={artworks}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      <PortfolioFooter />
    </PageLayout>
  );
};

export default Artistic;
