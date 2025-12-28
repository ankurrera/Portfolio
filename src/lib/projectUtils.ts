// Utility functions for Technical Projects

/**
 * Get the appropriate badge color class for a project status
 * @param status - The project status (Live, In Development, Testing, Paused)
 * @returns The Tailwind CSS class for the status badge color
 */
export const getStatusBadgeColor = (status: string | null): string => {
  const statusLower = status?.toLowerCase();
  switch (statusLower) {
    case 'live':
      return 'bg-success';
    case 'in development':
      return 'bg-warning';
    case 'testing':
      return 'bg-blue-500';
    case 'paused':
      return 'bg-destructive';
    default:
      return 'bg-muted-foreground';
  }
};

/**
 * Get the appropriate text color class for a project status
 * @param status - The project status
 * @returns The Tailwind CSS class for the status text color
 */
export const getStatusTextColor = (status: string | null): string => {
  const statusLower = status?.toLowerCase();
  switch (statusLower) {
    case 'live':
      return 'text-success';
    case 'paused':
      return 'text-destructive';
    default:
      return 'text-warning';
  }
};
