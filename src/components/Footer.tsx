import { Instagram, Mail } from "lucide-react";

/**
 * Footer component used primarily in error states (ErrorBoundary).
 * Uses standard HTML <a> tags instead of React Router <Link> to ensure
 * it can render when Router context is unavailable.
 * Note: This causes full page reloads instead of client-side navigation,
 * but ensures the component works in error scenarios.
 */
const Footer = () => {
  return (
    <footer className="border-t border-border pt-16 pb-8 px-8">
      <h2 className="text-7xl md:text-9xl font-light tracking-tight text-center mb-12">
        Raya
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 max-w-7xl mx-auto">
        <nav className="flex flex-col gap-y-3">
          <a 
            href="/" 
            className="text-sm uppercase tracking-widest underline hover:no-underline transition-all duration-300"
          >
            Home
          </a>
          <a 
            href="/about" 
            className="text-sm uppercase tracking-widest underline hover:no-underline transition-all duration-300"
          >
            About
          </a>
        </nav>
        
        <div className="flex flex-col gap-y-3 md:items-end">
          <a
            href="https://instagram.com/raya.photo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm uppercase tracking-widest hover:opacity-60 transition-opacity duration-300 flex items-center gap-x-2 py-2"
            aria-label="Visit our Instagram page"
          >
            <Instagram className="w-5 h-5" />
            Instagram
          </a>
          <a
            href="mailto:hello@raya.photo"
            className="text-sm uppercase tracking-widest hover:opacity-60 transition-opacity duration-300 flex items-center gap-x-2 py-2"
            aria-label="Send us an email"
          >
            <Mail className="w-5 h-5" />
            Email
          </a>
          
          <p className="text-xs text-muted-foreground mt-8">
            Made with Vite + React
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
