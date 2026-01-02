/**
 * Global Image Preloader Hook
 * 
 * This hook fetches all image URLs from all Supabase tables (photos, artworks, 
 * achievements, education, about_experience, about_page) and preloads them 
 * before the website becomes visible.
 * 
 * Features:
 * - Fetches all image URLs from the database in parallel
 * - Preloads images using HTMLImageElement and decode() API
 * - Tracks loading progress for all images
 * - Includes fallback timeout to prevent infinite loading
 * - Only runs on initial site load, not on internal navigation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Session storage key to track if initial load has completed
const INITIAL_LOAD_KEY = 'site-initial-load-complete';

interface PreloaderState {
  isLoading: boolean;
  progress: number;
  totalImages: number;
  loadedImages: number;
  error: string | null;
}

interface UseGlobalImagePreloaderOptions {
  /** Maximum time to wait for all images to load (in ms). Default: 10000ms */
  fallbackTimeout?: number;
  /** Minimum time to show the loader (in ms). Default: 500ms */
  minDisplayTime?: number;
  /** Whether to skip preloading (for internal navigation). Default: auto-detect */
  skip?: boolean;
}

/**
 * Preload a single image and optionally decode it
 * Returns a promise that resolves when the image is fully loaded and decoded.
 * Always resolves (never rejects) to ensure loading continues even if some images fail.
 */
const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve) => {
    // Skip empty or invalid URLs
    if (!src || typeof src !== 'string' || src.trim() === '') {
      resolve();
      return;
    }

    const img = new Image();
    let hasRetried = false;
    
    const handleComplete = () => {
      // Try to decode the image for smoother rendering
      if (img.decode) {
        img.decode()
          .then(() => resolve())
          .catch(() => resolve()); // Still resolve on decode error
      } else {
        resolve();
      }
    };

    const handleError = () => {
      // If CORS failed, retry without crossOrigin attribute
      if (!hasRetried && img.crossOrigin) {
        hasRetried = true;
        const retryImg = new Image();
        retryImg.onload = handleComplete;
        retryImg.onerror = () => {
          console.warn(`[ImagePreloader] Failed to load: ${src}`);
          resolve(); // Don't block on failed images
        };
        retryImg.src = src;
        return;
      }
      // Don't block on failed images, just resolve
      console.warn(`[ImagePreloader] Failed to load: ${src}`);
      resolve();
    };

    img.onload = handleComplete;
    img.onerror = handleError;
    
    // Set crossOrigin for external images (like Supabase storage) to enable decode()
    // If this causes CORS issues, we'll retry without it
    img.crossOrigin = 'anonymous';
    img.src = src;
    
    // If image is already cached, it may already be complete
    if (img.complete) {
      handleComplete();
    }
  });
};

/**
 * Fetch all image URLs from all Supabase tables
 */
const fetchAllImageUrls = async (): Promise<string[]> => {
  const imageUrls: string[] = [];

  try {
    // Fetch all data in parallel for better performance
    const [
      photosResult,
      artworksResult,
      achievementsResult,
      educationResult,
      experienceResult,
      aboutPageResult,
    ] = await Promise.allSettled([
      // Photos
      supabase
        .from('photos')
        .select('image_url, original_file_url')
        .eq('is_draft', false),
      
      // Artworks
      supabase
        .from('artworks')
        .select('primary_image_url, primary_image_original_url, process_images')
        .eq('is_published', true),
      
      // Achievements
      supabase
        .from('achievements')
        .select('image_url, image_original_url')
        .eq('is_published', true),
      
      // Education
      supabase
        .from('education')
        .select('logo_url'),
      
      // About Experience
      supabase
        .from('about_experience')
        .select('logo_url'),
      
      // About Page (profile image)
      supabase
        .from('about_page')
        .select('profile_image_url')
        .limit(1),
    ]);

    // Process photos
    if (photosResult.status === 'fulfilled' && photosResult.value.data) {
      photosResult.value.data.forEach((photo) => {
        if (photo.image_url) imageUrls.push(photo.image_url);
        if (photo.original_file_url) imageUrls.push(photo.original_file_url);
      });
    }

    // Process artworks
    if (artworksResult.status === 'fulfilled' && artworksResult.value.data) {
      artworksResult.value.data.forEach((artwork) => {
        if (artwork.primary_image_url) imageUrls.push(artwork.primary_image_url);
        if (artwork.primary_image_original_url) imageUrls.push(artwork.primary_image_original_url);
        // Process images is a JSON array
        if (artwork.process_images && Array.isArray(artwork.process_images)) {
          artwork.process_images.forEach((processImg: { url?: string; original_url?: string }) => {
            if (processImg.url) imageUrls.push(processImg.url);
            if (processImg.original_url) imageUrls.push(processImg.original_url);
          });
        }
      });
    }

    // Process achievements
    if (achievementsResult.status === 'fulfilled' && achievementsResult.value.data) {
      achievementsResult.value.data.forEach((achievement) => {
        if (achievement.image_url) imageUrls.push(achievement.image_url);
        if (achievement.image_original_url) imageUrls.push(achievement.image_original_url);
      });
    }

    // Process education logos
    if (educationResult.status === 'fulfilled' && educationResult.value.data) {
      educationResult.value.data.forEach((edu) => {
        if (edu.logo_url) imageUrls.push(edu.logo_url);
      });
    }

    // Process experience logos
    if (experienceResult.status === 'fulfilled' && experienceResult.value.data) {
      experienceResult.value.data.forEach((exp) => {
        if (exp.logo_url) imageUrls.push(exp.logo_url);
      });
    }

    // Process about page profile image
    if (aboutPageResult.status === 'fulfilled' && aboutPageResult.value.data) {
      const aboutData = aboutPageResult.value.data;
      // Handle array result from .limit(1)
      if (Array.isArray(aboutData) && aboutData.length > 0) {
        if (aboutData[0].profile_image_url) {
          imageUrls.push(aboutData[0].profile_image_url);
        }
      }
    }

  } catch (error) {
    console.error('[ImagePreloader] Error fetching image URLs:', error);
  }

  // Remove duplicates and filter out invalid URLs
  const uniqueUrls = [...new Set(imageUrls)].filter(
    (url) => url && typeof url === 'string' && url.trim() !== ''
  );

  console.info(`[ImagePreloader] Found ${uniqueUrls.length} unique images to preload`);
  return uniqueUrls;
};

/**
 * Custom hook for preloading all images across the entire website
 */
export const useGlobalImagePreloader = (options: UseGlobalImagePreloaderOptions = {}) => {
  const {
    fallbackTimeout = 10000,
    minDisplayTime = 500,
    skip: skipOption,
  } = options;

  // Determine if we should skip based on session storage
  const shouldSkip = skipOption ?? (
    typeof window !== 'undefined' && 
    sessionStorage.getItem(INITIAL_LOAD_KEY) === 'true'
  );

  const [state, setState] = useState<PreloaderState>({
    isLoading: !shouldSkip,
    progress: 0,
    totalImages: 0,
    loadedImages: 0,
    error: null,
  });

  const startTimeRef = useRef<number>(Date.now());
  const hasCompletedRef = useRef<boolean>(shouldSkip);
  const isMountedRef = useRef<boolean>(true);
  const loadedCountRef = useRef<number>(0);

  const completeLoading = useCallback(() => {
    if (hasCompletedRef.current || !isMountedRef.current) return;
    hasCompletedRef.current = true;

    const elapsed = Date.now() - startTimeRef.current;
    const remainingMinTime = Math.max(0, minDisplayTime - elapsed);

    // Wait for minimum display time before completing
    setTimeout(() => {
      if (isMountedRef.current) {
        // Mark initial load as complete in session storage
        sessionStorage.setItem(INITIAL_LOAD_KEY, 'true');
        setState((prev) => ({
          ...prev,
          isLoading: false,
          progress: 100,
        }));
      }
    }, remainingMinTime);
  }, [minDisplayTime]);

  useEffect(() => {
    // Skip if already completed or marked as skip
    if (shouldSkip) {
      setState({
        isLoading: false,
        progress: 100,
        totalImages: 0,
        loadedImages: 0,
        error: null,
      });
      return;
    }

    isMountedRef.current = true;
    loadedCountRef.current = 0;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

    const preloadAllImages = async () => {
      try {
        // Set fallback timeout
        fallbackTimer = setTimeout(() => {
          console.warn('[ImagePreloader] Fallback timeout reached');
          completeLoading();
        }, fallbackTimeout);

        // Fetch all image URLs from database
        const imageUrls = await fetchAllImageUrls();

        if (imageUrls.length === 0) {
          console.info('[ImagePreloader] No images to preload');
          clearTimeout(fallbackTimer);
          completeLoading();
          return;
        }

        if (isMountedRef.current) {
          setState((prev) => ({
            ...prev,
            totalImages: imageUrls.length,
          }));
        }

        // Reset loaded count ref
        loadedCountRef.current = 0;

        // Preload all images with progress tracking using atomic updates
        await Promise.all(
          imageUrls.map(async (url) => {
            await preloadImage(url);
            // Atomic increment using ref
            const newCount = ++loadedCountRef.current;
            
            if (isMountedRef.current) {
              setState((prev) => ({
                ...prev,
                loadedImages: newCount,
                progress: Math.round((newCount / imageUrls.length) * 100),
              }));
            }
          })
        );

        console.info(`[ImagePreloader] Successfully preloaded ${loadedCountRef.current}/${imageUrls.length} images`);
        clearTimeout(fallbackTimer);
        completeLoading();

      } catch (error) {
        console.error('[ImagePreloader] Error during preload:', error);
        clearTimeout(fallbackTimer);
        if (isMountedRef.current) {
          setState((prev) => ({
            ...prev,
            error: error instanceof Error ? error.message : 'Unknown error',
          }));
        }
        // Still complete loading even on error
        completeLoading();
      }
    };

    // Start preloading
    preloadAllImages();

    return () => {
      isMountedRef.current = false;
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
      }
    };
  }, [shouldSkip, fallbackTimeout, completeLoading]);

  return state;
};

export default useGlobalImagePreloader;
