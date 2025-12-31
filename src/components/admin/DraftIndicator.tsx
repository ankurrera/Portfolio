import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DraftIndicatorProps {
  /**
   * Whether a draft was restored on mount
   */
  draftRestored: boolean;
  
  /**
   * Whether the draft is currently being saved
   */
  isSaving: boolean;
  
  /**
   * Callback to discard the draft
   */
  onDiscard?: () => void;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Component to show draft save status and provide discard functionality
 */
export function DraftIndicator({ 
  draftRestored, 
  isSaving, 
  onDiscard,
  className 
}: DraftIndicatorProps) {
  const [showRestored, setShowRestored] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Show "Draft restored" message for 5 seconds when draft is restored
  useEffect(() => {
    if (draftRestored) {
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [draftRestored]);

  // Show "Draft saved" message briefly when saving completes
  useEffect(() => {
    if (!isSaving && (draftRestored || showSaved)) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSaving, draftRestored]);

  const handleDiscard = () => {
    if (onDiscard) {
      onDiscard();
      setShowRestored(false);
      setShowSaved(false);
    }
  };

  // Don't show anything if there's no activity
  if (!draftRestored && !isSaving && !showSaved && !showRestored) {
    return null;
  }

  return (
    <div className={cn(
      "flex items-center gap-2 text-sm",
      className
    )}>
      {showRestored && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md border border-blue-500/20">
          <CheckCircle2 className="h-4 w-4" />
          <span>Draft restored from previous session</span>
          {onDiscard && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDiscard}
              className="h-6 px-2 ml-2 text-xs hover:bg-blue-500/20"
            >
              Discard
            </Button>
          )}
        </div>
      )}
      
      {isSaving && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Saving draft...</span>
        </div>
      )}
      
      {!isSaving && showSaved && !showRestored && (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>Draft saved</span>
        </div>
      )}
    </div>
  );
}
