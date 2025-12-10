import { Helmet } from "react-helmet";

interface SEOProps {
  title: string;
  description: string;
  canonicalUrl: string;
  ogType?: "website" | "article" | "profile";
  ogImage?: string;
  twitterCard?: "summary" | "summary_large_image";
  jsonLd?: object;
}

const SEO = ({
  title,
  description,
  canonicalUrl,
  ogType = "website",
  ogImage = "/og-image.jpg",
  twitterCard = "summary_large_image",
  jsonLd,
}: SEOProps) => {
  const siteUrl = "https://morganblake.com";
  const fullUrl = `${siteUrl}${canonicalUrl}`;
  const fullImageUrl = ogImage.startsWith("http") ? ogImage : `${siteUrl}${ogImage}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content="Ankur Bag Photography" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:image:alt" content={title} />
      <meta name="twitter:site" content="@morganblake.photo" />
      <meta name="twitter:creator" content="@morganblake.photo" />

      {/* Additional Meta Tags */}
      <meta name="author" content="Ankur Bag" />
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      
      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
