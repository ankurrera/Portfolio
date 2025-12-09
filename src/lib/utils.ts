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
