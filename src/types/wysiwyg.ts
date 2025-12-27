export interface PhotoPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
  zIndex: number;
}

/**
 * Complete photo data structure matching the Supabase photos table schema.
 * Includes all fields required for WYSIWYG editor functionality.
 * 
 * Database columns:
 * - id: UUID primary key
 * - title, description: Optional text fields
 * - image_url: Public URL from Supabase storage (web-optimized derivative)
 * - display_order: Integer for ordering
 * - position_x, position_y: Float - Position in pixels
 * - width, height: Float - Dimensions in pixels
 * - scale: Float - Scale factor (1.0 = 100%)
 * - rotation: Float - Rotation angle in degrees
 * - z_index: Integer - Layer ordering (higher = front)
 * - is_draft: Boolean - Draft vs published state
 * - layout_config: JSONB - Additional layout data
 * - caption: Optional descriptive text
 * - photographer_name: Name of photographer
 * - date_taken: Date photo was taken
 * - device_used: Camera/device used
 * - video_thumbnail_url: Optional thumbnail for videos
 * - original_file_url: Original uploaded file (byte-for-byte)
 * - original_width, original_height: Original dimensions
 * - original_mime_type: Original file MIME type
 * - original_size_bytes: Original file size
 * - year: Year created
 * - tags: Array of tags
 * - credits: Credits for collaborators
 * - camera_lens: Camera and lens info
 * - project_visibility: public, private, or unlisted
 * - external_links: Array of external links
 * - created_at, updated_at: Timestamps
 */
export interface PhotoLayoutData {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  display_order: number;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
  z_index: number;
  is_draft: boolean;
  layout_config: Json;
  caption: string | null;
  photographer_name: string | null;
  date_taken: string | null;
  device_used: string | null;
  video_thumbnail_url: string | null;
  original_file_url: string | null;
  original_width: number | null;
  original_height: number | null;
  original_mime_type: string | null;
  original_size_bytes: number | null;
  year: number | null;
  tags: string[] | null;
  credits: string | null;
  camera_lens: string | null;
  project_visibility: string | null;
  external_links: Json;
  created_at: string;
  updated_at: string;
}

// JSON type matching Supabase
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface LayoutRevision {
  id: string;
  revision_name: string;
  layout_data: PhotoLayoutData[];
  created_by: string | null;
  created_at: string;
}

export type EditorMode = 'edit' | 'preview';
export type DevicePreview = 'desktop' | 'tablet' | 'mobile';

export interface EditorState {
  mode: EditorMode;
  devicePreview: DevicePreview;
  snapToGrid: boolean;
  showGuides: boolean;
  gridSize: number;
}

export interface HistoryEntry {
  photos: PhotoLayoutData[];
  timestamp: number;
  description?: string;
}
