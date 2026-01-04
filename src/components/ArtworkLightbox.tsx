import { useState, useEffect, useRef, useCallback } from "react";
import { ArtworkData } from "@/types/artwork";

// Artist credit constants
const ARTIST_NAME = "Ankur Bag.";
const COPYRIGHT_TEXT = "© Ankur Bag.";

interface ArtworkLightboxProps {
  artworks: ArtworkData[];
  initialIndex: number;
  onClose: () => void;
}

const ArtworkLightbox = ({ artworks, initialIndex, onClose }: ArtworkLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
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
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleNext = () => {
    if (currentIndex < artworks.length - 1) {
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
    
    // Update cursor style based on position
    const imageCenterX = imageRect.left + imageRect.width / 2;
    const container = containerRef.current;
    if (container) {
      if (mouseX < imageCenterX && currentIndex > 0) {
        container.style.cursor = 'w-resize';
      } else if (mouseX >= imageCenterX && currentIndex < artworks.length - 1) {
        container.style.cursor = 'e-resize';
      } else {
        container.style.cursor = 'default';
      }
    }
  };

  const currentArtwork = artworks[currentIndex];

  // Format materials for display
  const getPaperTypes = () => {
    return currentArtwork.paper_type || null;
  };

  const getPencilGrades = () => {
    if (!currentArtwork.pencil_grades || currentArtwork.pencil_grades.length === 0) {
      return null;
    }
    return currentArtwork.pencil_grades.join(', ');
  };

  const getCharcoalTypes = () => {
    if (!currentArtwork.charcoal_types || currentArtwork.charcoal_types.length === 0) {
      return null;
    }
    return currentArtwork.charcoal_types.join(', ');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

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
          {/* Top Metadata: Title/Caption, Time Taken - Above Image */}
          <div className="text-center mb-6 space-y-3">
            {/* Artwork Title */}
            {currentArtwork.title && (
              <div className="text-foreground text-lg font-normal leading-tight">
                {currentArtwork.title}
              </div>
            )}
            
            {/* Description / Concept */}
            {currentArtwork.description && (
              <div className="text-foreground/60 text-sm font-inter font-normal leading-relaxed">
                {currentArtwork.description}
              </div>
            )}
            
            {/* Time Taken to Complete */}
            {currentArtwork.time_taken && (
              <div className="text-foreground/60 text-xs font-inter">
                Time taken: {currentArtwork.time_taken}
              </div>
            )}
          </div>

          {/* Image Container */}
          <div
            ref={containerRef}
            className="relative flex items-center justify-center"
            onClick={handleClick}
          >
            <img
              ref={imageRef}
              src={currentArtwork.primary_image_url}
              alt={currentArtwork.title || 'Artwork'}
              className="max-w-full max-h-[55vh] object-contain transition-opacity duration-300 pointer-events-none"
            />
          </div>

          {/* Bottom Metadata: Copyright Credit, Date - Below Image */}
          <div className="text-center mt-6 space-y-2">
            {/* Copyright */}
            <div className="text-foreground/60 text-xs font-inter">
              {COPYRIGHT_TEXT}
            </div>
            
            {/* Date */}
            {currentArtwork.creation_date && (
              <div className="text-foreground/60 text-xs font-inter">
                Date: {formatDate(currentArtwork.creation_date)}
              </div>
            )}

            {/* Materials (optional) */}
            {(getPaperTypes() || getPencilGrades() || getCharcoalTypes()) && (
              <div className="text-foreground/60 text-xs font-inter space-y-0.5 pt-2">
                {getPaperTypes() && (
                  <div>Paper Types: {getPaperTypes()}</div>
                )}
                {getPencilGrades() && (
                  <div>Pencil Grades: {getPencilGrades()}</div>
                )}
                {getCharcoalTypes() && (
                  <div>Charcoal Types: {getCharcoalTypes()}</div>
                )}
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

      {/* Right Side Metadata Block - Aligned with top of image */}
      {imageRef.current && (
        <div 
          className="fixed right-8 z-[101] text-right pointer-events-none max-w-xs space-y-4"
          style={{
            top: `${imageRef.current.getBoundingClientRect().top}px`
          }}
        >
          {/* Artwork Title */}
          {currentArtwork.title && (
            <div className="text-foreground text-lg md:text-xl font-normal leading-tight">
              {currentArtwork.title}
            </div>
          )}
          
          {/* Description / Concept */}
          {currentArtwork.description && (
            <div className="text-foreground/60 text-sm font-inter font-normal leading-relaxed">
              {currentArtwork.description}
            </div>
          )}
          
          {/* Time Taken to Complete */}
          {currentArtwork.time_taken && (
            <div className="text-foreground/60 text-xs font-inter">
              Time taken: {currentArtwork.time_taken}
            </div>
          )}
        </div>
      )}

      {/* BOTTOM RIGHT CORNER - Materials Only */}
      <div className="fixed bottom-8 right-8 z-[101] text-foreground/60 text-xs font-inter leading-relaxed text-right pointer-events-none space-y-0.5">
        {/* Paper Types (from paper_type field) */}
        {getPaperTypes() && (
          <div>Paper Types: {getPaperTypes()}</div>
        )}
        
        {/* Pencil Grades (from pencil_grades field) */}
        {getPencilGrades() && (
          <div>Pencil Grades: {getPencilGrades()}</div>
        )}
        
        {/* Charcoal Types (from charcoal_types field) */}
        {getCharcoalTypes() && (
          <div>Charcoal Types: {getCharcoalTypes()}</div>
        )}
      </div>

      {/* BOTTOM LEFT CORNER - Artist Credit */}
      <div className="fixed bottom-8 left-8 z-[101] text-foreground/60 text-sm font-inter pointer-events-none">
        {ARTIST_NAME}
      </div>

      {/* BOTTOM CENTER - Copyright and Date */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[101] text-foreground/60 text-xs font-inter pointer-events-none text-center space-y-0.5">
        <div>{COPYRIGHT_TEXT}</div>
        {currentArtwork.creation_date && (
          <div>Date: {formatDate(currentArtwork.creation_date)}</div>
        )}
      </div>

      {/* Image Container */}
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center px-[10%]"
        onClick={handleClick}
      >
        <img
          ref={imageRef}
          src={currentArtwork.primary_image_url}
          alt={currentArtwork.title || 'Artwork'}
          className="max-w-full max-h-[85vh] object-contain transition-opacity duration-300 pointer-events-none"
        />
      </div>
    </div>
  );
};

export default ArtworkLightbox;
