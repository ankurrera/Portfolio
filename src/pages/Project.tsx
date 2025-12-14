import { Link, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageLayout from "@/components/PageLayout";
import SEO from "@/components/SEO";

const projectImages = [
  { src: "/og-preview.png", caption: "First Light on Summit Ridge" },
  { src: "/og-preview.png", caption: "Valley Mist" },
  { src: "/og-preview.png", caption: "Alpine Meadow" },
  { src: "/og-preview.png", caption: "Glacial Lake" },
  { src: "/og-preview.png", caption: "Ridge Line" },
  { src: "/og-preview.png", caption: "Morning Reflection" },
  { src: "/og-preview.png", caption: "Alpine Stream" },
  { src: "/og-preview.png", caption: "Golden Hour Peak" },
];

const Project = () => {
  const { slug } = useParams();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    "name": "Alpine Light",
    "description": "A collection of images capturing the ethereal quality of early morning light in mountain landscapes. These photographs explore the delicate balance between shadow and illumination in high-altitude environments.",
    "creator": {
      "@type": "Person",
      "name": "Ankur Bag",
      "url": "https://morganblake.com"
    },
    "about": {
      "@type": "Thing",
      "name": "Alpine Photography"
    },
    "image": projectImages.map((img) => ({
      "@type": "ImageObject",
      "contentUrl": `https://morganblake.com${img.src}`,
      "caption": img.caption,
      "creator": {
        "@type": "Person",
        "name": "Ankur Bag"
      }
    })),
    "datePublished": "2024",
    "inLanguage": "en-US"
  };

  return (
    <PageLayout>
      <SEO
        title="Alpine Light - Ankur Bag"
        description="A collection of images capturing the ethereal quality of early morning light in mountain landscapes. These photographs explore the delicate balance between shadow and illumination in high-altitude environments."
        canonicalUrl={`/project/${slug}`}
        ogType="article"
        jsonLd={jsonLd}
      />

      <Header />

      <main className="flex-1">
        <header className="px-8 py-20 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-6">
            Alpine Light
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            A collection of images capturing the ethereal quality of early morning light in mountain landscapes. 
            These photographs explore the delicate balance between shadow and illumination in high-altitude environments.
          </p>
        </header>

        <div className="flex flex-col gap-12 md:gap-16 lg:gap-20 py-20 animate-fade-in">
          {projectImages.map((image, index) => (
            <div key={index}>
              <img
                src={image.src}
                alt={image.caption}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
              <p className="px-8 py-4 text-sm text-muted-foreground italic">
                {image.caption}
              </p>
            </div>
          ))}
        </div>

        <Link
          to="/"
          className="flex items-center justify-between px-8 py-12 border-t border-border hover:bg-muted transition-all duration-300 group"
        >
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              More Work
            </p>
            <h2 className="text-2xl font-light tracking-tight group-hover:translate-x-2 transition-transform duration-300">
              View Gallery
            </h2>
          </div>
          <ArrowRight className="w-6 h-6 text-muted-foreground group-hover:translate-x-2 group-hover:text-foreground transition-all duration-300" />
        </Link>
      </main>

      <Footer />
    </PageLayout>
  );
};

export default Project;
