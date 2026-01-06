import { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Play, Video as VideoIcon, AlertCircle } from 'lucide-react';

interface VideoCardProps {
  src: string;
  poster?: string;
  alt: string;
  className?: string;
  onLoadedData?: () => void;
  isHovered?: boolean;
  // Global mute controller - when another video unmutes, this one should mute
  globalMuteSignal?: number;
  onUnmute?: () => void;
}

/**
 * VideoCard component for displaying videos in the gallery grid
 * 
 * Features:
 * - Autoplay with muted audio (required for mobile autoplay)
 * - Click/tap to toggle mute/unmute
 * - Loop playback
 * - Lazy loading with Intersection Observer
 * - Fallback play button for autoplay failures
 * - Video indicator badge
 * - Sound indicator when unmuted
 * - ARIA labels and keyboard accessibility
 */
export default function VideoCard({
  src,
  poster,
  alt,
  className = '',
  onLoadedData,
  isHovered = false,
  globalMuteSignal,
  onUnmute,
}: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);
  const [showSoundIndicator, setShowSoundIndicator] = useState(false);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInViewport(entry.isIntersecting);
        });
      },
      {
        rootMargin: '100px', // Start loading slightly before entering viewport
        threshold: 0.1,
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Handle global mute signal (mute when another video unmutes)
  useEffect(() => {
    if (globalMuteSignal !== undefined && !isMuted) {
      setIsMuted(true);
      if (videoRef.current) {
        videoRef.current.muted = true;
      }
    }
  }, [globalMuteSignal, isMuted]);

  // Attempt autoplay when video enters viewport
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isInViewport || !isLoaded) return;

    const attemptPlay = async () => {
      try {
        video.muted = true; // Ensure muted for autoplay
        await video.play();
        setIsPlaying(true);
        setShowPlayButton(false);
      } catch (error) {
        console.warn('Autoplay failed:', error);
        setShowPlayButton(true);
        setIsPlaying(false);
      }
    };

    attemptPlay();
  }, [isInViewport, isLoaded]);

  // Pause when out of viewport to save resources
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isInViewport && isPlaying) {
      video.pause();
      setIsPlaying(false);
    }
  }, [isInViewport, isPlaying]);

  const handleLoadedData = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    onLoadedData?.();
  }, [onLoadedData]);

  const handleError = useCallback(() => {
    setHasError(true);
    setShowPlayButton(true);
  }, []);

  const handleToggleMute = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      // Unmuting - notify parent to mute other videos
      video.muted = false;
      setIsMuted(false);
      setShowSoundIndicator(true);
      onUnmute?.();
      
      // Hide sound indicator after 2 seconds
      setTimeout(() => setShowSoundIndicator(false), 2000);
    } else {
      // Muting
      video.muted = true;
      setIsMuted(true);
    }
  }, [isMuted, onUnmute]);

  const handlePlayButtonClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const video = videoRef.current;
    if (!video) return;

    try {
      video.muted = true; // Always start muted
      await video.play();
      setIsPlaying(true);
      setShowPlayButton(false);
    } catch (error) {
      console.error('Play failed:', error);
    }
  }, []);

  const handleRetry = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const video = videoRef.current;
    if (!video) return;

    setHasError(false);
    video.load();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggleMute(e);
    }
  }, [handleToggleMute]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      role="button"
      tabIndex={0}
      aria-label={`Video: ${alt}. ${isMuted ? 'Click to unmute' : 'Click to mute'}`}
      onClick={handleToggleMute}
      onKeyDown={handleKeyDown}
    >
      {/* Video element */}
      {isInViewport && (
        <video
          ref={videoRef}
          poster={poster}
          muted={isMuted}
          loop
          playsInline
          preload={isHovered ? 'auto' : 'metadata'}
          onLoadedData={handleLoadedData}
          onError={handleError}
          className={`w-full h-full object-contain transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source src={src} type="video/mp4" />
          <source src={src.replace('.mp4', '.webm')} type="video/webm" />
          Your browser does not support the video tag.
        </video>
      )}

      {/* Poster fallback when not in viewport or loading */}
      {(!isInViewport || !isLoaded) && poster && (
        <img
          src={poster}
          alt={alt}
          className="absolute inset-0 w-full h-full object-contain"
          loading="lazy"
        />
      )}

      {/* Video indicator badge (top-right) */}
      <div 
        className="absolute top-2 right-2 bg-black/60 text-white px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 pointer-events-none"
        aria-hidden="true"
      >
        <VideoIcon className="h-3 w-3" />
      </div>

      {/* Sound indicator */}
      {!isMuted && (
        <div 
          className={`absolute top-2 left-2 bg-black/60 text-white p-1.5 rounded-full transition-opacity duration-300 ${
            showSoundIndicator ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Sound on"
        >
          <Volume2 className="h-4 w-4" />
        </div>
      )}

      {/* Mute/unmute indicator on hover */}
      {isHovered && isLoaded && !showPlayButton && (
        <div className="absolute bottom-2 right-2 bg-black/60 text-white p-1.5 rounded-full pointer-events-none">
          {isMuted ? (
            <VolumeX className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Volume2 className="h-4 w-4" aria-hidden="true" />
          )}
        </div>
      )}

      {/* Play button overlay (for autoplay failures) */}
      {showPlayButton && !hasError && (
        <button
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
          onClick={handlePlayButtonClick}
          aria-label="Play video"
        >
          <div className="bg-white/90 rounded-full p-4">
            <Play className="h-8 w-8 text-black fill-current" />
          </div>
        </button>
      )}

      {/* Error state with retry */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p className="text-sm mb-2">Failed to load video</p>
          <button
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm transition-colors"
            onClick={handleRetry}
            aria-label="Retry loading video"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
