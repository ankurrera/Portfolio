import { useEffect } from 'react';

/**
 * Hook to warn users before leaving the page when there are unsaved changes
 * 
 * @param enabled - Whether to enable the warning
 * @param message - Optional custom message (note: most modern browsers show their own message)
 * 
 * @example
 * ```tsx
 * useBeforeUnload(hasUnsavedChanges, 'You have unsaved changes. Are you sure you want to leave?');
 * ```
 */
export function useBeforeUnload(enabled: boolean, message?: string) {
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Modern browsers ignore custom messages and show their own
      // But we still need to preventDefault and set returnValue
      e.preventDefault();
      e.returnValue = message || 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, message]);
}
