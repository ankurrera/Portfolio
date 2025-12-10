import { Link } from "react-router-dom";
import PortfolioHeader from "@/components/PortfolioHeader";
import PhotographerBio from "@/components/PhotographerBio";
import PortfolioFooter from "@/components/PortfolioFooter";
import PageLayout from "@/components/PageLayout";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";

const Photoshoots = () => {
  const categories = [
    {
      slug: 'selected',
      title: 'Selected Works',
      description: 'Curated selection of luxury fashion campaigns and high-end editorial work showcasing contemporary minimalism and timeless elegance.',
    },
    {
      slug: 'commissioned',
      title: 'Commissioned Projects',
      description: 'Commercial fashion campaigns for luxury brands, featuring product photography with clean aesthetics and professional execution.',
    },
    {
      slug: 'editorial',
      title: 'Editorial Photography',
      description: 'Editorial fashion photography for leading publications, combining artistic vision with commercial excellence.',
    },
    {
      slug: 'personal',
      title: 'Personal Projects',
      description: 'Artistic personal projects exploring black and white photography, intimate portraiture, and creative experimentation.',
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Photoshoots - Ankur Bag",
    "description": "Explore photography collections including selected works, commissioned projects, editorial photography, and personal projects.",
    "url": "https://morganblake.com/photoshoots",
    "creator": {
      "@type": "Person",
      "name": "Ankur Bag"
    }
  };

  return (
    <PageLayout>
      <SEO
        title="Photoshoots - Ankur Bag"
        description="Explore photography collections including selected works, commissioned projects, editorial photography, and personal projects."
        canonicalUrl="/photoshoots"
        jsonLd={jsonLd}
      />

      <PortfolioHeader activeCategory="" />

      <main className="flex-1">
        <PhotographerBio />
        
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Photoshoots' }
          ]}
        />

        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-16">
          <h1 className="text-2xl md:text-3xl font-light uppercase tracking-widest mb-12 text-center">
            Photoshoots
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={`/photoshoots/${category.slug}`}
                className="group block p-8 border border-border hover:border-foreground/20 transition-all duration-300"
              >
                <h2 className="text-lg uppercase tracking-widest mb-4 text-foreground group-hover:text-foreground/80 transition-colors">
                  {category.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {category.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <PortfolioFooter />
    </PageLayout>
  );
};

export default Photoshoots;
