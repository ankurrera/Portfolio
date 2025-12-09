import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { GalleryImage } from "@/types/gallery";

// Maximum layout width for scaling calculations
const LAYOUT_MAX_WIDTH = 1600;

interface LayoutGalleryProps {
  images: GalleryImage[];
  onImageClick: (index: number) => void;
}

/**
 * Gallery component that respects WYSIWYG layout positioning from admin dashboard.
 * Uses responsive CSS to scale layout while maintaining relative positions.
 * Falls back to natural image size if layout fields are missing.
 */
const LayoutGallery = ({ images, onImageClick }: LayoutGalleryProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [containerWidth, setContainerWidth] = useState(LAYOUT_MAX_WIDTH);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index));
  }, []);

  // Check if image is already cached/complete on mount
  const checkImageComplete = useCallback((img: HTMLImageElement | null, index: number) => {
    if (img?.complete && img.naturalHeight !== 0) {
      handleImageLoad(index);
    }
  }, [handleImageLoad]);

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

  // Track container width for responsive scaling
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(width);
      }
    };

    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    
    return () => {
      window.removeEventListener('resize', updateContainerWidth);
    };
  }, []);

  // Check if any image has layout data
  const hasLayoutData = images.some(
    (img) => img.position_x !== undefined || img.position_y !== undefined
  );

  // Sort images by z_index if layout data exists
  const sortedImages = hasLayoutData
    ? [...images].sort((a, b) => (a.z_index || 0) - (b.z_index || 0))
    : images;

  // Calculate layout scale for responsive scaling
  const getLayoutScale = useCallback(() => {
    return Math.min(1, containerWidth / LAYOUT_MAX_WIDTH);
  }, [containerWidth]);

  // Calculate container height based on positioned content
  const calculateContainerHeight = useCallback(() => {
    if (!hasLayoutData || sortedImages.length === 0) {
      return 600; // Fallback minimum height
    }

    let maxExtent = 0;
    sortedImages.forEach((image) => {
      const {
        position_y = 0,
        height = 400,
        scale = 1,
      } = image;
      
      // Calculate the bottom extent of each image considering scale
      // Since images are centered on their transform origin, we need to account for scale expansion
      const scaledHeight = height * scale;
      const scaleOffset = (scaledHeight - height) / 2; // How much scale pushes the image down
      const bottomExtent = position_y + height + scaleOffset;
      
      maxExtent = Math.max(maxExtent, bottomExtent);
    });

    // Add generous padding to ensure content isn't cut off and footer has space
    // 200px ensures adequate spacing for footer (typical footer height + margin)
    const baseHeight = Math.max(600, maxExtent + 200);
    
    // Apply responsive scaling to the height
    // Guard against division by zero during initial render
    const layoutScale = getLayoutScale();
    return baseHeight * layoutScale;
  }, [hasLayoutData, sortedImages, getLayoutScale]);

  const containerHeight = calculateContainerHeight();
  const layoutScale = getLayoutScale();

  return (
    <div ref={containerRef} className={`max-w-[${LAYOUT_MAX_WIDTH}px] mx-auto px-3 md:px-5 pb-32`}>{/* Increased bottom padding for footer clearance */}
      {hasLayoutData ? (
        // WYSIWYG Layout Mode - respects admin positioning
        // Uses CSS transforms to scale entire layout on smaller screens
        <div 
          className="relative overflow-visible" 
          style={{ 
            minHeight: `${containerHeight}px`,
          }}
        >
          <div className="relative origin-top-left" style={{
            transform: `scale(${layoutScale})`,
          } as React.CSSProperties}>
            {sortedImages.map((image, index) => {
              const {
                position_x = 0,
                position_y = 0,
                width = 300,
                height = 400,
                scale = 1,
                rotation = 0,
                z_index = 0,
              } = image;

              return (
                <button
                  key={index}
                  onClick={() => onImageClick(index)}
                  onMouseEnter={() => handleImageHover(index)}
                  onMouseLeave={handleImageLeave}
                  className="absolute cursor-zoom-in select-none"
                  style={{
                    left: position_x,
                    top: position_y,
                    width: width,
                    height: height,
                    transform: `scale(${scale}) rotate(${rotation}deg)`,
                    transformOrigin: 'center',
                    zIndex: z_index,
                  }}
                >
                <div className="relative h-full w-full overflow-hidden rounded-sm shadow-lg">
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
                      ref={(img) => checkImageComplete(img, index)}
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
                  {image.photographer && image.client && (
                    <motion.div
                      className="absolute bottom-0 left-0 w-full pointer-events-none"
                      animate={hoveredIndex === index ? "visible" : "hidden"}
                      variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1 },
                      }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <div className="flex flex-col items-center gap-0 px-4 py-3 text-center">
                        <p className="text-base font-medium text-white">
                          For {image.client}
                        </p>
                        <span className="text-xs text-white/90">
                          Shot in {image.location}. {image.details}.
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </button>
            );
          })}
          </div>
        </div>
      ) : (
        // Fallback: Natural image size layout (not masonry)
        <div className="flex flex-wrap gap-2 md:gap-3 lg:gap-4 justify-center">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => onImageClick(index)}
              onMouseEnter={() => handleImageHover(index)}
              onMouseLeave={handleImageLeave}
              className="relative cursor-zoom-in inline-block"
              style={{
                maxWidth: '100%',
                width: image.width ? `${image.width}px` : 'auto',
                height: image.height ? `${image.height}px` : 'auto',
              }}
            >
              <div className="relative h-full overflow-hidden rounded-sm shadow-lg">
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
                    ref={(img) => checkImageComplete(img, index)}
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
                      aspectRatio: image.width && image.height ? `${image.width} / ${image.height}` : 'auto',
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
                {image.photographer && image.client && (
                  <motion.div
                    className="absolute bottom-0 left-0 w-full pointer-events-none"
                    animate={hoveredIndex === index ? "visible" : "hidden"}
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1 },
                    }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <div className="flex flex-col items-center gap-0 px-4 py-3 text-center">
                      <p className="text-base font-medium text-white">
                        For {image.client}
                      </p>
                      <span className="text-xs text-white/90">
                        Shot in {image.location}. {image.details}.
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LayoutGallery;
