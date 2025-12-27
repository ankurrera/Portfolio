import { useState, useEffect, useRef } from "react";
import PortfolioHeader from "@/components/PortfolioHeader";
import DynamicHero from "@/components/DynamicHero";
import PortfolioFooter from "@/components/PortfolioFooter";
import PageLayout from "@/components/PageLayout";
import DevErrorBanner from "@/components/DevErrorBanner";
import LayoutGallery from "@/components/LayoutGallery";
import Lightbox from "@/components/Lightbox";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { GalleryImage, DEFAULT_PHOTO_WIDTH, DEFAULT_PHOTO_HEIGHT } from "@/types/gallery";

const Photoshoots = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
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
        
        console.info('[Photoshoots] Fetching all photos');
        
        // Fetch all photos from all categories
        const { data, error: fetchError } = await supabase
          .from('photos')
          .select('*')
          .eq('is_draft', false)
          .order('z_index', { ascending: true })
          .abortSignal(abortControllerRef.current.signal);

        clearTimeout(timeoutId);

        if (fetchError) throw fetchError;

        console.info(`[Photoshoots] Successfully fetched ${data?.length || 0} photos`);

        // Transform Supabase photos to gallery format
        const transformedImages = (data || []).map((photo) => ({
          type: 'image' as const,
          src: photo.image_url,
          highResSrc: photo.original_file_url || photo.image_url,
          alt: photo.title || 'Portfolio image',
          photographer: 'Ankur Bag',
          client: photo.description || '',
          location: '',
          details: photo.description || '',
          width: photo.width || DEFAULT_PHOTO_WIDTH,
          height: photo.height || DEFAULT_PHOTO_HEIGHT,
          position_x: photo.position_x,
          position_y: photo.position_y,
          scale: photo.scale,
          rotation: photo.rotation,
          z_index: photo.z_index,
          caption: photo.caption,
          photographer_name: photo.photographer_name,
          date_taken: photo.date_taken,
          device_used: photo.device_used,
          camera_lens: photo.camera_lens,
          credits: photo.credits,
        }));

        setImages(transformedImages);
      } catch (err: unknown) {
        clearTimeout(timeoutId);

        // Don't show error if request was aborted intentionally
        if (err instanceof Error && (err.name === 'AbortError' || abortControllerRef.current?.signal.aborted)) {
          console.warn('[Photoshoots] Request aborted (timeout or navigation)');
          setError('Request timed out. Please check your network connection.');
          setErrorDetails('The request took longer than 15 seconds to complete.');
          return;
        }
        
        console.error('[Photoshoots] Error fetching photos from Supabase:', err);
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
    "name": "Photoshoots - Ankur Bag",
    "description": "Complete portfolio spanning fashion campaigns, editorial work, and personal projects with a distinctive minimalist aesthetic.",
    "url": "https://morganblake.com/photoshoots",
    "creator": {
      "@type": "Person",
      "name": "Ankur Bag"
    }
  };

  return (
    <PageLayout>
      <SEO
        title="Photoshoots - Ankur Bag"
        description="Complete portfolio spanning fashion campaigns, editorial work, and personal projects with a distinctive minimalist aesthetic."
        canonicalUrl="/photoshoots"
        jsonLd={jsonLd}
      />

      <DevErrorBanner error={error} details={errorDetails} />

      <PortfolioHeader activeCategory="PHOTOSHOOTS" />

      <main className="flex-1">
        <DynamicHero 
          pageSlug="photoshoots"
          fallbackTitle="Ankur Bag"
          fallbackSubtitle="FASHION PRODUCTION & PHOTOGRAPHY"
          fallbackDescription="Production photographer specializing in fashion, editorial, and commercial work. Creating compelling imagery for global brands and publications."
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
            <p className="text-muted-foreground">No photos yet.</p>
            {import.meta.env.DEV && (
              <p className="text-xs text-muted-foreground mt-2">
                Check console for errors or upload photos via /admin
              </p>
            )}
          </div>
        )}
      </main>

      {lightboxOpen && images.length > 0 && (
        <Lightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      <PortfolioFooter />
    </PageLayout>
  );
};

export default Photoshoots;
