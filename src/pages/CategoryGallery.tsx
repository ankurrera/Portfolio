import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import PortfolioHeader from "@/components/PortfolioHeader";
import PhotographerBio from "@/components/PhotographerBio";
import PortfolioFooter from "@/components/PortfolioFooter";
import MasonryGallery from "@/components/MasonryGallery";
import Lightbox from "@/components/Lightbox";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { GalleryImage, DEFAULT_PHOTO_WIDTH, DEFAULT_PHOTO_HEIGHT } from "@/types/gallery";

const validCategories = ['selected', 'commissioned', 'editorial', 'personal', 'all'];

const CategoryGallery = () => {
  const { category } = useParams<{ category: string }>();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [page, setPage] = useState(1);

  // Validate category first, before hooks
  const isValidCategory = category && validCategories.includes(category.toLowerCase());

  const categoryUpper = category ? category.toUpperCase() : '';

  useEffect(() => {
    if (!isValidCategory) return;

    const loadImages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const validatedCategory = category!.toLowerCase();
        
        // Build query based on category - 'all' fetches from all categories
        let query = supabase
          .from('photos')
          .select('*')
          .eq('is_draft', false)
          .order('display_order', { ascending: true });

        // Only filter by category if not 'all'
        if (validatedCategory !== 'all') {
          query = query.eq('category', validatedCategory as 'selected' | 'commissioned' | 'editorial' | 'personal');
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        // Transform Supabase photos to gallery format
        const transformedImages = (data || []).map((photo) => ({
          type: 'image' as const,
          src: photo.image_url,
          highResSrc: photo.image_url,
          alt: photo.title || 'Portfolio image',
          photographer: 'Morgan Blake',
          client: photo.description || '',
          location: '',
          details: photo.description || '',
          width: photo.width || DEFAULT_PHOTO_WIDTH,
          height: photo.height || DEFAULT_PHOTO_HEIGHT,
        }));

        setImages(transformedImages);
      } catch (err) {
        console.error('Error fetching photos from Supabase:', err);
        setError('Failed to load images. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadImages();
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
    "name": `${getCategoryTitle(category)} - Morgan Blake`,
    "description": getCategoryDescription(category),
    "url": `https://morganblake.com/category/${category}`,
    "creator": {
      "@type": "Person",
      "name": "Morgan Blake"
    }
  };

  return (
    <>
      <SEO
        title={`${getCategoryTitle(category)} - Morgan Blake`}
        description={getCategoryDescription(category)}
        canonicalUrl={`/category/${category}`}
        jsonLd={jsonLd}
      />

      <PortfolioHeader
        activeCategory={categoryUpper}
      />

      <main>
        <PhotographerBio />

        {error && (
          <div className="text-center py-20">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {!error && images.length > 0 && (
          <MasonryGallery
            images={images}
            onImageClick={handleImageClick}
          />
        )}

        {!loading && !error && images.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No photos yet.</p>
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
    </>
  );
};

export default CategoryGallery;
