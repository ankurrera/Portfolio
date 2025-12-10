import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { GalleryImage } from "@/types/gallery";

interface LayoutGalleryProps {
  images: GalleryImage[];
  onImageClick: (index: number) => void;
}

/**
 * Responsive gallery component that reflows images into columns based on viewport size.
 * - Desktop (≥1200px): 4-5 columns, 260px cards
 * - Tablet (600-1199px): 2-3 columns, 220px cards  
 * - Mobile (<600px): 1 column, centered
 * Maintains consistent card size and 4:5 aspect ratio across all devices.
 */
const LayoutGallery = ({ images, onImageClick }: LayoutGalleryProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index));
  };

  const handleImageHover = (index: number) => {
    setHoveredIndex(index);

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set new timer to reset after 2800ms
    timerRef.current = setTimeout(() => {
      setHoveredIndex(null);
    }, 2800);
  };

  const handleImageLeave = () => {
    // Don't reset hoveredIndex on mouse leave, let the timer handle it
  };

  useEffect(() => {
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Sort images by z_index for consistent display order
  const sortedImages = [...images].sort((a, b) => (a.z_index || 0) - (b.z_index || 0));

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 pb-32">
      {/* Responsive grid layout with fixed card sizes per breakpoint */}
      <div className="gallery-responsive-grid">
        {sortedImages.map((image, index) => (
          <button
            key={index}
            onClick={() => onImageClick(index)}
            onMouseEnter={() => handleImageHover(index)}
            onMouseLeave={handleImageLeave}
            className="w-full cursor-zoom-in select-none group"
          >
            <div 
              className="relative w-full overflow-hidden rounded-sm shadow-lg"
              style={{
                aspectRatio: '4 / 5',
              }}
            >
              {image.type === "video" ? (
                <video
                  poster={image.src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  onLoadedData={() => handleImageLoad(index)}
                  className={`w-full h-full object-cover transition-all duration-400 ${
                    hoveredIndex !== null && hoveredIndex !== index
                      ? "grayscale"
                      : ""
                  }`}
                  style={{
                    opacity: loadedImages.has(index) ? 1 : 0,
                    transition: "opacity 0.5s ease-out",
                  }}
                >
                  <source src={image.videoSrc} type="video/mp4" />
                </video>
              ) : (
                <img
                  src={image.src}
                  alt={image.alt}
                  onLoad={() => handleImageLoad(index)}
                  className={`w-full h-full object-cover transition-all duration-400 ${
                    hoveredIndex !== null && hoveredIndex !== index
                      ? "grayscale"
                      : ""
                  }`}
                  style={{
                    opacity: loadedImages.has(index) ? 1 : 0,
                    transition: "opacity 0.5s ease-out",
                  }}
                  loading="lazy"
                />
              )}
              <ProgressiveBlur
                className="pointer-events-none absolute bottom-0 left-0 h-[80%] w-full"
                blurIntensity={0.6}
                animate={hoveredIndex === index ? "visible" : "hidden"}
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1 },
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              />
              {(image.photographer_name || image.date_taken) && (
                <motion.div
                  className="absolute bottom-0 left-0 w-full pointer-events-none"
                  animate={hoveredIndex === index ? "visible" : "hidden"}
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1 },
                  }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <div className="flex flex-col items-center gap-0.5 px-4 py-3 text-center">
                    {image.photographer_name && (
                      <p className="text-sm font-medium text-white">
                        Shot by {image.photographer_name}
                      </p>
                    )}
                    {image.date_taken && (
                      <span className="text-xs text-white/90">
                        {new Date(image.date_taken).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LayoutGallery;
