/**
 * Upload endpoint for About page experience images
 * POST /api/upload/about/experience
 */
import { createUploadHandler } from '../../lib/uploadEndpointFactory.js';

export default createUploadHandler({
  pageType: 'about',
  subType: 'experience',
  uploadOptions: {
    keepOriginal: true,
  },
});

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for multipart form data
  },
};
