import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

interface GalleryItem {
  type?: "image" | "video";
  src: string;
  videoSrc?: string;
  highResSrc?: string;
  alt: string;
  photographer?: string;
  client?: string;
  location?: string;
  details?: string;
  span?: number;
  width?: number;
  height?: number;
}

interface MasonryGalleryProps {
  images: GalleryItem[];
  onImageClick: (index: number) => void;
}

const MasonryGallery = ({ images, onImageClick }: MasonryGalleryProps) => {
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

  return (
    <div className="max-w-[1600px] mx-auto md:px-5 pb-16">
      <div className="gallery-hover-container text-center">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => onImageClick(index)}
            onMouseEnter={() => handleImageHover(index)}
            onMouseLeave={handleImageLeave}
            className="relative cursor-zoom-in gallery-image inline-block align-top p-[3px] md:p-1 lg:p-1.5"
            style={{ height: "270px" }}
          >
            <div className="relative h-full overflow-hidden">
              {image.type === "video" ? (
                // Video element with thumbnail poster
                <div className="relative h-full w-auto inline-block">
                  {image.width && image.height && (
                    <svg
                      width={image.width}
                      height={image.height}
                      viewBox={`0 0 ${image.width} ${image.height}`}
                      className="h-full w-auto"
                    >
                      <rect
                        width={image.width}
                        height={image.height}
                        fill="white"
                      />
                    </svg>
                  )}
                  <video
                    poster={image.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    onLoadedData={() => handleImageLoad(index)}
                    className={`absolute top-0 left-0 h-full w-auto object-contain transition-all duration-400 ${
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
                </div>
              ) : (
                // Image element with SVG placeholder
                <picture
                  className={`inline-block h-full w-auto ${
                    loadedImages.has(index) ? "show" : ""
                  }`}
                >
                  {image.width && image.height && (
                    <svg
                      width={image.width}
                      height={image.height}
                      viewBox={`0 0 ${image.width} ${image.height}`}
                      className="h-full w-auto"
                    >
                      <rect
                        width={image.width}
                        height={image.height}
                        fill="white"
                      />
                    </svg>
                  )}
                  <img
                    src={image.src}
                    alt={image.alt}
                    onLoad={() => handleImageLoad(index)}
                    className={`absolute top-0 left-0 h-full w-auto object-contain transition-all duration-400 ${
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
                </picture>
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
    </div>
  );
};

export default MasonryGallery;
