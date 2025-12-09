import { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
}

/**
 * Top-level page layout component that ensures footer always appears below content.
 * Uses flexbox with min-height: 100vh to push footer to bottom even on short pages.
 */
const PageLayout = ({ children }: PageLayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      {children}
    </div>
  );
};

export default PageLayout;
