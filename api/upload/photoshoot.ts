/**
 * Upload endpoint for Photoshoot page images (high-resolution)
 * POST /api/upload/photoshoot
 */
import { createUploadHandler } from '../lib/uploadEndpointFactory.js';

export default createUploadHandler({
  pageType: 'photoshoot',
  uploadOptions: {
    keepOriginal: true, // Keep originals for high-res photoshoot images
  },
});

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for multipart form data
  },
};
