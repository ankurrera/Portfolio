#!/usr/bin/env node
/**
 * Artwork Migration Script
 * 
 * This script migrates existing artistic photos from the photos table to the artworks table.
 * It should be run ONCE after deploying the artworks table migrations.
 * 
 * Usage:
 *   node migrate-artworks.mjs
 * 
 * Prerequisites:
 *   - Supabase migrations must be applied
 *   - Environment variables must be set (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🎨 Artwork Migration Script\n');
  console.log('This will migrate artistic photos from photos table to artworks table.\n');

  try {
    // Step 1: Check if artworks table exists
    console.log('1. Checking artworks table...');
    const { data: artworksCheck, error: checkError } = await supabase
      .from('artworks')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Error: artworks table does not exist. Please run migrations first.');
      console.error(checkError.message);
      process.exit(1);
    }
    console.log('✅ Artworks table exists\n');

    // Step 2: Count artistic photos
    console.log('2. Counting artistic photos...');
    const { count: photoCount, error: countError } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'artistic');
    
    if (countError) {
      console.error('❌ Error counting photos:', countError.message);
      process.exit(1);
    }
    console.log(`✅ Found ${photoCount} artistic photos\n`);

    if (photoCount === 0) {
      console.log('ℹ️  No artistic photos to migrate. Exiting.');
      return;
    }

    // Step 3: Check existing artworks count
    console.log('3. Checking existing artworks...');
    const { count: artworkCount, error: artworkCountError } = await supabase
      .from('artworks')
      .select('*', { count: 'exact', head: true });
    
    if (artworkCountError) {
      console.error('❌ Error counting artworks:', artworkCountError.message);
      process.exit(1);
    }
    console.log(`✅ Found ${artworkCount} existing artworks\n`);

    // Step 4: Execute migration function
    console.log('4. Running migration...');
    const { data: migrationResult, error: migrationError } = await supabase
      .rpc('migrate_artistic_photos_to_artworks');
    
    if (migrationError) {
      console.error('❌ Migration error:', migrationError.message);
      process.exit(1);
    }

    const result = migrationResult[0];
    console.log(`✅ Migration completed!`);
    console.log(`   - Migrated: ${result.migrated_count}`);
    console.log(`   - Skipped: ${result.skipped_count}`);
    console.log(`   - Total: ${result.total_count}\n`);

    // Step 5: Verify migration
    console.log('5. Verifying migration...');
    const { data: verificationData, error: verifyError } = await supabase
      .from('artistic_migration_verification')
      .select('*');
    
    if (verifyError) {
      console.error('❌ Verification error:', verifyError.message);
      process.exit(1);
    }

    console.log('✅ Verification results:');
    verificationData.forEach(row => {
      console.log(`   ${row.source_table}:`);
      console.log(`     - Record count: ${row.record_count}`);
      console.log(`     - Unique IDs: ${row.unique_ids}`);
      console.log(`     - Date range: ${row.earliest_date} to ${row.latest_date}`);
    });

    console.log('\n✨ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Review the migrated artworks in /admin/artistic/edit');
    console.log('2. Verify public display at /artistic');
    console.log('3. After verification, you can manually delete artistic photos from the photos table if needed');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
