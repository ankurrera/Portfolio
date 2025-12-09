// Default dimensions for photos when not specified
export const DEFAULT_PHOTO_WIDTH = 800;
export const DEFAULT_PHOTO_HEIGHT = 1000;

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
}

export interface Portrait {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}
