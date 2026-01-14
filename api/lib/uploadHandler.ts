/**
 * Image Upload Handler
 * Core upload and optimization logic for portfolio images
 */
import { v4 as uuidv4 } from 'uuid';
import { processImage } from './imageProcessor.js';
import { uploadToStorage } from './supabaseStorage.js';
import {
  PageType,
  getFolderPath,
  isValidMimeType,
  isValidExtension,
  isValidFileSize,
  STORAGE_BUCKETS,
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS,
  UploadResponse,
} from './imageUploadConfig.js';

/**
 * Sanitize filename to prevent path traversal and other security issues
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal characters and dangerous patterns
  let sanitized = filename
    .replace(/\.\./g, '') // Remove path traversal
    .replace(/[/\\]/g, '') // Remove slashes
    .replace(/[<>:"|?*]/g, '') // Remove Windows forbidden chars
    .replace(/[\x00-\x1f\x80-\x9f]/g, '') // Remove control characters
    .trim();
  
  // Extract just the filename without extension
  const lastDot = sanitized.lastIndexOf('.');
  const nameWithoutExt = lastDot > 0 ? sanitized.substring(0, lastDot) : sanitized;
  
  // Keep only alphanumeric, hyphens, and underscores
  const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_');
  
  // Return sanitized name (max 50 chars)
  return cleanName.substring(0, 50);
}

/**
 * Generate a unique filename for storage
 */
export function generateUniqueFilename(originalFilename: string): string {
  const sanitized = sanitizeFilename(originalFilename);
  const timestamp = Date.now();
  const uuid = uuidv4().slice(0, 8);
  
  return `${sanitized}_${timestamp}_${uuid}`;
}

/**
 * Validate uploaded file
 */
export function validateFile(
  buffer: Buffer,
  filename: string,
  mimeType: string
): { valid: boolean; error?: string } {
  // Check file size
  if (!isValidFileSize(buffer.length)) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }
  
  // Check MIME type
  if (!isValidMimeType(mimeType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: JPEG, PNG`,
    };
  }
  
  // Check file extension
  if (!isValidExtension(filename)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }
  
  return { valid: true };
}

export interface UploadOptions {
  /** Whether to keep the original file in the originals bucket */
  keepOriginal?: boolean;
  /** Optional custom filename (will be sanitized) */
  customFilename?: string;
}

/**
 * Upload and optimize an image
 * 
 * @param fileBuffer - The raw file buffer
 * @param filename - Original filename
 * @param mimeType - MIME type of the file
 * @param pageType - The page type (about, achievements, photoshoot, artistic)
 * @param subType - Sub type for about page (profile, education, experience)
 * @param options - Additional upload options
 * @returns Upload response with optimized image URL
 */
export async function uploadAndOptimizeImage(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string,
  pageType: PageType,
  subType?: string,
  options: UploadOptions = {}
): Promise<UploadResponse> {
  try {
    // Validate the file
    const validation = validateFile(fileBuffer, filename, mimeType);
    if (!validation.valid) {
      return {
        success: false,
        error: 'Validation failed',
        details: validation.error,
      };
    }
    
    // Get folder path for storage
    let folderPath: string;
    try {
      folderPath = getFolderPath(pageType, subType);
    } catch (error) {
      return {
        success: false,
        error: 'Invalid page configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
    
    // Generate unique filename
    const baseFilename = options.customFilename || filename;
    const uniqueFilename = generateUniqueFilename(baseFilename);
    
    // Process the image (resize and convert to WebP)
    const processed = await processImage(fileBuffer);
    
    // Upload optimized WebP to public bucket
    const optimizedPath = `${folderPath}/${uniqueFilename}.webp`;
    const { publicUrl: optimizedUrl, error: optimizedError } = await uploadToStorage(
      STORAGE_BUCKETS.optimized,
      optimizedPath,
      processed.buffer,
      'image/webp'
    );
    
    if (optimizedError || !optimizedUrl) {
      return {
        success: false,
        error: 'Upload failed',
        details: optimizedError?.message || 'Failed to upload optimized image',
      };
    }
    
    let originalUrl: string | undefined;
    
    // Optionally upload original to private bucket
    if (options.keepOriginal) {
      const extension = filename.slice(filename.lastIndexOf('.')).toLowerCase();
      const originalPath = `${folderPath}/${uniqueFilename}${extension}`;
      
      const { publicUrl, error: originalError } = await uploadToStorage(
        STORAGE_BUCKETS.originals,
        originalPath,
        fileBuffer,
        mimeType
      );
      
      if (originalError) {
        console.warn('Failed to upload original:', originalError.message);
        // Continue even if original upload fails - optimized is the priority
      } else if (publicUrl) {
        originalUrl = publicUrl;
      }
    }
    
    return {
      success: true,
      data: {
        optimizedUrl,
        originalUrl,
        filename: `${uniqueFilename}.webp`,
        width: processed.width,
        height: processed.height,
      },
    };
  } catch (error) {
    console.error('Upload and optimize error:', error);
    return {
      success: false,
      error: 'Processing failed',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
