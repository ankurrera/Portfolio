// Default dimensions for photos when not specified
export const DEFAULT_PHOTO_WIDTH = 800;
export const DEFAULT_PHOTO_HEIGHT = 1000;

// Video upload constraints
export const MAX_VIDEO_SIZE_MB = 500;
export const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
export const MIN_VIDEO_DURATION_SECONDS = 10;
export const MAX_VIDEO_DURATION_SECONDS = 120;

export interface GalleryImage {
  type?: 'image' | 'video';
  src: string;
  videoSrc?: string;
  highResSrc?: string;
  alt: string;
  photographer?: string;
  client?: string;
  location?: string;
  details?: string;
  width?: number;
  height?: number;
  // WYSIWYG layout fields
  position_x?: number;
  position_y?: number;
  scale?: number;
  rotation?: number;
  z_index?: number;
  // Metadata fields
  caption?: string;
  photographer_name?: string;
  date_taken?: string;
  device_used?: string;
  camera_lens?: string;
  credits?: string;
  video_thumbnail_url?: string;
  // Video-specific fields
  video_duration_seconds?: number;
  video_width?: number;
  video_height?: number;
}

export interface Portrait {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}
