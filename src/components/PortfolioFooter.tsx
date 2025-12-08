const PortfolioFooter = () => {
  return (
    <footer className="max-w-[1600px] mx-auto px-3 md:px-5 pb-16">
      <div className="text-center text-[10px] uppercase tracking-widest font-inter text-muted-foreground">
        <a
          href="mailto:hello@morganblake.com"
          className="hover:text-foreground transition-colors"
        >
          E: hello@morganblake.com
        </a>
        <span className="mx-2">/</span>
        <a
          href="tel:+442071234567"
          className="hover:text-foreground transition-colors"
        >
          M: +44 (0)20 7123 4567
        </a>
        <span className="mx-2">/</span>
        <a
          href="https://instagram.com/morganblake.photo"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          I: @morganblake.photo
        </a>
      </div>
    </footer>
  );
};

export default PortfolioFooter;
