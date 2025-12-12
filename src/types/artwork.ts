// TypeScript types for artwork data structure

export type DimensionPreset = 'A4' | 'A3' | 'Custom';
export type DimensionUnit = 'cm' | 'in' | 'mm';

export interface ProcessImage {
  url: string;
  original_url?: string;
  caption?: string;
}

/**
 * Complete artwork data structure matching the Supabase artworks table schema.
 */
export interface ArtworkData {
  // Primary key
  id: string;
  
  // Core artwork information
  title: string;
  creation_date: string | null;
  description: string | null;
  
  // Dimensions
  dimension_preset: DimensionPreset | null;
  custom_width: number | null;
  custom_height: number | null;
  dimension_unit: DimensionUnit;
  
  // Materials used
  pencil_grades: string[] | null;
  charcoal_types: string[] | null;
  paper_type: string | null;
  
  // Additional metadata
  time_taken: string | null;
  tags: string[] | null;
  copyright: string;
  
  // Images
  primary_image_url: string;
  primary_image_original_url: string | null;
  primary_image_width: number | null;
  primary_image_height: number | null;
  process_images: ProcessImage[];
  
  // Display settings
  is_published: boolean;
  external_link: string | null;
  
  // WYSIWYG layout fields
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
  z_index: number;
  layout_config: Json;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// JSON type matching Supabase
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/**
 * Metadata form data for artwork creation/editing
 */
export interface ArtworkMetadata {
  title?: string;
  creation_date?: string;
  description?: string;
  dimension_preset?: DimensionPreset;
  custom_width?: number;
  custom_height?: number;
  dimension_unit?: DimensionUnit;
  pencil_grades?: string[];
  charcoal_types?: string[];
  paper_type?: string;
  time_taken?: string;
  tags?: string[];
  copyright?: string;
  external_link?: string;
}

/**
 * Default category/collection tags for artworks
 */
export const DEFAULT_ARTWORK_TAGS = [
  'Portrait sketch',
  'Landscape sketch',
  'Character design',
  'Concept sketch',
  'Fan art',
] as const;

/**
 * Available pencil grades
 */
export const PENCIL_GRADES = [
  '9H', '8H', '7H', '6H', '5H', '4H', '3H', '2H', 'H',
  'F', 'HB',
  'B', '2B', '3B', '4B', '5B', '6B', '7B', '8B', '9B',
] as const;

/**
 * Available charcoal types
 */
export const CHARCOAL_TYPES = [
  'Compressed',
  'Vine',
  'White',
  'Willow',
  'Pencil',
] as const;

/**
 * Transform ArtworkData to GalleryImage format for display
 */
export interface ArtworkGalleryTransform {
  type: 'image';
  src: string;
  highResSrc: string;
  alt: string;
  photographer: string;
  client: string;
  location: string;
  details: string;
  width: number;
  height: number;
  position_x?: number;
  position_y?: number;
  scale?: number;
  rotation?: number;
  z_index?: number;
  caption?: string;
  photographer_name?: string;
  date_taken?: string;
  device_used?: string;
  camera_lens?: string;
  credits?: string;
}
