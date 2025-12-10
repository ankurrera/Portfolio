const PortfolioFooter = () => {
  return (
    <footer className="relative z-10 max-w-[1600px] mx-auto px-3 md:px-5 pb-16 mt-20">
      <div className="text-center text-[10px] uppercase tracking-widest font-inter text-muted-foreground">
        <a
          href="mailto:ankurr.era@gmail.com"
          className="hover:text-foreground transition-colors"
        >
          E: ankurr.era@gmail.com
        </a>
        <span className="mx-2">/</span>
        <a
          href="tel:+919002278769"
          className="hover:text-foreground transition-colors"
        >
          M: +91 90022 78769
        </a>
        <span className="mx-2">/</span>
        <a
          href="https://www.instagram.com/ankurr.tf/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          I: @ankurr.tf
        </a>
      </div>
    </footer>
  );
};

export default PortfolioFooter;
