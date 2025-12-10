import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  return (
    <nav aria-label="Breadcrumb" className="max-w-[1600px] mx-auto px-4 md:px-8 py-4">
      <ol className="flex items-center gap-2 text-xs text-muted-foreground">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {index > 0 && <ChevronRight size={12} className="text-muted-foreground/50" />}
            {item.href ? (
              <Link
                to={item.href}
                className="uppercase tracking-wider hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="uppercase tracking-wider text-foreground">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
