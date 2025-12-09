export type PhotoCategory = 'selected' | 'commissioned' | 'editorial' | 'personal';

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
 * - image_url: Public URL from Supabase storage
 * - display_order: Integer for ordering
 * - category: Enum (selected | commissioned | editorial | personal)
 * - position_x, position_y: Float - Position in pixels
 * - width, height: Float - Dimensions in pixels
 * - scale: Float - Scale factor (1.0 = 100%)
 * - rotation: Float - Rotation angle in degrees
 * - z_index: Integer - Layer ordering (higher = front)
 * - is_draft: Boolean - Draft vs published state
 * - layout_config: JSONB - Additional layout data
 * - created_at, updated_at: Timestamps
 */
export interface PhotoLayoutData {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  display_order: number;
  category: PhotoCategory;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
  z_index: number;
  is_draft: boolean;
  layout_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LayoutRevision {
  id: string;
  category: PhotoCategory;
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
