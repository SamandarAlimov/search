import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface RelatedSearchesProps {
  searches: string[];
  onSelect: (query: string) => void;
  className?: string;
}

export function RelatedSearches({ searches, onSelect, className }: RelatedSearchesProps) {
  if (searches.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-medium text-muted-foreground">Related searches</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {searches.map((search, index) => (
          <button
            key={index}
            onClick={() => onSelect(search)}
            className="flex items-center gap-3 p-3 rounded-lg bg-card hover:bg-accent transition-colors text-left group"
          >
            <Search className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            <span className="text-sm text-foreground group-hover:text-primary transition-colors truncate">
              {search}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
