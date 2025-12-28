import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a Supabase error object into a readable error message
 * Handles both PostgrestError and StorageError types
 * @param error - The error object from Supabase (PostgrestError, StorageError) or a standard Error instance
 * @returns A formatted error message string with details, code, and hints when available
 */
export function formatSupabaseError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    
    // Handle Supabase PostgrestError
    if (err.message && typeof err.message === 'string') {
      const parts: string[] = [err.message];
      
      if (err.code && typeof err.code === 'string') {
        parts.push(`(Code: ${err.code})`);
      }
      
      if (err.details && typeof err.details === 'string') {
        parts.push(`Details: ${err.details}`);
      }
      
      if (err.hint && typeof err.hint === 'string') {
        parts.push(`Hint: ${err.hint}`);
      }
      
      return parts.join(' ');
    }
    
    // Handle StorageError or other structured errors
    if (err.error && typeof err.error === 'string') {
      return err.error;
    }
    
    // Fallback: stringify the object
    try {
      return JSON.stringify(error);
    } catch {
      return 'An unknown error occurred';
    }
  }
  
  return String(error);
}

/**
 * Safely parses a fetch response, checking content-type before parsing as JSON
 * @param response - The fetch Response object
 * @returns A promise that resolves to the parsed data object
 */
export async function parseApiResponse(response: Response): Promise<Record<string, unknown>> {
  const contentType = response.headers.get('content-type');
  
  // First, get the response as text (which can always be done once)
  let text: string;
  try {
    text = await response.text();
  } catch (error) {
    return { error: 'Failed to read response body', details: error instanceof Error ? error.message : String(error) };
  }
  
  // If content-type indicates JSON, try to parse it
  if (contentType && contentType.toLowerCase().includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      // If JSON parsing fails, return the text as an error
      return { error: text || 'Failed to parse JSON response' };
    }
  } else {
    // If response is not JSON, return text as error
    return { error: text || 'Server returned non-JSON response' };
  }
}
