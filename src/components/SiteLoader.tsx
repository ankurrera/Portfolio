import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useGlobalImagePreloader } from "@/hooks/useGlobalImagePreloader";

interface SiteLoaderProps {
  children: React.ReactNode;
  /** Maximum time to wait for assets to load (in ms). Default: 10000ms */
  fallbackTimeout?: number;
  /** Minimum time to show the loader (in ms). Default: 500ms */
  minDisplayTime?: number;
}

// Session storage key to track if initial load has completed
const INITIAL_LOAD_KEY = "site-initial-load-complete";

// Transition duration in ms - must match CSS transition duration in index.html
const TRANSITION_DURATION_MS = 500;

/**
 * Hides the initial inline loader from index.html and reveals the content.
 * The loader is displayed immediately via index.html before React loads.
 * This component handles the transition when all assets are ready.
 */
const hideInitialLoader = () => {
  const initialLoader = document.getElementById("initial-loader");
  const root = document.getElementById("root");
  
  if (initialLoader) {
    initialLoader.classList.add("hidden");
    // Remove from DOM after transition completes
    setTimeout(() => {
      initialLoader.remove();
    }, TRANSITION_DURATION_MS);
  }
  
  if (root) {
    root.classList.remove("loading-hidden");
  }
};

/**
 * Check if this is the initial page load (not internal navigation)
 */
const getIsInitialLoad = (): boolean => {
  if (typeof window === "undefined") return true;
  return !sessionStorage.getItem(INITIAL_LOAD_KEY);
};

/**
 * Full-screen website loading animation that appears on initial site load.
 * Remains visible until ALL images from ALL pages are fully loaded and rendered.
 * 
 * This includes images from:
 * - About page (profile picture, education logos, experience logos)
 * - Photoshoot page (all photos)
 * - Artistic page (all artworks and process images)
 * - Achievement page (all certificates and previews)
 * 
 * The initial loader is rendered inline in index.html to prevent any flash of content.
 * This component manages the loading state and triggers the fade-out when ready.
 */
const SiteLoader = ({
  children,
  fallbackTimeout = 10000,
  minDisplayTime = 500,
}: SiteLoaderProps) => {
  // Compute isInitialLoad once on mount and store in ref to avoid re-computation
  const isInitialLoadRef = useRef<boolean>(getIsInitialLoad());
  const isInitialLoad = isInitialLoadRef.current;

  const [isVisible, setIsVisible] = useState(isInitialLoad);
  const [isContentVisible, setIsContentVisible] = useState(!isInitialLoad);
  
  const hasCompletedRef = useRef<boolean>(!isInitialLoad);

  // Memoize preloader options to prevent unnecessary re-renders
  const preloaderOptions = useMemo(() => ({
    fallbackTimeout,
    minDisplayTime,
    skip: !isInitialLoad,
  }), [fallbackTimeout, minDisplayTime, isInitialLoad]);

  // Use the global image preloader hook
  const { isLoading: isPreloading, progress, totalImages, loadedImages } = useGlobalImagePreloader(preloaderOptions);

  const finishLoading = useCallback(() => {
    // Prevent multiple calls
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;

    console.info(`[SiteLoader] Finishing loading, hiding initial loader`);

    // Hide the initial loader from index.html with fade-out
    hideInitialLoader();
    
    // Make content visible
    setIsContentVisible(true);
    
    // After fade-out animation completes, update visibility state
    setTimeout(() => {
      setIsVisible(false);
    }, TRANSITION_DURATION_MS);
  }, []);

  // Listen for preloader completion
  useEffect(() => {
    // For internal navigation, ensure loader is hidden immediately
    if (!isInitialLoad) {
      hideInitialLoader();
      return;
    }

    console.info(`[SiteLoader] Effect running: isPreloading=${isPreloading}, hasCompleted=${hasCompletedRef.current}`);

    // When preloading is complete, finish loading
    if (!isPreloading && !hasCompletedRef.current) {
      console.info(`[SiteLoader] Preloading complete: ${loadedImages}/${totalImages} images (${progress}%)`);
      finishLoading();
    }
  }, [isPreloading, isInitialLoad, finishLoading, loadedImages, totalImages, progress]);

  // Don't render wrapper if not needed (internal navigation)
  if (!isVisible) {
    return <>{children}</>;
  }

  // During initial load, render content but keep it hidden until all images are preloaded
  // The initial loader from index.html is already visible
  return (
    <div
      className={`transition-opacity duration-500 ease-out ${
        isContentVisible ? "opacity-100" : "opacity-0"
      }`}
      style={{ visibility: isContentVisible ? "visible" : "hidden" }}
    >
      {children}
    </div>
  );
};

export default SiteLoader;
