import { AlertCircle } from 'lucide-react';

interface DevErrorBannerProps {
  error: string | null;
  details?: string;
}

/**
 * Development mode error banner for visibility of fetch/load failures.
 * Only shows in development to help debug issues.
 */
const DevErrorBanner = ({ error, details }: DevErrorBannerProps) => {
  // Only show in development mode
  const isDev = import.meta.env.DEV;
  
  if (!isDev || !error) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-start gap-2">
        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Development Error</p>
          <p className="text-xs mt-0.5 break-words">{error}</p>
          {details && (
            <details className="mt-1">
              <summary className="text-xs cursor-pointer hover:underline">
                Technical Details
              </summary>
              <pre className="text-xs mt-1 overflow-auto max-h-32 bg-black/20 p-2 rounded">
                {details}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevErrorBanner;
