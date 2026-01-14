/**
 * Upload endpoint for Achievement page images
 * POST /api/upload/achievements
 */
import { createUploadHandler } from '../lib/uploadEndpointFactory.js';

export default createUploadHandler({
  pageType: 'achievements',
  uploadOptions: {
    keepOriginal: true,
  },
});

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for multipart form data
  },
};
