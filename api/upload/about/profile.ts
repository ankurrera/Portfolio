/**
 * Upload endpoint for About page profile picture
 * POST /api/upload/about/profile
 */
import { createUploadHandler } from '../../lib/uploadEndpointFactory.js';

export default createUploadHandler({
  pageType: 'about',
  subType: 'profile',
  uploadOptions: {
    keepOriginal: true,
  },
});

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for multipart form data
  },
};
