import PortfolioHeader from '@/components/PortfolioHeader';
import PhotographerBio from '@/components/PhotographerBio';
import PortfolioFooter from '@/components/PortfolioFooter';
import PageLayout from '@/components/PageLayout';
import MinimalProjects from '@/components/MinimalProjects';
import MinimalAbout from '@/components/MinimalAbout';
import MinimalContact from '@/components/MinimalContact';

const Technical = () => {
  return (
    <PageLayout>
      <PortfolioHeader activeCategory="TECHNICAL" />
      
      <main className="flex-1">
        <PhotographerBio />
        <MinimalProjects />
        <MinimalAbout />
        <MinimalContact />
      </main>
      
      <PortfolioFooter />
    </PageLayout>
  );
};

export default Technical;
