import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import FocusTrap from "focus-trap-react";
import { TextRoll } from "@/components/ui/text-roll";

interface PortfolioHeaderProps {
  activeCategory: string;
  isAdminContext?: boolean;
  topOffset?: string;
}

const categories = [
  "SELECTED",
  "COMMISSIONED",
  "EDITORIAL",
  "PERSONAL",
];

const PortfolioHeader = ({ activeCategory, isAdminContext = false, topOffset = '0' }: PortfolioHeaderProps) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [photoshootsOpen, setPhotoshootsOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  return (
    <header 
      className={`fixed left-0 right-0 ${isAdminContext ? 'z-40' : 'z-50'} bg-background`}
      style={{ top: topOffset }}
    >
      <div className="max-w-[1600px] mx-auto flex items-center justify-between md:justify-center px-3 md:px-5 py-3 gap-3">
        <Link
          to="/"
          className="text-[10px] md:text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors font-inter whitespace-nowrap"
          onMouseEnter={() => setHoveredItem('name')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          {hoveredItem === 'name' ? (
            <TextRoll duration={0.3} getEnterDelay={(i) => i * 0.02} getExitDelay={(i) => i * 0.02}>
              MORGAN BLAKE
            </TextRoll>
          ) : (
            "MORGAN BLAKE"
          )}
        </Link>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-2 text-foreground/70 hover:text-foreground transition-colors"
          aria-label="Open navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          <Menu size={20} />
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-3">
          {/* Photoshoots dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setPhotoshootsOpen(true)}
            onMouseLeave={() => setPhotoshootsOpen(false)}
          >
            <Link
              to="/photoshoots"
              onMouseEnter={() => setHoveredItem('photoshoots')}
              onMouseLeave={() => setHoveredItem(null)}
              className={`text-[10px] md:text-[11px] uppercase tracking-widest font-inter transition-colors whitespace-nowrap ${
                categories.includes(activeCategory)
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground/80"
              }`}
            >
              {hoveredItem === 'photoshoots' ? (
                <TextRoll duration={0.3} getEnterDelay={(i) => i * 0.02} getExitDelay={(i) => i * 0.02}>
                  PHOTOSHOOTS
                </TextRoll>
              ) : (
                "PHOTOSHOOTS"
              )}
            </Link>
            
            {/* Dropdown menu */}
            {photoshootsOpen && (
              <div className="absolute left-0 top-full pt-2 z-50">
                <div className="bg-background border border-border shadow-lg min-w-[180px] py-2">
                  {categories.map((category) => (
                    <Link
                      key={category}
                      to={`/photoshoots/${category.toLowerCase()}`}
                      onMouseEnter={() => setHoveredItem(category)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`block px-4 py-2 text-[10px] md:text-[11px] uppercase tracking-widest font-inter transition-colors ${
                        activeCategory === category
                          ? "text-foreground font-medium bg-accent/5"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/5"
                      }`}
                    >
                      {hoveredItem === category ? (
                        <TextRoll duration={0.3} getEnterDelay={(i) => i * 0.02} getExitDelay={(i) => i * 0.02}>
                          {category}
                        </TextRoll>
                      ) : (
                        category
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        
        <Link
          to="/about"
          className="text-[10px] md:text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors font-inter whitespace-nowrap"
          onMouseEnter={() => setHoveredItem('about')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          {hoveredItem === 'about' ? (
            <TextRoll duration={0.3} getEnterDelay={(i) => i * 0.02} getExitDelay={(i) => i * 0.02}>
              ABOUT
            </TextRoll>
          ) : (
            "ABOUT"
          )}
        </Link>
      </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <FocusTrap>
            <div
              className="fixed inset-0 bg-background z-50 md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
            >
              {/* Close Button */}
              <div className="flex justify-end p-5">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-foreground/70 hover:text-foreground transition-colors"
                  aria-label="Close navigation menu"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Mobile Navigation Links */}
              <nav className="flex flex-col items-center justify-center gap-8 px-8 pt-12">
                {/* Photoshoots parent link */}
                <Link
                  to="/photoshoots"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg uppercase tracking-widest font-inter text-muted-foreground hover:text-foreground transition-colors"
                >
                  PHOTOSHOOTS
                </Link>

                {/* Categories as sub-items */}
                <div className="flex flex-col items-center gap-4 pl-4">
                  {categories.map((category) => (
                    <Link
                      key={category}
                      to={`/photoshoots/${category.toLowerCase()}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`text-base uppercase tracking-widest font-inter transition-colors ${
                        activeCategory === category
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {category}
                    </Link>
                  ))}
                </div>

                {/* Separator */}
                <div className="w-16 h-px bg-border"></div>

                {/* Page Links */}
                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors font-inter"
                >
                  ABOUT
                </Link>
              </nav>
            </div>
          </FocusTrap>
        )}
      </div>
    </header>
  );
};

export default PortfolioHeader;
