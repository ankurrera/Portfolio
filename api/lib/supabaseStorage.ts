/**
 * Supabase Storage Client
 * Server-side Supabase client for storage operations with service role key
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseAdmin: SupabaseClient | null = null;

/**
 * Get or create the Supabase admin client (with service role key)
 * Uses service role key for server-side operations with full access
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdmin) {
    return supabaseAdmin;
  }
  
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL environment variable');
  }
  
  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  
  return supabaseAdmin;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadToStorage(
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<{ publicUrl: string | null; error: Error | null }> {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType,
        upsert: true, // Overwrite if exists
      });
    
    if (error) {
      return { publicUrl: null, error: new Error(error.message) };
    }
    
    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return { publicUrl: urlData.publicUrl, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { publicUrl: null, error: new Error(message) };
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFromStorage(
  bucket: string,
  path: string
): Promise<{ error: Error | null }> {
  try {
    const supabase = getSupabaseAdmin();
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) {
      return { error: new Error(error.message) };
    }
    
    return { error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { error: new Error(message) };
  }
}
