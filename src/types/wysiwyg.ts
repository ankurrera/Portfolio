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

// JSON type matching Supabase
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/**
 * Complete photo data structure matching the Supabase photos table schema.
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
  layout_config: Json;
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
