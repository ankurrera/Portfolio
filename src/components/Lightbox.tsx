import { useState, useEffect, useRef } from "react";

interface LightboxProps {
  images: { 
    src: string; 
    alt: string;
    photographer?: string;
    client?: string;
    location?: string;
    details?: string;
    // New metadata fields
    caption?: string;
    photographer_name?: string;
    date_taken?: string;
    device_used?: string;
    camera_lens?: string;
    credits?: string;
  }[];
  initialIndex: number;
  onClose: () => void;
}

const Lightbox = ({ images, initialIndex, onClose }: LightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    
    const imageRect = imageRef.current.getBoundingClientRect();
    const clickX = e.clientX;
    const clickY = e.clientY;
    
    // Check if click is outside image (top or bottom)
    if (clickY < imageRect.top || clickY > imageRect.bottom) {
      onClose();
      return;
    }
    
    // Check if click is on left or right side of image
    const imageCenterX = imageRect.left + imageRect.width / 2;
    if (clickX < imageCenterX) {
      handlePrevious();
    } else {
      handleNext();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    
    const imageRect = imageRef.current.getBoundingClientRect();
    const mouseX = e.clientX;
    
    setCursorPos({ x: e.clientX, y: e.clientY });
    
    // Update cursor style based on position
    const imageCenterX = imageRect.left + imageRect.width / 2;
    const container = containerRef.current;
    if (container) {
      if (mouseX < imageCenterX && currentIndex > 0) {
        container.style.cursor = 'w-resize';
      } else if (mouseX >= imageCenterX && currentIndex < images.length - 1) {
        container.style.cursor = 'e-resize';
      } else {
        container.style.cursor = 'default';
      }
    }
  };

  const currentImage = images[currentIndex];

  return (
    <div
      className="fixed inset-0 bg-background z-[100] flex items-center justify-center animate-fade-in"
      onMouseMove={handleMouseMove}
    >
      {/* Back Button - Top Left */}
      <button
        onClick={onClose}
        className="fixed top-0 left-0 w-16 h-16 md:w-[6em] md:h-[6em] z-[200] flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity"
        aria-label="Close lightbox"
      >
        <svg viewBox="0 0 60.08 60.08" className="absolute left-6 top-6 md:left-[2.4em] md:top-[2.4em] w-6 h-6 md:w-[1.8em] md:h-[1.8em]">
          <path 
            d="M25.64,58.83L2.56,30.04,25.64,1.25" 
            fill="none"
            fillRule="evenodd"
            stroke="#000"
            strokeWidth="3.5"
            strokeMiterlimit="10"
          />
        </svg>
      </button>

      {/* Page Indicator Near Cursor */}
      <div 
        className="fixed z-[102] text-foreground/60 text-sm font-inter tracking-wide pointer-events-none"
        style={{ 
          left: `${cursorPos.x + 20}px`, 
          top: `${cursorPos.y + 20}px` 
        }}
      >
        {currentIndex + 1} of {images.length}
      </div>

      {/* Right Side Metadata Block - Aligned with top of image */}
      {imageRef.current && (
        <div 
          className="fixed right-8 z-[101] text-foreground/60 text-sm font-inter leading-relaxed pointer-events-none px-4 md:px-0 max-w-xs space-y-4"
          style={{
            top: `${imageRef.current.getBoundingClientRect().top}px`
          }}
        >
          {/* Caption / Description */}
          {currentImage.caption && (
            <div className="text-base">
              {currentImage.caption}
            </div>
          )}
          
          {/* Credits / Collaborators */}
          {currentImage.credits && (
            <div className="text-xs whitespace-pre-line border-l-2 border-foreground/20 pl-3">
              <div className="font-semibold mb-1">Credits</div>
              {currentImage.credits}
            </div>
          )}
          
          {/* Tags (if available) */}
          {/* Tags would come from a tags field if it existed */}
        </div>
      )}

      {/* Photographer Name - Bottom Left (name only, no prefix) */}
      {currentImage.photographer_name && (
        <div className="fixed bottom-8 left-8 z-[101] text-foreground/60 text-sm font-inter pointer-events-none px-4 md:px-0">
          {currentImage.photographer_name}
        </div>
      )}

      {/* Date, Device, and Lens - Bottom Right (stacked vertically) */}
      {(currentImage.device_used || currentImage.camera_lens || currentImage.date_taken) && (
        <div className="fixed bottom-8 right-8 z-[101] text-foreground/60 text-xs font-inter leading-relaxed text-right pointer-events-none px-4 md:px-0 space-y-0.5">
          {currentImage.device_used && (
            <div>Device used: {currentImage.device_used}</div>
          )}
          {currentImage.camera_lens && (
            <div>Lens used: {currentImage.camera_lens}</div>
          )}
          {currentImage.date_taken && (
            <div className="pt-0.5">
              Date: {new Date(currentImage.date_taken).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          )}
        </div>
      )}

      {/* Legacy fields for backwards compatibility */}
      {!currentImage.photographer_name && currentImage.photographer && (
        <div className="fixed bottom-8 left-8 z-[101] text-foreground/60 text-sm font-inter pointer-events-none px-4 md:px-0">
          {currentImage.photographer}
        </div>
      )}
      {!currentImage.caption && currentImage.client && (
        <div className="fixed top-8 right-8 z-[101] text-foreground/60 text-sm font-inter leading-relaxed max-w-md md:max-w-lg text-right pointer-events-none px-4 md:px-0">
          For {currentImage.client}
        </div>
      )}
      {!currentImage.date_taken && !currentImage.device_used && !currentImage.camera_lens && currentImage.location && currentImage.details && (
        <div className="fixed bottom-8 right-8 z-[101] text-foreground/60 text-xs font-inter leading-relaxed text-right pointer-events-none px-4 md:px-0">
          Shot in {currentImage.location}. {currentImage.details}.
        </div>
      )}

      {/* Image Container */}
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center px-[10%]"
        onClick={handleClick}
      >
        <img
          ref={imageRef}
          src={currentImage.src}
          alt={currentImage.alt}
          className="max-w-full max-h-[85vh] object-contain transition-opacity duration-300 pointer-events-none"
        />
      </div>
    </div>
  );
};

export default Lightbox;
