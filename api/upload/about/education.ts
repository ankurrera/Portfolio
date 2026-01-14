/**
 * Upload endpoint for About page education images
 * POST /api/upload/about/education
 */
import { createUploadHandler } from '../../lib/uploadEndpointFactory.js';

export default createUploadHandler({
  pageType: 'about',
  subType: 'education',
  uploadOptions: {
    keepOriginal: true,
  },
});

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for multipart form data
  },
};
