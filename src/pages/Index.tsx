import { useState, useEffect, useRef } from "react";
import PortfolioHeader from "@/components/PortfolioHeader";
import PhotographerBio from "@/components/PhotographerBio";
import PortfolioFooter from "@/components/PortfolioFooter";
import PageLayout from "@/components/PageLayout";
import DevErrorBanner from "@/components/DevErrorBanner";
import LayoutGallery from "@/components/LayoutGallery";
import Lightbox from "@/components/Lightbox";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { GalleryImage, DEFAULT_PHOTO_WIDTH, DEFAULT_PHOTO_HEIGHT } from "@/types/gallery";

const Index = () => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [displayImages, setDisplayImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Homepage always shows SELECTED category
  const activeCategory = "SELECTED";

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
        
        console.info('[Index] Fetching photos for SELECTED category...');
        
        // Fetch published photos from Supabase for SELECTED category
        const { data, error: fetchError } = await supabase
          .from('photos')
          .select('*')
          .eq('category', 'selected' as const)
          .eq('is_draft', false)
          .order('z_index', { ascending: true })
          .abortSignal(abortControllerRef.current.signal);

        clearTimeout(timeoutId);

        if (fetchError) throw fetchError;

        console.info(`[Index] Successfully fetched ${data?.length || 0} photos`);

        // Transform Supabase photos to gallery format
        const transformedImages = (data || []).map((photo) => ({
          type: 'image' as const,
          src: photo.image_url,
          highResSrc: photo.image_url,
          alt: photo.title || 'Portfolio image',
          photographer: 'Ankur Bag',
          client: photo.description || '',
          location: '',
          details: photo.description || '',
          width: photo.width || DEFAULT_PHOTO_WIDTH,
          height: photo.height || DEFAULT_PHOTO_HEIGHT,
          // Include WYSIWYG layout fields
          position_x: photo.position_x,
          position_y: photo.position_y,
          scale: photo.scale,
          rotation: photo.rotation,
          z_index: photo.z_index,
          // Include metadata fields
          caption: photo.caption,
          photographer_name: photo.photographer_name,
          date_taken: photo.date_taken,
          device_used: photo.device_used,
          camera_lens: photo.camera_lens,
          credits: photo.credits,
        }));

        setDisplayImages(transformedImages);
      } catch (err: unknown) {
        clearTimeout(timeoutId);

        // Don't show error if request was aborted intentionally
        if (err instanceof Error && (err.name === 'AbortError' || abortControllerRef.current?.signal.aborted)) {
          console.warn('[Index] Request aborted (timeout or navigation)');
          setError('Request timed out. Please check your network connection.');
          setErrorDetails('The request took longer than 15 seconds to complete.');
          return;
        }
        
        console.error('[Index] Error fetching photos from Supabase:', err);
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
  }, []); // Remove activeCategory dependency - it's now constant

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Ankur Bag",
    "jobTitle": "Production Photographer",
    "description": "Production photographer specializing in fashion, editorial, and commercial photography. Creating compelling imagery for global brands and publications.",
    "url": "https://morganblake.com",
    "image": "https://morganblake.com/og-image.jpg",
    "sameAs": [
      "https://www.instagram.com/ankurr.tf/"
    ],
    "knowsAbout": [
      "Fashion Photography",
      "Editorial Photography",
      "Commercial Production",
      "Fashion Campaigns",
      "Brand Photography"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "London",
      "addressCountry": "UK"
    }
  };

  return (
    <PageLayout>
      <SEO
        title="Ankur Bag - Fashion Production & Photography"
        description="Production photographer specializing in fashion, editorial, and commercial photography. Creating compelling imagery for global brands and publications."
        canonicalUrl="/"
        ogType="profile"
        jsonLd={jsonLd}
      />

      <DevErrorBanner error={error} details={errorDetails} />

      <PortfolioHeader
        activeCategory={activeCategory}
      />
      
      <main className="flex-1">
        <PhotographerBio />

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

        {!error && displayImages.length > 0 && (
          <LayoutGallery
            images={displayImages}
            onImageClick={handleImageClick}
          />
        )}

        {!loading && !error && displayImages.length === 0 && (
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

      {lightboxOpen && displayImages.length > 0 && (
        <Lightbox
          images={displayImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      <PortfolioFooter />
    </PageLayout>
  );
};

export default Index;
