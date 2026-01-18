import { ExternalLink, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface KnowledgePanelProps {
  title: string;
  subtitle?: string;
  description: string;
  image?: string;
  facts?: { label: string; value: string }[];
  links?: { label: string; url: string }[];
  source?: string;
  className?: string;
}

export function KnowledgePanel({
  title,
  subtitle,
  description,
  image,
  facts,
  links,
  source,
  className,
}: KnowledgePanelProps) {
  return (
    <aside className={cn("glass-card rounded-2xl overflow-hidden", className)}>
      {/* Image */}
      {image && (
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {description}
        </p>

        {/* Facts */}
        {facts && facts.length > 0 && (
          <div className="space-y-2 mb-4">
            {facts.map((fact, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground shrink-0">{fact.label}:</span>
                <span className="text-foreground">{fact.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Links */}
        {links && links.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {link.label}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        )}

        {/* Source */}
        {source && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-3 border-t border-border">
            <Info className="h-3 w-3" />
            <span>Source: {source}</span>
          </div>
        )}
      </div>
    </aside>
  );
}
