/**
 * Upload API Endpoint Factory
 * Creates Vercel serverless function handlers for image uploads
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parseMultipartFormData } from './multipartParser.js';
import { uploadAndOptimizeImage, UploadOptions } from './uploadHandler.js';
import { PageType, MAX_FILE_SIZE, ALLOWED_EXTENSIONS } from './imageUploadConfig.js';

// Rate limiting for uploads (more restrictive than email)
const uploadRequestLog = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_UPLOADS_PER_WINDOW = 20;

/**
 * Get a more reliable client identifier for rate limiting
 * Uses multiple headers and falls back to socket address
 * Note: For production at scale, consider using Redis/Vercel KV for distributed rate limiting
 */
function getClientIdentifier(req: VercelRequest): string {
  // In Vercel, x-forwarded-for is set by the load balancer and includes the real client IP
  // Use the first IP in the chain (the original client)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor).split(',');
    const clientIp = ips[0]?.trim();
    if (clientIp) {
      return clientIp;
    }
  }
  
  // Vercel also provides x-real-ip
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }
  
  // Fall back to socket address
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Check rate limit for uploads
 */
function checkUploadRateLimit(identifier: string): boolean {
  const now = Date.now();
  const userRequests = uploadRequestLog.get(identifier) || [];
  
  // Filter out old requests outside the window
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_UPLOADS_PER_WINDOW) {
    return false;
  }
  
  // Add current request
  recentRequests.push(now);
  uploadRequestLog.set(identifier, recentRequests);
  
  return true;
}

/**
 * Set CORS headers for the response
 */
function setCorsHeaders(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
}

export interface CreateUploadHandlerOptions {
  pageType: PageType;
  subType?: string;
  uploadOptions?: UploadOptions;
}

/**
 * Create an upload handler for a specific page type
 * 
 * @param options - Configuration for the upload handler
 * @returns Vercel serverless function handler
 */
export function createUploadHandler(options: CreateUploadHandlerOptions) {
  const { pageType, subType, uploadOptions = {} } = options;
  
  return async function handler(
    req: VercelRequest,
    res: VercelResponse
  ) {
    // Set CORS headers
    setCorsHeaders(res);
    
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        details: 'Only POST requests are allowed',
      });
    }
    
    try {
      // Rate limiting check using improved client identification
      const identifier = getClientIdentifier(req);
      
      if (!checkUploadRateLimit(identifier)) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests',
          details: 'Upload rate limit exceeded. Please wait before uploading more images.',
        });
      }
      
      // Check content type
      const contentType = req.headers['content-type'] || '';
      if (!contentType.includes('multipart/form-data')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid content type',
          details: 'Request must be multipart/form-data',
        });
      }
      
      // Parse the multipart form data
      let parsed;
      try {
        parsed = await parseMultipartFormData(req);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          error: 'Failed to parse form data',
          details: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        });
      }
      
      // Check if a file was uploaded
      if (parsed.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
          details: `Please upload an image file. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
        });
      }
      
      // Get the first file (single file upload)
      const file = parsed.files[0];
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        return res.status(400).json({
          success: false,
          error: 'File too large',
          details: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        });
      }
      
      // Get keepOriginal option from form fields or use default
      const keepOriginal = parsed.fields.keepOriginal === 'true' || uploadOptions.keepOriginal;
      
      // Process and upload the image
      const result = await uploadAndOptimizeImage(
        file.buffer,
        file.filename,
        file.mimeType,
        pageType,
        subType,
        { ...uploadOptions, keepOriginal }
      );
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      // Log success
      console.log(`Image uploaded successfully: ${result.data?.filename} to ${pageType}${subType ? '/' + subType : ''}`);
      
      return res.status(200).json(result);
      
    } catch (error) {
      console.error('Upload handler error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: 'An unexpected error occurred while processing the upload',
      });
    }
  };
}

/**
 * Create a batch upload handler for multiple files
 */
export function createBatchUploadHandler(options: CreateUploadHandlerOptions) {
  const { pageType, subType, uploadOptions = {} } = options;
  
  return async function handler(
    req: VercelRequest,
    res: VercelResponse
  ) {
    // Set CORS headers
    setCorsHeaders(res);
    
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        details: 'Only POST requests are allowed',
      });
    }
    
    try {
      // Rate limiting check using improved client identification
      const identifier = getClientIdentifier(req);
      
      if (!checkUploadRateLimit(identifier)) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests',
          details: 'Upload rate limit exceeded. Please wait before uploading more images.',
        });
      }
      
      // Parse the multipart form data
      let parsed;
      try {
        parsed = await parseMultipartFormData(req);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          error: 'Failed to parse form data',
          details: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        });
      }
      
      // Check if files were uploaded
      if (parsed.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files uploaded',
          details: `Please upload image files. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
        });
      }
      
      // Get keepOriginal option from form fields
      const keepOriginal = parsed.fields.keepOriginal === 'true' || uploadOptions.keepOriginal;
      
      // Process all files
      const results = await Promise.all(
        parsed.files.map(file => 
          uploadAndOptimizeImage(
            file.buffer,
            file.filename,
            file.mimeType,
            pageType,
            subType,
            { ...uploadOptions, keepOriginal }
          )
        )
      );
      
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      // Log results
      console.log(`Batch upload: ${successful.length} succeeded, ${failed.length} failed`);
      
      return res.status(200).json({
        success: true,
        data: {
          uploaded: successful.map(r => r.data),
          failed: failed.map(r => ({ error: r.error, details: r.details })),
          totalUploaded: successful.length,
          totalFailed: failed.length,
        },
      });
      
    } catch (error) {
      console.error('Batch upload handler error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: 'An unexpected error occurred while processing the uploads',
      });
    }
  };
}
