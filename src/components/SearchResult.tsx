import { ExternalLink, Play, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResultProps {
  title: string;
  url: string;
  description: string;
  favicon?: string;
  sitelinks?: { title: string; url: string }[];
  className?: string;
  onOpenEmbed?: (url: string, title: string) => void;
}

export function SearchResult({
  title,
  url,
  description,
  favicon,
  sitelinks,
  className,
  onOpenEmbed,
}: SearchResultProps) {
  const domain = new URL(url).hostname;

  // Check if URL can be embedded in-page
  const isEmbeddable = () => {
    const embeddableDomains = [
      'youtube.com', 'youtu.be',
      'vimeo.com',
      'twitter.com', 'x.com',
      'instagram.com',
      'tiktok.com',
      'dailymotion.com',
      'spotify.com',
      'soundcloud.com',
    ];
    return embeddableDomains.some(d => domain.includes(d));
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onOpenEmbed && isEmbeddable()) {
      e.preventDefault();
      onOpenEmbed(url, title);
    }
  };

  return (
    <article className={cn("result-card group", className)}>
      {/* URL and Favicon */}
      <div className="flex items-center gap-2 mb-1">
        {favicon ? (
          <img src={favicon} alt="" className="h-4 w-4 rounded" />
        ) : (
          <img
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
            alt=""
            className="h-4 w-4 rounded"
          />
        )}
        <span className="text-sm text-muted-foreground truncate">{domain}</span>
        {isEmbeddable() && onOpenEmbed && (
          <span className="inline-flex items-center gap-1 text-xs text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full">
            <Eye className="h-3 w-3" />
            View in-page
          </span>
        )}
      </div>

      {/* Title */}
      <a
        href={url}
        target={isEmbeddable() && onOpenEmbed ? undefined : "_blank"}
        rel="noopener noreferrer"
        onClick={handleClick}
        className="group/link inline-flex items-center gap-1 cursor-pointer"
      >
        <h3 className="text-lg font-medium text-primary group-hover/link:underline">
          {title}
        </h3>
        {isEmbeddable() && onOpenEmbed ? (
          <Play className="h-4 w-4 text-primary opacity-0 group-hover/link:opacity-100 transition-opacity" />
        ) : (
          <ExternalLink className="h-4 w-4 text-primary opacity-0 group-hover/link:opacity-100 transition-opacity" />
        )}
      </a>

      {/* Description */}
      <p className="mt-1 text-sm text-muted-foreground leading-relaxed line-clamp-2">
        {description}
      </p>

      {/* Sitelinks */}
      {sitelinks && sitelinks.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {sitelinks.slice(0, 4).map((link, index) => (
            <a
              key={index}
              href={link.url}
              onClick={(e) => {
                if (onOpenEmbed && isEmbeddable()) {
                  e.preventDefault();
                  onOpenEmbed(link.url, link.title);
                }
              }}
              target={isEmbeddable() && onOpenEmbed ? undefined : "_blank"}
              rel="noopener noreferrer"
              className="text-sm text-primary/80 hover:text-primary hover:underline"
            >
              {link.title}
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
