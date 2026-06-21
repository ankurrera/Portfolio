import { cn } from "@/lib/utils";

interface MHSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rect' | 'circle';
}

export function MHSkeleton({ className, variant = 'rect', ...props }: MHSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-neutral-200 dark:bg-neutral-800/60 relative overflow-hidden",
        // Shimmer effect overlay
        "after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent",
        variant === 'circle' && "rounded-full",
        variant === 'text' && "h-4 w-full rounded-sm",
        variant === 'rect' && "rounded-md",
        className
      )}
      {...props}
    />
  );
}
