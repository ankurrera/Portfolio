import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import FocusTrap from "focus-trap-react";
import { TextScramble } from "@/components/ui/text-scramble";

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
    <>
      {/* Left Vertical Sidebar for Desktop */}
      <aside 
        className={`hidden md:flex fixed left-0 top-0 bottom-0 ${isAdminContext ? 'z-40' : 'z-50'} bg-background border-r border-border w-48 flex-col py-8 px-6`}
        style={{ top: topOffset }}
      >
        {/* Logo/Name at top */}
        <Link
          to="/technical"
          className="text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors font-inter mb-12"
          onMouseEnter={() => setHoveredItem('name')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          {hoveredItem === 'name' ? (
            <TextScramble
              as="span"
              duration={0.6}
              speed={0.03}
              trigger={hoveredItem === 'name'}
              onScrambleComplete={() => {}}
            >
              ANKUR
            </TextScramble>
          ) : (
            "ANKUR"
          )}
        </Link>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-6">
          <Link
            to="/technical"
            onMouseEnter={() => setHoveredItem('technical')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`text-xs uppercase tracking-widest font-inter transition-colors ${
              activeCategory === "TECHNICAL"
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {hoveredItem === 'technical' ? (
              <TextScramble
                as="span"
                duration={0.6}
                speed={0.03}
                trigger={hoveredItem === 'technical'}
                onScrambleComplete={() => {}}
              >
                TECHNICAL
              </TextScramble>
            ) : (
              "TECHNICAL"
            )}
          </Link>

          <Link
            to="/artistic"
            onMouseEnter={() => setHoveredItem('artistic')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`text-xs uppercase tracking-widest font-inter transition-colors ${
              activeCategory === "ARTISTIC"
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {hoveredItem === 'artistic' ? (
              <TextScramble
                as="span"
                duration={0.6}
                speed={0.03}
                trigger={hoveredItem === 'artistic'}
                onScrambleComplete={() => {}}
              >
                ARTISTIC
              </TextScramble>
            ) : (
              "ARTISTIC"
            )}
          </Link>

          <Link
            to="/photoshoots"
            onMouseEnter={() => setHoveredItem('photoshoots')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`text-xs uppercase tracking-widest font-inter transition-colors ${
              activeCategory === "PHOTOSHOOTS"
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {hoveredItem === 'photoshoots' ? (
              <TextScramble
                as="span"
                duration={0.6}
                speed={0.03}
                trigger={hoveredItem === 'photoshoots'}
                onScrambleComplete={() => {}}
              >
                PHOTOSHOOTS
              </TextScramble>
            ) : (
              "PHOTOSHOOTS"
            )}
          </Link>

          <Link
            to="/achievement"
            onMouseEnter={() => setHoveredItem('achievement')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`text-xs uppercase tracking-widest font-inter transition-colors ${
              activeCategory === "ACHIEVEMENT"
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {hoveredItem === 'achievement' ? (
              <TextScramble
                as="span"
                duration={0.6}
                speed={0.03}
                trigger={hoveredItem === 'achievement'}
                onScrambleComplete={() => {}}
              >
                ACHIEVEMENT
              </TextScramble>
            ) : (
              "ACHIEVEMENT"
            )}
          </Link>

          <Link
            to="/about"
            onMouseEnter={() => setHoveredItem('about')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`text-xs uppercase tracking-widest font-inter transition-colors ${
              activeCategory === "ABOUT"
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {hoveredItem === 'about' ? (
              <TextScramble
                as="span"
                duration={0.6}
                speed={0.03}
                trigger={hoveredItem === 'about'}
                onScrambleComplete={() => {}}
              >
                ABOUT
              </TextScramble>
            ) : (
              "ABOUT"
            )}
          </Link>
        </nav>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <Link
            to="/technical"
            className="text-sm uppercase tracking-widest text-foreground font-inter"
          >
            ANKUR
          </Link>
          
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-foreground/70 hover:text-foreground transition-colors"
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

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

                <div className="w-16 h-px bg-border"></div>

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
    </>
  );
};

export default PortfolioHeader;
