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

const PortfolioHeader = ({ activeCategory, isAdminContext = false, topOffset = '0' }: PortfolioHeaderProps) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          to="/technical"
          className="text-[10px] md:text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors font-inter whitespace-nowrap"
          onMouseEnter={() => setHoveredItem('name')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          {hoveredItem === 'name' ? (
            <TextRoll duration={0.3} getEnterDelay={(i) => i * 0.02} getExitDelay={(i) => i * 0.02}>
              ANKUR
            </TextRoll>
          ) : (
            "ANKUR"
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
          {/* Technical link */}
          <Link
            to="/technical"
            onMouseEnter={() => setHoveredItem('technical')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`text-[10px] md:text-[11px] uppercase tracking-widest font-inter transition-colors whitespace-nowrap ${
              activeCategory === "TECHNICAL"
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground/80"
            }`}
          >
            {hoveredItem === 'technical' ? (
              <TextRoll duration={0.3} getEnterDelay={(i) => i * 0.02} getExitDelay={(i) => i * 0.02}>
                TECHNICAL
              </TextRoll>
            ) : (
              "TECHNICAL"
            )}
          </Link>

          {/* Artistic link */}
          <Link
            to="/artistic"
            onMouseEnter={() => setHoveredItem('artistic')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`text-[10px] md:text-[11px] uppercase tracking-widest font-inter transition-colors whitespace-nowrap ${
              activeCategory === "ARTISTIC"
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground/80"
            }`}
          >
            {hoveredItem === 'artistic' ? (
              <TextRoll duration={0.3} getEnterDelay={(i) => i * 0.02} getExitDelay={(i) => i * 0.02}>
                ARTISTIC
              </TextRoll>
            ) : (
              "ARTISTIC"
            )}
          </Link>

          {/* Photoshoots link */}
          <Link
            to="/photoshoots"
            onMouseEnter={() => setHoveredItem('photoshoots')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`text-[10px] md:text-[11px] uppercase tracking-widest font-inter transition-colors whitespace-nowrap ${
              activeCategory === "PHOTOSHOOTS"
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

          {/* Achievement link */}
          <Link
            to="/achievement"
            onMouseEnter={() => setHoveredItem('achievement')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`text-[10px] md:text-[11px] uppercase tracking-widest font-inter transition-colors whitespace-nowrap ${
              activeCategory === "ACHIEVEMENT"
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground/80"
            }`}
          >
            {hoveredItem === 'achievement' ? (
              <TextRoll duration={0.3} getEnterDelay={(i) => i * 0.02} getExitDelay={(i) => i * 0.02}>
                ACHIEVEMENT
              </TextRoll>
            ) : (
              "ACHIEVEMENT"
            )}
          </Link>
        
          {/* About link */}
          <Link
            to="/about"
            onMouseEnter={() => setHoveredItem('about')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`text-[10px] md:text-[11px] uppercase tracking-widest font-inter transition-colors whitespace-nowrap ${
              activeCategory === "ABOUT"
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground/80"
            }`}
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
              <nav className="flex flex-col items-center justify-center gap-6 px-8 pt-12">
                {/* Technical link */}
                <Link
                  to="/technical"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-lg uppercase tracking-widest font-inter transition-colors ${
                    activeCategory === "TECHNICAL" 
                      ? "text-foreground font-medium" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  TECHNICAL
                </Link>

                {/* Artistic link */}
                <Link
                  to="/artistic"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-lg uppercase tracking-widest font-inter transition-colors ${
                    activeCategory === "ARTISTIC" 
                      ? "text-foreground font-medium" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ARTISTIC
                </Link>

                {/* Photoshoots link */}
                <Link
                  to="/photoshoots"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-lg uppercase tracking-widest font-inter transition-colors ${
                    activeCategory === "PHOTOSHOOTS" 
                      ? "text-foreground font-medium" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  PHOTOSHOOTS
                </Link>

                {/* Achievement link */}
                <Link
                  to="/achievement"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-lg uppercase tracking-widest font-inter transition-colors ${
                    activeCategory === "ACHIEVEMENT" 
                      ? "text-foreground font-medium" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ACHIEVEMENT
                </Link>

                {/* Separator */}
                <div className="w-16 h-px bg-border"></div>

                {/* About Link */}
                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-lg uppercase tracking-widest font-inter transition-colors ${
                    activeCategory === "ABOUT" 
                      ? "text-foreground font-medium" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
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
