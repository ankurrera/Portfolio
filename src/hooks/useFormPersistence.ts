import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Validates if a draft object contains meaningful data
 * Returns true if at least one field has a non-empty value
 */
function hasMeaningfulData(obj: any): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Check each property for meaningful values
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
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
        if (typeof item === 'object' && item !== null && hasMeaningfulData(item)) return true;
        return false;
      });
      if (hasValidItems) return true;
    }

    // Check for boolean true (false is considered default/empty)
    if (typeof value === 'boolean' && value === true) {
      return true;
    }

    // Check for numbers (non-zero)
    if (typeof value === 'number' && value !== 0) {
      return true;
    }

    // Recursively check nested objects
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if (hasMeaningfulData(value)) {
        return true;
      }
    }
  }

  return false;
}

interface UseFormPersistenceOptions<T> {
  /**
   * Unique key to identify the draft in localStorage
   * e.g., 'admin:technical_project:draft' or 'admin:project:draft:123'
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
   */
  enabled?: boolean;
}

interface UseFormPersistenceReturn {
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
  
  /**
   * Whether there is unsaved data
   */
  hasUnsavedChanges: boolean;
}

/**
 * Custom hook for persisting form data to localStorage with auto-save
 * 
 * @example
 * ```tsx
 * const { draftRestored, clearDraft, hasUnsavedChanges } = useFormPersistence({
 *   key: 'admin:technical_project:draft',
 *   data: formData,
 *   onRestore: (restored) => setFormData(restored),
 * });
 * ```
 */
export function useFormPersistence<T extends Record<string, any>>({
  key,
  data,
  onRestore,
  debounceMs = 500,
  enabled = true,
}: UseFormPersistenceOptions<T>): UseFormPersistenceReturn {
  const [draftRestored, setDraftRestored] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialDataRef = useRef<T | null>(null);
  const restoredRef = useRef(false);

  // Restore draft on mount
  useEffect(() => {
    if (!enabled || restoredRef.current) return;

    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as T;
        
        // Validate that the draft contains meaningful data
        const isValid = hasMeaningfulData(parsed);
        
        if (isValid) {
          // Only restore if draft contains meaningful data
          if (onRestore) {
            onRestore(parsed);
          }
          setDraftRestored(true);
          // Mark as having unsaved changes since there's a draft in localStorage
          // This ensures navigation protection works for restored drafts
          setHasUnsavedChanges(true);
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Draft] Restored valid draft for key: ${key}`);
          }
        } else {
          // Draft exists but is empty/invalid - clear it
          localStorage.removeItem(key);
          
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[Draft] Ignored empty/invalid draft for key: ${key}`);
          }
        }
        
        restoredRef.current = true;
      } else {
        // No stored draft, mark as initialized
        restoredRef.current = true;
      }
    } catch (error) {
      console.error('Failed to restore draft:', error);
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
        // Mark as having unsaved changes since we have a draft in localStorage
        setHasUnsavedChanges(true);
      } catch (error) {
        console.error('Failed to save draft:', error);
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
      setHasUnsavedChanges(false);
      setDraftRestored(false);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [key]);

  // Manually save draft
  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [key, data]);

  return {
    draftRestored,
    isSaving,
    clearDraft,
    saveDraft,
    hasUnsavedChanges,
  };
}
