import { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  hasSidebar?: boolean;
}

/**
 * Top-level page layout component that ensures footer always appears below content.
 * Uses flexbox with min-height: 100vh to push footer to bottom even on short pages.
 * When hasSidebar is true, adds left margin on desktop to accommodate the vertical sidebar.
 */
const PageLayout = ({ children, hasSidebar = false }: PageLayoutProps) => {
  return (
    <div className={`flex flex-col min-h-screen ${hasSidebar ? 'md:ml-48' : ''}`}>
      {children}
    </div>
  );
};

export default PageLayout;
