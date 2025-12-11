import PortfolioHeader from "@/components/PortfolioHeader";
import PortfolioFooter from "@/components/PortfolioFooter";
import PageLayout from "@/components/PageLayout";
import SEO from "@/components/SEO";

const Technical = () => {
  return (
    <PageLayout>
      <SEO 
        title="Technical | Raya"
        description="Technical photography work showcasing precision, detail, and craftsmanship."
        canonicalUrl="/technical"
      />
      <PortfolioHeader activeCategory="TECHNICAL" />
      <main id="main-content" className="min-h-screen pt-24 px-4 md:px-8 pb-16">
        <div className="max-w-[1200px] mx-auto">
          <h1 className="text-3xl md:text-4xl font-light tracking-wide mb-8 text-center">
            Technical
          </h1>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto">
            Technical photography work coming soon. This section will showcase precision, detail, and craftsmanship in photography.
          </p>
        </div>
      </main>
      <PortfolioFooter />
    </PageLayout>
  );
};

export default Technical;
