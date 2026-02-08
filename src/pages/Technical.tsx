import PortfolioHeader from '@/components/PortfolioHeader';
import DynamicHero from '@/components/DynamicHero';
import PortfolioFooter from '@/components/PortfolioFooter';
import PageLayout from '@/components/PageLayout';
import MinimalProjects from '@/components/MinimalProjects';
import MinimalAbout from '@/components/MinimalAbout';
import MinimalContact from '@/components/MinimalContact';
import WorkCTA from '@/components/WorkCTA';

const Technical = () => {
  return (
    <PageLayout hasSidebar>
      <PortfolioHeader activeCategory="TECHNICAL" />
      
      <main className="flex-1">
        <DynamicHero 
          pageSlug="technical"
          fallbackTitle="Ankur Bag"
          fallbackSubtitle="FASHION PRODUCTION & PHOTOGRAPHY"
          fallbackDescription="Production photographer specializing in fashion, editorial, and commercial work. Creating compelling imagery for global brands and publications."
        />
        <MinimalProjects />
        <WorkCTA />
        <MinimalAbout />
        <MinimalContact />
      </main>
      
      <PortfolioFooter />
    </PageLayout>
  );
};

export default Technical;
