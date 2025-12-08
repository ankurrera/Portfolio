import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Instagram, Mail } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import FocusTrap from "focus-trap-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isMenuOpen]);

  return (
    <>
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      
      <header className="fixed top-0 left-0 right-0 z-50 py-6 px-8 flex items-center justify-between bg-background/90 backdrop-blur-sm">
        <nav className="hidden md:flex gap-x-8 text-sm uppercase tracking-widest">
          <Link to="/" className="hover:opacity-60 transition-opacity duration-300">
            Home
          </Link>
          <Link to="/about" className="hover:opacity-60 transition-opacity duration-300">
            About
          </Link>
        </nav>

        <Link 
          to="/" 
          className="text-2xl font-light tracking-wide absolute left-1/2 -translate-x-1/2"
        >
          Raya
        </Link>

        <div className="hidden md:flex gap-x-4 text-sm items-center">
          <ThemeToggle />
          <a
            href="https://instagram.com/raya.photo"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-60 transition-opacity duration-300 p-2 -m-2 inline-flex items-center justify-center"
            aria-label="Visit our Instagram page"
          >
            <Instagram className="w-6 h-6" />
          </a>
          <a
            href="mailto:hello@raya.photo"
            className="hover:opacity-60 transition-opacity duration-300 p-2 -m-2 inline-flex items-center justify-center"
            aria-label="Send us an email"
          >
            <Mail className="w-6 h-6" />
          </a>
        </div>

        <button
          ref={menuButtonRef}
          className="md:hidden p-2 -mr-2 z-50 inline-flex items-center justify-center"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
        >
          {isMenuOpen ? (
            <X className="w-7 h-7" />
          ) : (
            <div className="flex flex-col gap-y-1.5 w-7">
              <span className="h-0.5 w-full bg-foreground" />
              <span className="h-0.5 w-full bg-foreground" />
              <span className="h-0.5 w-full bg-foreground" />
            </div>
          )}
        </button>
      </header>

      {isMenuOpen && (
        <FocusTrap
          focusTrapOptions={{
            escapeDeactivates: false,
            allowOutsideClick: true,
            onDeactivate: () => setIsMenuOpen(false),
          }}
        >
          <div 
            id="mobile-menu"
            className="fixed inset-0 bg-background z-40 flex flex-col items-center justify-center gap-y-8"
            role="dialog"
            aria-modal="true"
            aria-label="Main navigation"
          >
            <nav>
              <Link
                to="/"
                className="text-3xl font-light tracking-tight hover:opacity-60 transition-opacity duration-300 block py-3"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/about"
                className="text-3xl font-light tracking-tight hover:opacity-60 transition-opacity duration-300 block py-3"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
            </nav>
            <div className="flex gap-x-6 mt-8 items-center">
              <ThemeToggle />
              <a
                href="https://instagram.com/raya.photo"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-60 transition-opacity duration-300 p-2 -m-2 inline-flex items-center justify-center"
                aria-label="Visit our Instagram page"
              >
                <Instagram className="w-7 h-7" />
              </a>
              <a
                href="mailto:hello@raya.photo"
                className="hover:opacity-60 transition-opacity duration-300 p-2 -m-2 inline-flex items-center justify-center"
                aria-label="Send us an email"
              >
                <Mail className="w-7 h-7" />
              </a>
            </div>
          </div>
        </FocusTrap>
      )}
    </>
  );
};

export default Header;
