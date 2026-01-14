/**
 * Upload endpoint for Artistic page images
 * POST /api/upload/artistic
 */
import { createUploadHandler } from '../lib/uploadEndpointFactory.js';

export default createUploadHandler({
  pageType: 'artistic',
  uploadOptions: {
    keepOriginal: true,
  },
});

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for multipart form data
  },
};
