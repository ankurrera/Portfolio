#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use service role key if available, otherwise fall back to publishable key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Note: Storage uploads typically require service role key to bypass RLS
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL and either:');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY (recommended for uploads), or');
  console.error('  - VITE_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  Warning: Using publishable key. If uploads fail, add SUPABASE_SERVICE_ROLE_KEY to .env\n');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// MIME type mapping for common image formats
const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

// Category mapping based on filenames
const categoryMapping = {
  'selected': ['selected-'],
  'commissioned': ['commissioned-', 'marie-'],
  'editorial': ['editorial-'],
  'personal': ['personal-', 'country-road', 'morning-fog', 'farmhouse', 'winter-landscape', 
               'lake-reflection', 'stone-wall', 'mountain-vista', 'wheat-field', 'barn-detail',
               'forest-path', 'autumn-trees', 'prairie-sunset']
};

function determineCategory(filename) {
  for (const [category, patterns] of Object.entries(categoryMapping)) {
    if (patterns.some(pattern => filename.toLowerCase().includes(pattern.toLowerCase()))) {
      return category;
    }
  }
  return 'personal'; // default category
}

async function uploadPhoto(filePath, category) {
  try {
    const fileBuffer = readFileSync(filePath);
    const fileName = basename(filePath);
    const fileExt = extname(fileName);
    const timestamp = Date.now();
    
    // Note: For WebP conversion, use sharp or canvas in production
    // For now, uploading original format
    const uploadPath = `${category}/${timestamp}-${fileName}`;

    console.log(`Uploading ${fileName} to ${uploadPath}...`);

    const mimeType = MIME_TYPES[fileExt.toLowerCase()] || `image/${fileExt.replace('.', '')}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('photos')
      .upload(uploadPath, fileBuffer, {
        contentType: mimeType,
        cacheControl: '31536000',
        upsert: false
      });

    if (uploadError) {
      // Check if file already exists
      if (uploadError.message.includes('already exists')) {
        console.log(`  ⚠️  File already exists, skipping: ${fileName}`);
        return null;
      }
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('photos')
      .getPublicUrl(uploadPath);

    // Get current max display order and z_index for the category
    const { data: maxOrderData } = await supabase
      .from('photos')
      .select('display_order, z_index')
      .eq('category', category)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxOrderData?.display_order ?? -1) + 1;
    const nextZIndex = (maxOrderData?.z_index ?? -1) + 1;

    // Calculate initial position for new photo
    const photosPerRow = 3;
    const photoWidth = 300;
    const photoHeight = 400;
    const gap = 20;
    const row = Math.floor(nextOrder / photosPerRow);
    const col = nextOrder % photosPerRow;
    
    const initialX = col * (photoWidth + gap);
    const initialY = row * (photoHeight + gap);

    // Insert into photos table
    const { error: insertError } = await supabase
      .from('photos')
      .insert({
        category,
        image_url: publicUrl,
        display_order: nextOrder,
        title: fileName.replace(fileExt, '').replace(/-/g, ' '),
        position_x: initialX,
        position_y: initialY,
        width: photoWidth,
        height: photoHeight,
        scale: 1.0,
        rotation: 0,
        z_index: nextZIndex,
        is_draft: false
      });

    if (insertError) throw insertError;

    console.log(`  ✓ Successfully uploaded and saved: ${fileName}`);
    return publicUrl;
  } catch (error) {
    console.error(`  ✗ Error uploading ${basename(filePath)}:`, error.message);
    return null;
  }
}

async function migratePhotos() {
  const galleryPath = join(__dirname, 'src', 'assets', 'gallery');
  
  console.log('Starting photo migration to Supabase...\n');
  
  if (!statSync(galleryPath).isDirectory()) {
    console.error('Gallery directory not found');
    process.exit(1);
  }

  const files = readdirSync(galleryPath);
  const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

  console.log(`Found ${imageFiles.length} images to migrate\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const file of imageFiles) {
    const filePath = join(galleryPath, file);
    const category = determineCategory(file);
    
    const result = await uploadPhoto(filePath, category);
    if (result === null) {
      skipCount++;
    } else if (result) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  console.log('\n=== Migration Summary ===');
  console.log(`Total files: ${imageFiles.length}`);
  console.log(`✓ Successfully uploaded: ${successCount}`);
  console.log(`⚠️  Skipped (already exists): ${skipCount}`);
  console.log(`✗ Failed: ${errorCount}`);
}

migratePhotos().catch(console.error);
