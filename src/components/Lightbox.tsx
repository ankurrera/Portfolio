import { useState, useEffect, useRef, useCallback } from "react";

interface LightboxProps {
  images: { 
    type?: 'image' | 'video';
    src: string; 
    videoSrc?: string;
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
    video_thumbnail_url?: string;
    video_duration_seconds?: number;
    video_width?: number;
    video_height?: number;
  }[];
  initialIndex: number;
  onClose: () => void;
}

// Helper function to determine video MIME type from URL
const getVideoMimeType = (url: string): string => {
  if (url.endsWith('.webm')) return 'video/webm';
  if (url.endsWith('.ogg')) return 'video/ogg';
  return 'video/mp4';
};

const Lightbox = ({ images, initialIndex, onClose }: LightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect mobile viewport with debouncing
  const checkMobile = useCallback(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  useEffect(() => {
    checkMobile();
    
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(checkMobile, 150);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [checkMobile]);

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
    // Pause video when switching to a different item
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
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
    const currentImage = images[currentIndex];
    const isVideo = currentImage.type === 'video';
    const elementRef = isVideo ? videoRef : imageRef;
    
    if (!elementRef.current) return;
    
    const elementRect = elementRef.current.getBoundingClientRect();
    const clickX = e.clientX;
    const clickY = e.clientY;
    
    // Check if click is outside element (top or bottom)
    if (clickY < elementRect.top || clickY > elementRect.bottom) {
      onClose();
      return;
    }
    
    // Check if click is on left or right side of element
    const elementCenterX = elementRect.left + elementRect.width / 2;
    if (clickX < elementCenterX) {
      handlePrevious();
    } else {
      handleNext();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const currentImage = images[currentIndex];
    const isVideo = currentImage.type === 'video';
    const elementRef = isVideo ? videoRef : imageRef;
    
    if (!elementRef.current) return;
    
    const elementRect = elementRef.current.getBoundingClientRect();
    const mouseX = e.clientX;
    
    // Update cursor style based on position
    const elementCenterX = elementRect.left + elementRect.width / 2;
    const container = containerRef.current;
    if (container) {
      if (mouseX < elementCenterX && currentIndex > 0) {
        container.style.cursor = 'w-resize';
      } else if (mouseX >= elementCenterX && currentIndex < images.length - 1) {
        container.style.cursor = 'e-resize';
      } else {
        container.style.cursor = 'default';
      }
    }
  };

  const currentImage = images[currentIndex];

  // Mobile layout: vertical stack with text above and below image
  if (isMobile) {
    return (
      <div
        className="fixed inset-0 bg-background z-[100] flex flex-col animate-fade-in overflow-y-auto"
      >
        {/* Back Button - Top Left */}
        <button
          onClick={onClose}
          className="fixed top-0 left-0 w-16 h-16 z-[200] flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity"
          aria-label="Close lightbox"
        >
          <svg viewBox="0 0 60.08 60.08" className="absolute left-6 top-6 w-6 h-6">
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

        {/* Mobile Content Container */}
        <div className="flex-1 flex flex-col justify-center px-4 py-16">
          {/* Top Metadata: Title/Caption, Credits - Above Image */}
          <div className="text-center mb-6 space-y-3">
            {/* Caption / Description */}
            {currentImage.caption && (
              <div className="text-foreground/80 text-base font-inter">
                {currentImage.caption}
              </div>
            )}
            
            {/* Credits / Collaborators - No decorative bar */}
            {currentImage.credits && (
              <div className="text-foreground/60 text-xs font-inter whitespace-pre-line">
                <div className="font-semibold mb-1">Credits</div>
                {currentImage.credits}
              </div>
            )}

            {/* Legacy client field */}
            {!currentImage.caption && currentImage.client && (
              <div className="text-foreground/60 text-sm font-inter">
                For {currentImage.client}
              </div>
            )}
          </div>

          {/* Image/Video Container */}
          <div
            ref={containerRef}
            className="relative flex items-center justify-center"
            onClick={handleClick}
          >
            {currentImage.type === 'video' ? (
              <video
                ref={videoRef}
                src={currentImage.videoSrc || currentImage.src}
                poster={currentImage.video_thumbnail_url || currentImage.src}
                controls
                controlsList="nodownload"
                disablePictureInPicture
                disableRemotePlayback
                onContextMenu={(e) => e.preventDefault()}
                className="max-w-full max-h-[60vh] object-contain transition-opacity duration-300"
                style={{
                  WebkitTouchCallout: 'none',
                  userSelect: 'none',
                }}
              >
                <source 
                  src={currentImage.videoSrc || currentImage.src} 
                  type={getVideoMimeType(currentImage.videoSrc || currentImage.src)} 
                />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                ref={imageRef}
                src={currentImage.src}
                alt={currentImage.alt}
                className="max-w-full max-h-[60vh] object-contain transition-opacity duration-300 pointer-events-none"
              />
            )}
          </div>

          {/* Bottom Metadata: Photographer, Device, Date - Below Image */}
          <div className="text-center mt-6 space-y-2">
            {/* Photographer Name */}
            {currentImage.photographer_name && (
              <div className="text-foreground/60 text-sm font-inter">
                {currentImage.photographer_name}
              </div>
            )}
            
            {/* Legacy photographer field */}
            {!currentImage.photographer_name && currentImage.photographer && (
              <div className="text-foreground/60 text-sm font-inter">
                {currentImage.photographer}
              </div>
            )}

            {/* Device, Lens, Date */}
            {(currentImage.device_used || currentImage.camera_lens || currentImage.date_taken) && (
              <div className="text-foreground/60 text-xs font-inter space-y-0.5">
                {currentImage.device_used && (
                  <div>Device used: {currentImage.device_used}</div>
                )}
                {currentImage.camera_lens && (
                  <div>Lens used: {currentImage.camera_lens}</div>
                )}
                {currentImage.date_taken && (
                  <div>
                    Date: {new Date(currentImage.date_taken).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Legacy location/details fields */}
            {!currentImage.date_taken && !currentImage.device_used && !currentImage.camera_lens && currentImage.location && currentImage.details && (
              <div className="text-foreground/60 text-xs font-inter">
                Shot in {currentImage.location}. {currentImage.details}.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout: original side-positioned metadata
  return (
    <div
      className="fixed inset-0 bg-background z-[100] flex items-center justify-center animate-fade-in"
      onMouseMove={handleMouseMove}
    >
      {/* Back Button - Top Left */}
      <button
        onClick={onClose}
        className="fixed top-0 left-0 w-[6em] h-[6em] z-[200] flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity"
        aria-label="Close lightbox"
      >
        <svg viewBox="0 0 60.08 60.08" className="absolute left-[2.4em] top-[2.4em] w-[1.8em] h-[1.8em]">
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

      {/* Right Side Metadata Block - Aligned with top of image/video */}
      {(imageRef.current || videoRef.current) && (
        <div 
          className="fixed right-8 z-[101] text-foreground/60 text-sm font-inter leading-relaxed pointer-events-none max-w-xs space-y-4"
          style={{
            top: `${(imageRef.current || videoRef.current)?.getBoundingClientRect().top}px`
          }}
        >
          {/* Caption / Description */}
          {currentImage.caption && (
            <div className="text-base">
              {currentImage.caption}
            </div>
          )}
          
          {/* Credits / Collaborators - No decorative bar */}
          {currentImage.credits && (
            <div className="text-xs whitespace-pre-line">
              <div className="font-semibold mb-1">Credits</div>
              {currentImage.credits}
            </div>
          )}
        </div>
      )}

      {/* Photographer Name - Bottom Left (name only, no prefix) */}
      {currentImage.photographer_name && (
        <div className="fixed bottom-8 left-8 z-[101] text-foreground/60 text-sm font-inter pointer-events-none">
          {currentImage.photographer_name}
        </div>
      )}

      {/* Date, Device, and Lens - Bottom Right (stacked vertically) */}
      {(currentImage.device_used || currentImage.camera_lens || currentImage.date_taken) && (
        <div className="fixed bottom-8 right-8 z-[101] text-foreground/60 text-xs font-inter leading-relaxed text-right pointer-events-none space-y-0.5">
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
        <div className="fixed bottom-8 left-8 z-[101] text-foreground/60 text-sm font-inter pointer-events-none">
          {currentImage.photographer}
        </div>
      )}
      {!currentImage.caption && currentImage.client && (
        <div className="fixed top-8 right-8 z-[101] text-foreground/60 text-sm font-inter leading-relaxed max-w-lg text-right pointer-events-none">
          For {currentImage.client}
        </div>
      )}
      {!currentImage.date_taken && !currentImage.device_used && !currentImage.camera_lens && currentImage.location && currentImage.details && (
        <div className="fixed bottom-8 right-8 z-[101] text-foreground/60 text-xs font-inter leading-relaxed text-right pointer-events-none">
          Shot in {currentImage.location}. {currentImage.details}.
        </div>
      )}

      {/* Image/Video Container */}
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center px-[10%]"
        onClick={handleClick}
      >
        {currentImage.type === 'video' ? (
          <video
            ref={videoRef}
            src={currentImage.videoSrc || currentImage.src}
            poster={currentImage.video_thumbnail_url || currentImage.src}
            controls
            controlsList="nodownload"
            disablePictureInPicture
            disableRemotePlayback
            onContextMenu={(e) => e.preventDefault()}
            className="max-w-full max-h-[85vh] object-contain transition-opacity duration-300"
            style={{
              WebkitTouchCallout: 'none',
              userSelect: 'none',
            }}
          >
            <source 
              src={currentImage.videoSrc || currentImage.src} 
              type={getVideoMimeType(currentImage.videoSrc || currentImage.src)} 
            />
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            ref={imageRef}
            src={currentImage.src}
            alt={currentImage.alt}
            className="max-w-full max-h-[85vh] object-contain transition-opacity duration-300 pointer-events-none"
          />
        )}
      </div>
    </div>
  );
};

export default Lightbox;
