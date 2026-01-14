import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import formidable = require('formidable');
import sharp = require('sharp');
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';

// Supabase client setup using service role key for storage operations
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  });
}

// Valid page and section values
const VALID_PAGES = ['about', 'achievements', 'photoshoot', 'artistic'] as const;
const VALID_SECTIONS = ['profile', 'education', 'experience'] as const;
type Page = typeof VALID_PAGES[number];
type Section = typeof VALID_SECTIONS[number];

// Allowed file types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

// Max file size: 20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024;

// WebP quality and effort settings
const WEBP_QUALITY = 30;
const WEBP_EFFORT = 6;

// Max resize width
const MAX_WIDTH = 2000;

/**
 * Resolves the upload folder path based on page and section
 */
function resolveUploadPath(page: Page, section?: Section): string {
  if (page === 'about') {
    if (!section || !VALID_SECTIONS.includes(section)) {
      throw new Error('Section is required for "about" page (profile, education, or experience)');
    }
    return `about/${section}`;
  }
  return page;
}

/**
 * Sanitizes a filename by removing special characters
 */
function sanitizeFilename(filename: string): string {
  // Remove path components and get just the filename
  const baseName = path.basename(filename);
  // Remove extension
  const nameWithoutExt = baseName.replace(/\.[^/.]+$/, '');
  // Replace any non-alphanumeric characters (except hyphens and underscores) with underscores
  return nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
}

/**
 * Generates a unique filename with UUID prefix
 */
function generateUniqueFilename(originalFilename: string): string {
  const sanitized = sanitizeFilename(originalFilename);
  const uuid = uuidv4();
  const timestamp = Date.now();
  return `${uuid}-${timestamp}-${sanitized}.webp`;
}

/**
 * Validates the file type based on extension and MIME type
 */
function validateFileType(filename: string, mimetype: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  const isValidExtension = ALLOWED_EXTENSIONS.includes(ext);
  const isValidMime = ALLOWED_MIME_TYPES.includes(mimetype.toLowerCase());
  return isValidExtension && isValidMime;
}

/**
 * Processes the image: resizes and converts to WebP
 */
async function processImage(inputBuffer: Buffer): Promise<Buffer> {
  const image = sharp(inputBuffer);
  const metadata = await image.metadata();

  // Resize if width exceeds MAX_WIDTH, maintaining aspect ratio
  let pipeline = image;
  if (metadata.width && metadata.width > MAX_WIDTH) {
    pipeline = pipeline.resize(MAX_WIDTH, null, {
      withoutEnlargement: true,
      fit: 'inside',
    });
  }

  // Convert to WebP with specified quality and effort
  return pipeline
    .webp({
      quality: WEBP_QUALITY,
      effort: WEBP_EFFORT,
    })
    .toBuffer();
}

/**
 * Parses the multipart form data
 */
async function parseForm(req: VercelRequest): Promise<{
  file: formidable.File;
  page: string;
  section?: string;
}> {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: MAX_FILE_SIZE,
      allowEmptyFiles: false,
      filter: (part) => {
        // Only accept image files
        return part.mimetype?.startsWith('image/') || false;
      },
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE' || err.message?.includes('maxFileSize')) {
          reject(new Error(`File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`));
        } else {
          reject(err);
        }
        return;
      }

      // Get the file
      const fileField = files.file;
      const file = Array.isArray(fileField) ? fileField[0] : fileField;
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }

      // Get page and section from fields
      const pageField = fields.page;
      const page = Array.isArray(pageField) ? pageField[0] : pageField;
      if (!page) {
        reject(new Error('Page parameter is required'));
        return;
      }

      const sectionField = fields.section;
      const section = Array.isArray(sectionField) ? sectionField[0] : sectionField;

      resolve({ file, page, section: section || undefined });
    });
  });
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

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

  let tempFilePath: string | null = null;

  try {
    // Parse the form data
    const { file, page, section } = await parseForm(req);
    tempFilePath = file.filepath;

    // Validate page
    if (!VALID_PAGES.includes(page as Page)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid page',
        details: `Page must be one of: ${VALID_PAGES.join(', ')}`,
      });
    }

    // Validate section if page is "about"
    if (page === 'about' && (!section || !VALID_SECTIONS.includes(section as Section))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid section',
        details: 'Section is required for "about" page and must be one of: profile, education, experience',
      });
    }

    // Validate file type
    const originalFilename = file.originalFilename || 'unknown.jpg';
    const mimetype = file.mimetype || 'image/jpeg';
    if (!validateFileType(originalFilename, mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type',
        details: 'Only JPG, JPEG, and PNG files are allowed',
      });
    }

    // Read the file
    const fileBuffer = await fs.readFile(file.filepath);

    // Process the image (resize and convert to WebP)
    const processedImageBuffer = await processImage(fileBuffer);

    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(originalFilename);

    // Resolve upload path
    const uploadPath = resolveUploadPath(page as Page, section as Section | undefined);
    const fullPath = `${uploadPath}/${uniqueFilename}`;

    // Get Supabase client
    const supabase = getSupabaseClient();

    // Upload to portfolio-optimized bucket
    const { error: uploadError } = await supabase.storage
      .from('portfolio-optimized')
      .upload(fullPath, processedImageBuffer, {
        contentType: 'image/webp',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({
        success: false,
        error: 'Upload failed',
        details: 'Failed to upload image to storage',
      });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('portfolio-optimized')
      .getPublicUrl(fullPath);

    // Optional: Upload original to portfolio-originals bucket
    // Uncomment the following block if you want to keep originals
    /*
    const originalPath = `${uploadPath}/${uuidv4()}-${sanitizeFilename(originalFilename)}${path.extname(originalFilename)}`;
    await supabase.storage
      .from('portfolio-originals')
      .upload(originalPath, fileBuffer, {
        contentType: mimetype,
        upsert: false,
      });
    */

    // Clean up temp file
    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(() => {
        // Ignore cleanup errors
      });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      url: publicUrlData.publicUrl,
    });
  } catch (error) {
    // Clean up temp file on error
    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(() => {
        // Ignore cleanup errors
      });
    }

    console.error('Upload error:', error instanceof Error ? error.message : 'Unknown error');

    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('maxFileSize') || error.message.includes('File size exceeds')) {
        return res.status(400).json({
          success: false,
          error: 'File too large',
          details: `Maximum file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        });
      }

      if (error.message.includes('Missing Supabase configuration')) {
        return res.status(500).json({
          success: false,
          error: 'Server configuration error',
          details: 'Storage service is not properly configured',
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Upload failed',
        details: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: 'An unexpected error occurred',
    });
  }
}

// Disable body parsing to handle multipart form data manually
export const config = {
  api: {
    bodyParser: false,
  },
};
