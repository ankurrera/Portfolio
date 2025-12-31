import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Validates if a draft object contains meaningful form data
 * Returns true if at least one field has a non-empty value
 * Excludes canvas/UI state fields
 */
function hasMeaningfulFormData(obj: Record<string, unknown> | null | undefined): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Fields to exclude from validation (canvas/UI state)
  const excludedFields = new Set([
    'position_x', 'position_y', 'width', 'height', 
    'scale', 'rotation', 'z_index', 'layout_config',
    'display_order'
  ]);

  // Check each property for meaningful values
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      continue;
    }

    // Skip excluded fields
    if (excludedFields.has(key)) {
      continue;
    }

    const value = obj[key];

    // Check for non-empty strings
    if (typeof value === 'string' && value.trim().length > 0) {
      return true;
    }

    // Check for non-empty arrays
    if (Array.isArray(value) && value.length > 0) {
      // Check if array contains meaningful items
      const hasValidItems = value.some(item => {
        if (typeof item === 'string' && item.trim().length > 0) return true;
        if (typeof item === 'object' && item !== null && hasMeaningfulFormData(item as Record<string, unknown>)) return true;
        return false;
      });
      if (hasValidItems) return true;
    }

    // Check for boolean true (false is considered default/empty)
    if (typeof value === 'boolean' && value === true) {
      return true;
    }

    // Check for numbers (non-zero, excluding position/size fields)
    if (typeof value === 'number' && value !== 0) {
      return true;
    }

    // Recursively check nested objects
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if (hasMeaningfulFormData(value as Record<string, unknown>)) {
        return true;
      }
    }
  }

  return false;
}

interface UseFormDraftOptions<T> {
  /**
   * Unique key to identify the draft in localStorage
   * e.g., 'artwork_add_form_draft' or 'photoshoot_add_form_draft'
   */
  key: string;
  
  /**
   * The form data to persist
   */
  data: T;
  
  /**
   * Callback to restore the draft data
   */
  onRestore?: (data: T) => void;
  
  /**
   * Debounce delay in milliseconds (default: 500ms)
   */
  debounceMs?: number;
  
  /**
   * Enable/disable persistence (useful for conditionally enabling)
   * Default: true
   */
  enabled?: boolean;
}

interface UseFormDraftReturn {
  /**
   * Whether a draft was restored on mount
   */
  draftRestored: boolean;
  
  /**
   * Whether the draft is currently being saved
   */
  isSaving: boolean;
  
  /**
   * Clear the stored draft
   */
  clearDraft: () => void;
  
  /**
   * Manually save the current draft
   */
  saveDraft: () => void;
}

/**
 * Custom hook for persisting FORM data to localStorage with auto-save
 * This hook is specifically for form inputs (NOT canvas/UI state)
 * 
 * @example
 * ```tsx
 * const { draftRestored, clearDraft, isSaving } = useFormDraft({
 *   key: 'artwork_add_form_draft',
 *   data: formData,
 *   onRestore: (restored) => setFormData(restored),
 * });
 * ```
 */
export function useFormDraft<T extends Record<string, any>>({
  key,
  data,
  onRestore,
  debounceMs = 500,
  enabled = true,
}: UseFormDraftOptions<T>): UseFormDraftReturn {
  const [draftRestored, setDraftRestored] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restoredRef = useRef(false);

  // Restore draft on mount
  useEffect(() => {
    if (!enabled || restoredRef.current) return;

    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as T;
        
        // Validate that the draft contains meaningful form data
        const isValid = hasMeaningfulFormData(parsed);
        
        if (isValid) {
          // Only restore if draft contains meaningful data
          if (onRestore) {
            onRestore(parsed);
          }
          setDraftRestored(true);
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`[FormDraft] Restored valid draft for key: ${key}`);
          }
        } else {
          // Draft exists but is empty/invalid - clear it
          localStorage.removeItem(key);
          
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[FormDraft] Ignored empty/invalid draft for key: ${key}`);
          }
        }
        
        restoredRef.current = true;
      } else {
        // No stored draft, mark as initialized
        restoredRef.current = true;
      }
    } catch (error) {
      console.error('Failed to restore form draft:', error);
      // Clear corrupted data
      localStorage.removeItem(key);
      restoredRef.current = true;
    }
  }, [enabled, key, onRestore]);

  // Save draft with debouncing
  useEffect(() => {
    // Skip save on initial mount before restoration check completes
    if (!enabled || !restoredRef.current) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set saving indicator
    setIsSaving(true);

    // Debounce the save operation
    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        console.error('Failed to save form draft:', error);
      } finally {
        setIsSaving(false);
      }
    }, debounceMs);

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, key, enabled, debounceMs]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setDraftRestored(false);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[FormDraft] Cleared draft for key: ${key}`);
      }
    } catch (error) {
      console.error('Failed to clear form draft:', error);
    }
  }, [key]);

  // Manually save draft
  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save form draft:', error);
    }
  }, [key, data]);

  return {
    draftRestored,
    isSaving,
    clearDraft,
    saveDraft,
  };
}
