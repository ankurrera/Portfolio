/**
 * Image Processing Utility
 * Handles image optimization using sharp library
 */
import sharp from 'sharp';
import { IMAGE_OPTIMIZATION } from './imageUploadConfig.js';

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
}

/**
 * Process and optimize an image buffer
 * - Resizes to max width of 2000px (maintains aspect ratio)
 * - Converts to WebP format
 * - Sets quality to 30
 * - Uses effort level 6 for compression
 */
export async function processImage(inputBuffer: Buffer): Promise<ProcessedImage> {
  try {
    // Get original image metadata
    const metadata = await sharp(inputBuffer).metadata();
    
    // Create sharp pipeline
    let pipeline = sharp(inputBuffer);
    
    // Resize if wider than max width, maintaining aspect ratio
    if (metadata.width && metadata.width > IMAGE_OPTIMIZATION.maxWidth) {
      pipeline = pipeline.resize({
        width: IMAGE_OPTIMIZATION.maxWidth,
        withoutEnlargement: true,
        fit: 'inside',
      });
    }
    
    // Convert to WebP with specified quality and effort
    pipeline = pipeline.webp({
      quality: IMAGE_OPTIMIZATION.quality,
      effort: IMAGE_OPTIMIZATION.effort,
    });
    
    // Process the image
    const outputBuffer = await pipeline.toBuffer();
    
    // Get output metadata
    const outputMetadata = await sharp(outputBuffer).metadata();
    
    return {
      buffer: outputBuffer,
      width: outputMetadata.width || 0,
      height: outputMetadata.height || 0,
      format: 'webp',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Image processing failed: ${message}`);
  }
}

/**
 * Get image metadata without processing
 */
export async function getImageMetadata(buffer: Buffer): Promise<sharp.Metadata> {
  return sharp(buffer).metadata();
}
