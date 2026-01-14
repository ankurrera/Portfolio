/**
 * Image Upload Configuration
 * Defines allowed file types, size limits, and folder mappings for the portfolio
 */

// Allowed MIME types for upload
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
] as const;

// Allowed file extensions (lowercase)
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'] as const;

// Maximum file size in bytes (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Image optimization settings
export const IMAGE_OPTIMIZATION = {
  maxWidth: 2000,
  format: 'webp' as const,
  quality: 30,
  effort: 6,
} as const;

// Supabase bucket names
export const STORAGE_BUCKETS = {
  originals: 'portfolio-originals',
  optimized: 'portfolio-optimized',
} as const;

// Page types and their folder mappings
export type PageType = 'about' | 'achievements' | 'photoshoot' | 'artistic';
export type AboutSubType = 'profile' | 'education' | 'experience';
export type SubType = AboutSubType | undefined;

// Folder path mapping per page type and sub type
export const FOLDER_PATHS: Record<PageType, Record<string, string> | string> = {
  about: {
    profile: 'about/profile',
    education: 'about/education',
    experience: 'about/experience',
  },
  achievements: 'achievements',
  photoshoot: 'photoshoot',
  artistic: 'artistic',
} as const;

/**
 * Get the folder path for a given page type and optional sub type
 */
export function getFolderPath(pageType: PageType, subType?: string): string {
  const path = FOLDER_PATHS[pageType];
  
  if (typeof path === 'string') {
    return path;
  }
  
  if (subType && path[subType]) {
    return path[subType];
  }
  
  throw new Error(`Invalid subType "${subType}" for pageType "${pageType}"`);
}

/**
 * Validate file type based on MIME type
 */
export function isValidMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType as typeof ALLOWED_MIME_TYPES[number]);
}

/**
 * Validate file extension
 */
export function isValidExtension(filename: string): boolean {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number]);
}

/**
 * Validate file size
 */
export function isValidFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * Upload response type
 */
export interface UploadResponse {
  success: boolean;
  data?: {
    optimizedUrl: string;
    originalUrl?: string;
    filename: string;
    width?: number;
    height?: number;
  };
  error?: string;
  details?: string;
}

/**
 * Error response type
 */
export interface ErrorResponse {
  success: false;
  error: string;
  details: string;
}
