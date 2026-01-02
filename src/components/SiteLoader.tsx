import { useState, useEffect, useCallback, useRef } from "react";

interface SiteLoaderProps {
  children: React.ReactNode;
  /** Maximum time to wait for assets to load (in ms). Default: 10000ms */
  fallbackTimeout?: number;
  /** Minimum time to show the loader (in ms). Default: 500ms */
  minDisplayTime?: number;
}

// Session storage key to track if initial load has completed
const INITIAL_LOAD_KEY = "site-initial-load-complete";

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
    }, 500);
  }
  
  if (root) {
    root.classList.remove("loading-hidden");
  }
};

/**
 * Full-screen website loading animation that appears on initial site load.
 * Remains visible until all critical assets (images, fonts, above-the-fold content) are loaded.
 * 
 * The initial loader is rendered inline in index.html to prevent any flash of content.
 * This component manages the loading state and triggers the fade-out when ready.
 */
const SiteLoader = ({
  children,
  fallbackTimeout = 10000,
  minDisplayTime = 500,
}: SiteLoaderProps) => {
  const [isLoading, setIsLoading] = useState(() => {
    // Check if this is the initial load or a navigation
    if (typeof window !== "undefined") {
      return !sessionStorage.getItem(INITIAL_LOAD_KEY);
    }
    return true;
  });
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== "undefined") {
      return !sessionStorage.getItem(INITIAL_LOAD_KEY);
    }
    return true;
  });
  
  const startTimeRef = useRef<number>(Date.now());
  const hasLoadedRef = useRef<boolean>(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const finishLoading = useCallback(() => {
    // Prevent multiple calls
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const elapsed = Date.now() - startTimeRef.current;
    const remainingMinTime = Math.max(0, minDisplayTime - elapsed);

    // Wait for minimum display time before starting fade-out
    setTimeout(() => {
      setIsLoading(false);
      // Mark initial load as complete
      sessionStorage.setItem(INITIAL_LOAD_KEY, "true");
      // Hide the initial loader from index.html
      hideInitialLoader();
      
      // After fade-out animation completes, update visibility state
      setTimeout(() => {
        setIsVisible(false);
      }, 500); // Match the CSS transition duration
    }, remainingMinTime);
  }, [minDisplayTime]);

  useEffect(() => {
    // Skip if not initial load
    if (!isVisible) {
      // Ensure initial loader is hidden for internal navigation
      hideInitialLoader();
      return;
    }

    let fallbackTimer: ReturnType<typeof setTimeout>;
    let isMounted = true;

    const checkAllAssetsLoaded = () => {
      // Prevent execution if already finished or unmounted
      if (hasLoadedRef.current || !isMounted) return;
      
      // Check if document is ready
      if (document.readyState === "complete") {
        // Wait for all images to be loaded
        const images = Array.from(document.images);
        const imagePromises = images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            const handleLoad = () => {
              img.removeEventListener("load", handleLoad);
              img.removeEventListener("error", handleError);
              resolve();
            };
            const handleError = () => {
              img.removeEventListener("load", handleLoad);
              img.removeEventListener("error", handleError);
              resolve(); // Don't block on failed images
            };
            img.addEventListener("load", handleLoad);
            img.addEventListener("error", handleError);
          });
        });

        // Check for fonts loaded
        const fontsPromise = document.fonts?.ready || Promise.resolve();

        // Wait for all assets
        Promise.all([...imagePromises, fontsPromise])
          .then(() => {
            if (isMounted) {
              finishLoading();
            }
          })
          .catch(() => {
            // Fallback: finish loading even if some checks fail
            if (isMounted) {
              finishLoading();
            }
          });
      }
    };

    const handleDOMContentLoaded = () => {
      // Re-check after DOM is ready
      if (document.readyState === "complete") {
        checkAllAssetsLoaded();
      }
    };

    // Set up fallback timeout
    fallbackTimer = setTimeout(() => {
      console.warn("SiteLoader: Fallback timeout reached, finishing load");
      finishLoading();
    }, fallbackTimeout);

    // Check if already loaded
    if (document.readyState === "complete") {
      checkAllAssetsLoaded();
    } else {
      // Listen for load event
      window.addEventListener("load", checkAllAssetsLoaded);
    }

    // Also listen for DOMContentLoaded as an early signal
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", handleDOMContentLoaded);
    }

    // Store cleanup function
    cleanupRef.current = () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      window.removeEventListener("load", checkAllAssetsLoaded);
      document.removeEventListener("DOMContentLoaded", handleDOMContentLoaded);
    };

    return () => {
      cleanupRef.current?.();
    };
  }, [fallbackTimeout, finishLoading, isVisible]);

  // Don't render wrapper if not needed (internal navigation)
  if (!isVisible) {
    return <>{children}</>;
  }

  // During initial load, render content but keep it hidden
  // The initial loader from index.html is already visible
  return (
    <div
      className={`transition-opacity duration-500 ease-out ${
        isLoading ? "opacity-0" : "opacity-100"
      }`}
      style={{ visibility: isLoading ? "hidden" : "visible" }}
    >
      {children}
    </div>
  );
};

export default SiteLoader;
