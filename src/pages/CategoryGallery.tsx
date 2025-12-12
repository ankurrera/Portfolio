import { useState, useEffect, useRef } from "react";
import { useParams, Navigate } from "react-router-dom";
import PortfolioHeader from "@/components/PortfolioHeader";
import PhotographerBio from "@/components/PhotographerBio";
import PortfolioFooter from "@/components/PortfolioFooter";
import PageLayout from "@/components/PageLayout";
import DevErrorBanner from "@/components/DevErrorBanner";
import LayoutGallery from "@/components/LayoutGallery";
import Lightbox from "@/components/Lightbox";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";
import { supabase } from "@/integrations/supabase/client";
import { GalleryImage, DEFAULT_PHOTO_WIDTH, DEFAULT_PHOTO_HEIGHT } from "@/types/gallery";

const validCategories = ['selected', 'commissioned', 'editorial', 'personal', 'all'];

const CategoryGallery = () => {
  const { category } = useParams<{ category: string }>();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | undefined>(undefined);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [page, setPage] = useState(1);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Validate category first, before hooks
  const isValidCategory = category && validCategories.includes(category.toLowerCase());

  const categoryUpper = category ? category.toUpperCase() : '';

  useEffect(() => {
    if (!isValidCategory) return;

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
        
        const validatedCategory = category!.toLowerCase();
        
        console.info(`[CategoryGallery] Fetching photos for category: ${validatedCategory}`);
        
        // Build query based on category - 'all' fetches from all categories
        let query = supabase
          .from('photos')
          .select('*')
          .eq('is_draft', false)
          .order('z_index', { ascending: true })
          .abortSignal(abortControllerRef.current.signal);

        // Only filter by category if not 'all'
        if (validatedCategory !== 'all') {
          query = query.eq('category', validatedCategory as 'selected' | 'commissioned' | 'editorial' | 'personal');
        }

        const { data, error: fetchError } = await query;

        clearTimeout(timeoutId);

        if (fetchError) throw fetchError;

        console.info(`[CategoryGallery] Successfully fetched ${data?.length || 0} photos for ${validatedCategory}`);

        // Transform Supabase photos to gallery format
        const transformedImages = (data || []).map((photo) => ({
          type: 'image' as const,
          src: photo.image_url, // Display derivative (web-optimized)
          highResSrc: photo.original_file_url || photo.image_url, // Use original for high-res, fallback to derivative
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
        }));

        setImages(transformedImages);
      } catch (err: unknown) {
        clearTimeout(timeoutId);

        // Don't show error if request was aborted intentionally
        if (err instanceof Error && (err.name === 'AbortError' || abortControllerRef.current?.signal.aborted)) {
          console.warn('[CategoryGallery] Request aborted (timeout or navigation)');
          setError('Request timed out. Please check your network connection.');
          setErrorDetails('The request took longer than 15 seconds to complete.');
          return;
        }
        
        console.error('[CategoryGallery] Error fetching photos from Supabase:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError('Failed to load images. Please try again later.');
        setErrorDetails(`Error: ${errorMessage}\n\nCheck browser console and network tab for more details.`);
      } finally {
        setLoading(false);
      }
    };

    loadImages();

    // Cleanup function to abort in-flight requests when component unmounts or dependencies change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [category, page, isValidCategory]);

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Validate category after all hooks
  if (!isValidCategory) {
    return <Navigate to="/" replace />;
  }

  const getCategoryTitle = (cat: string) => {
    const titles: Record<string, string> = {
      'selected': 'Selected Works',
      'commissioned': 'Commissioned Projects',
      'editorial': 'Editorial Photography',
      'personal': 'Personal Projects',
      'all': 'All Photography'
    };
    return titles[cat] || 'Gallery';
  };

  const getCategoryDescription = (cat: string) => {
    const descriptions: Record<string, string> = {
      'selected': 'Curated selection of luxury fashion campaigns and high-end editorial work showcasing contemporary minimalism and timeless elegance.',
      'commissioned': 'Commercial fashion campaigns for luxury brands, featuring product photography with clean aesthetics and professional execution.',
      'editorial': 'Editorial fashion photography for leading publications, combining artistic vision with commercial excellence.',
      'personal': 'Artistic personal projects exploring black and white photography, intimate portraiture, and creative experimentation.',
      'all': 'Complete portfolio spanning fashion campaigns, editorial work, and personal projects with a distinctive minimalist aesthetic.'
    };
    return descriptions[cat] || 'Explore the collection';
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${getCategoryTitle(category)} - Ankur Bag`,
    "description": getCategoryDescription(category),
    "url": `https://morganblake.com/photoshoots/${category}`,
    "creator": {
      "@type": "Person",
      "name": "Ankur Bag"
    }
  };

  return (
    <PageLayout>
      <SEO
        title={`${getCategoryTitle(category)} - Ankur Bag`}
        description={getCategoryDescription(category)}
        canonicalUrl={`/photoshoots/${category}`}
        jsonLd={jsonLd}
      />

      <DevErrorBanner error={error} details={errorDetails} />

      <PortfolioHeader
        activeCategory={categoryUpper}
      />

      <main className="flex-1">
        <PhotographerBio />
        
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Photoshoots', href: '/photoshoots' },
            { label: getCategoryTitle(category).toUpperCase() }
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

export default CategoryGallery;
