import PortfolioHeader from "@/components/PortfolioHeader";
import PortfolioFooter from "@/components/PortfolioFooter";
import PageLayout from "@/components/PageLayout";
import SEO from "@/components/SEO";

const Achievement = () => {
  return (
    <PageLayout>
      <SEO 
        title="Achievement | Raya"
        description="Awards, recognitions, and notable achievements in photography."
        canonicalUrl="/achievement"
      />
      <PortfolioHeader activeCategory="ACHIEVEMENT" />
      <main id="main-content" className="min-h-screen pt-24 px-4 md:px-8 pb-16">
        <div className="max-w-[1200px] mx-auto">
          <h1 className="text-3xl md:text-4xl font-light tracking-wide mb-8 text-center">
            Achievement
          </h1>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto">
            Achievements coming soon. This section will showcase awards, recognitions, and notable accomplishments.
          </p>
        </div>
      </main>
      <PortfolioFooter />
    </PageLayout>
  );
};

export default Achievement;
