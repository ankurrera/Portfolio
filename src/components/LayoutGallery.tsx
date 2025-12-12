import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { GalleryImage } from "@/types/gallery";

interface LayoutGalleryProps {
  images: GalleryImage[];
  onImageClick: (index: number) => void;
}

/**
 * Responsive gallery component with three distinct layout modes:
 * - Desktop (≥1200px): Preserves exact admin-designed layout with absolute positioning
 * - Tablet (600-1199px): 4-column responsive grid maintaining original card sizes
 * - Mobile (<600px): Single column maintaining original card sizes (scaled proportionally if needed)
 * 
 * No auto-resizing, no forced aspect ratios, no equalization of card dimensions.
 * Layout respects admin's original positioning, spacing, and card sizes.
 */

// Layout configuration constants
const DESKTOP_BREAKPOINT = 1200;
const TABLET_BREAKPOINT = 600;
const CONTAINER_MIN_HEIGHT = 600;
const CONTAINER_BOTTOM_PADDING = 100;
const DEBOUNCE_DELAY_MS = 150;

const LayoutGallery = ({ images, onImageClick }: LayoutGalleryProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Detect viewport size for layout mode with debouncing
  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      setIsDesktop(width >= DESKTOP_BREAKPOINT);
      setIsTablet(width >= TABLET_BREAKPOINT && width < DESKTOP_BREAKPOINT);
    };
    
    const debouncedCheckViewport = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(checkViewport, DEBOUNCE_DELAY_MS);
    };
    
    // Initial check without debounce
    checkViewport();
    
    // Debounced resize listener
    window.addEventListener('resize', debouncedCheckViewport);
    
    return () => {
      window.removeEventListener('resize', debouncedCheckViewport);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Sort images by z_index for consistent display order
  const sortedImages = [...images].sort((a, b) => (a.z_index || 0) - (b.z_index || 0));

  // Calculate container height for desktop absolute positioning mode
  const calculateContainerHeight = () => {
    if (!isDesktop || sortedImages.length === 0) return 'auto';
    
    let maxExtent = 0;
    sortedImages.forEach((image) => {
      const posY = image.position_y || 0;
      const height = image.height || 0;
      const scale = image.scale || 1;
      const bottomExtent = posY + (height * scale);
      maxExtent = Math.max(maxExtent, bottomExtent);
    });
    
    // Add padding for comfortable viewing
    return Math.max(CONTAINER_MIN_HEIGHT, maxExtent + CONTAINER_BOTTOM_PADDING);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 pb-32">
      {/* Desktop: Absolute positioning replicating admin layout */}
      {isDesktop && (
        <div 
          className="relative w-full"
          style={{ 
            minHeight: `${calculateContainerHeight()}px`,
            height: `${calculateContainerHeight()}px`,
          }}
        >
          {sortedImages.map((image, index) => {
            const posX = image.position_x || 0;
            const posY = image.position_y || 0;
            const width = image.width || 300;
            const height = image.height || 400;
            const scale = image.scale || 1;
            const rotation = image.rotation || 0;
            const zIndex = image.z_index || 0;

            return (
              <button
                key={index}
                onClick={() => onImageClick(index)}
                onMouseEnter={() => handleImageHover(index)}
                onMouseLeave={handleImageLeave}
                className="absolute cursor-zoom-in select-none group"
                style={{
                  left: `${posX}px`,
                  top: `${posY}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  zIndex: zIndex,
                }}
              >
                <div className="relative w-full h-full overflow-hidden rounded-sm shadow-lg">
                  {image.type === "video" ? (
                    <video
                      poster={image.src}
                      autoPlay
                      muted
                      loop
                      playsInline
                      onLoadedData={() => handleImageLoad(index)}
                      className={`w-full h-full object-contain transition-all duration-400 ${
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
                      className={`w-full h-full object-contain transition-all duration-400 ${
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
            );
          })}
        </div>
      )}

      {/* Tablet: 4-column grid maintaining original card sizes */}
      {isTablet && (
        <div className="gallery-tablet-grid">
          {sortedImages.map((image, index) => {
            const width = image.width || 300;
            const height = image.height || 400;
            // Guard against division by zero
            const aspectRatio = width > 0 ? height / width : 400 / 300;

            return (
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
                    paddingBottom: `${aspectRatio * 100}%`,
                  }}
                >
                  <div className="absolute inset-0">
                    {image.type === "video" ? (
                      <video
                        poster={image.src}
                        autoPlay
                        muted
                        loop
                        playsInline
                        onLoadedData={() => handleImageLoad(index)}
                        className={`w-full h-full object-contain transition-all duration-400 ${
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
                        className={`w-full h-full object-contain transition-all duration-400 ${
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
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Mobile: Single column maintaining original card sizes */}
      {!isDesktop && !isTablet && (
        <div className="gallery-mobile-column">
          {sortedImages.map((image, index) => {
            const width = image.width || 300;
            const height = image.height || 400;
            // Guard against division by zero
            const aspectRatioPercent = width > 0 ? (height / width) * 100 : (400 / 300) * 100;

            return (
              <button
                key={index}
                onClick={() => onImageClick(index)}
                onMouseEnter={() => handleImageHover(index)}
                onMouseLeave={handleImageLeave}
                className="w-full cursor-zoom-in select-none group"
                style={{
                  maxWidth: `${width}px`,
                }}
              >
                <div 
                  className="relative w-full overflow-hidden rounded-sm shadow-lg"
                  style={{
                    paddingBottom: `${aspectRatioPercent}%`,
                  }}
                >
                  <div className="absolute inset-0">
                    {image.type === "video" ? (
                      <video
                        poster={image.src}
                        autoPlay
                        muted
                        loop
                        playsInline
                        onLoadedData={() => handleImageLoad(index)}
                        className={`w-full h-full object-contain transition-all duration-400 ${
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
                        className={`w-full h-full object-contain transition-all duration-400 ${
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
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LayoutGallery;
