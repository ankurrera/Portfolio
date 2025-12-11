import PortfolioHeader from "@/components/PortfolioHeader";
import PortfolioFooter from "@/components/PortfolioFooter";
import PageLayout from "@/components/PageLayout";
import SEO from "@/components/SEO";

const Artistic = () => {
  return (
    <PageLayout>
      <SEO 
        title="Artistic | Raya"
        description="Artistic photography exploring creative expression and visual storytelling."
        canonicalUrl="/artistic"
      />
      <PortfolioHeader activeCategory="ARTISTIC" />
      <main id="main-content" className="min-h-screen pt-24 px-4 md:px-8 pb-16">
        <div className="max-w-[1200px] mx-auto">
          <h1 className="text-3xl md:text-4xl font-light tracking-wide mb-8 text-center">
            Artistic
          </h1>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto">
            Artistic photography coming soon. This section will explore creative expression and visual storytelling.
          </p>
        </div>
      </main>
      <PortfolioFooter />
    </PageLayout>
  );
};

export default Artistic;
