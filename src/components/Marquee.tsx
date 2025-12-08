const Marquee = ({ text }: { text: string }) => {
  const repeatedText = Array(4).fill(text).join(" • ");
  
  return (
    <div className="py-8 border-t border-b border-border overflow-hidden">
      <div className="flex whitespace-nowrap animate-marquee-rtl">
        <span className="text-xl md:text-2xl font-light tracking-wide">
          {repeatedText}
        </span>
        <span className="text-xl md:text-2xl font-light tracking-wide ml-8">
          {repeatedText}
        </span>
      </div>
    </div>
  );
};

export default Marquee;
