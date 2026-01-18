import { cn } from "@/lib/utils";
import { 
  Globe, 
  Image, 
  Video, 
  Newspaper, 
  MapPin, 
  ShoppingBag,
  Sparkles,
  Building2,
  BookOpen,
  FileText,
  Music,
  Gamepad2
} from "lucide-react";

interface SearchFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  className?: string;
  showExtended?: boolean;
}

const filters = [
  { id: "all", label: "All", icon: Globe, color: "from-blue-500 to-cyan-500" },
  { id: "ai", label: "AI Answers", icon: Sparkles, color: "from-purple-500 to-pink-500" },
  { id: "academic", label: "Academic", icon: BookOpen, color: "from-emerald-500 to-teal-500" },
  { id: "images", label: "Images", icon: Image, color: "from-green-500 to-emerald-500" },
  { id: "videos", label: "Videos", icon: Video, color: "from-red-500 to-orange-500" },
  { id: "news", label: "News", icon: Newspaper, color: "from-amber-500 to-yellow-500" },
  { id: "maps", label: "Maps", icon: MapPin, color: "from-teal-500 to-green-500" },
  { id: "shopping", label: "Shopping", icon: ShoppingBag, color: "from-pink-500 to-rose-500" },
  { id: "alsamos", label: "Alsamos", icon: Building2, color: "from-indigo-500 to-violet-500" },
];

const extendedFilters = [
  { id: "documents", label: "Documents", icon: FileText, color: "from-sky-500 to-blue-500" },
  { id: "music", label: "Music", icon: Music, color: "from-fuchsia-500 to-purple-500" },
  { id: "games", label: "Games", icon: Gamepad2, color: "from-lime-500 to-green-500" },
];

export function SearchFilters({ 
  activeFilter, 
  onFilterChange, 
  className,
  showExtended = false 
}: SearchFiltersProps) {
  const allFilters = showExtended ? [...filters, ...extendedFilters] : filters;

  return (
    <div className={cn("flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-hide", className)}>
      {allFilters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;
        
        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={cn(
              "group relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200",
              "border border-transparent",
              isActive
                ? "bg-gradient-to-r text-white shadow-lg scale-105"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/80 hover:border-border"
            )}
            style={isActive ? {
              backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))`,
            } : undefined}
          >
            {/* Active gradient background */}
            {isActive && (
              <div 
                className={cn(
                  "absolute inset-0 rounded-xl bg-gradient-to-r opacity-100",
                  filter.color
                )}
                style={{ zIndex: -1 }}
              />
            )}
            
            {/* Icon with glow effect when active */}
            <div className={cn(
              "relative",
              isActive && "drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
            )}>
              <Icon className={cn(
                "h-4 w-4 transition-transform duration-200",
                isActive ? "text-white" : "text-current",
                "group-hover:scale-110"
              )} />
            </div>
            
            <span className={cn(
              "transition-all duration-200",
              isActive ? "text-white font-semibold" : ""
            )}>
              {filter.label}
            </span>

            {/* Hover indicator dot */}
            {!isActive && (
              <span className={cn(
                "absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full transition-all duration-200",
                "bg-gradient-to-r opacity-0 group-hover:opacity-100",
                filter.color
              )} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// Compact version for mobile or minimal UI
export function SearchFiltersCompact({ 
  activeFilter, 
  onFilterChange, 
  className 
}: Omit<SearchFiltersProps, 'showExtended'>) {
  return (
    <div className={cn("flex items-center gap-1 overflow-x-auto scrollbar-hide", className)}>
      {filters.slice(0, 6).map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;
        
        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={cn(
              "flex items-center justify-center p-2.5 rounded-lg transition-all duration-200",
              isActive
                ? cn("bg-gradient-to-r text-white shadow-md", filter.color)
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
            title={filter.label}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}

// Card-style filter for homepage or prominent placement
export function SearchFiltersCards({ 
  activeFilter, 
  onFilterChange, 
  className 
}: Omit<SearchFiltersProps, 'showExtended'>) {
  return (
    <div className={cn("grid grid-cols-4 md:grid-cols-8 gap-2", className)}>
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;
        
        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-all duration-200",
              "border",
              isActive
                ? cn("bg-gradient-to-br text-white shadow-lg border-transparent", filter.color)
                : "text-muted-foreground hover:text-foreground bg-card hover:bg-accent border-border hover:border-primary/20"
            )}
          >
            <Icon className={cn(
              "h-5 w-5",
              isActive ? "text-white" : "text-current"
            )} />
            <span className={cn(
              "text-xs font-medium",
              isActive ? "text-white" : ""
            )}>
              {filter.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}