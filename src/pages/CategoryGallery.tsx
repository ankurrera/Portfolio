import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import PortfolioHeader from "@/components/PortfolioHeader";
import PhotographerBio from "@/components/PhotographerBio";
import PortfolioFooter from "@/components/PortfolioFooter";
import MasonryGallery from "@/components/MasonryGallery";
import Lightbox from "@/components/Lightbox";
import SEO from "@/components/SEO";
import { fetchMixedMedia } from "@/services/pexels";

const validCategories = ['selected', 'commissioned', 'editorial', 'personal', 'all'];

const CategoryGallery = () => {
  const { category } = useParams<{ category: string }>();
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [page, setPage] = useState(1);

  // Validate category
  if (!category || !validCategories.includes(category.toLowerCase())) {
    return <Navigate to="/" replace />;
  }

  const categoryUpper = category.toUpperCase();

  useEffect(() => {
    const loadImages = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchMixedMedia(categoryUpper, page, 20);
        setImages(data.items);
      } catch (err) {
        console.error('Error fetching Pexels media:', err);
        setError('Failed to load images. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [categoryUpper, page]);

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

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
            <p className="text-muted-foreground">No images found in this category.</p>
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
