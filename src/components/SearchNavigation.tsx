import { useNavigate, useSearchParams } from "react-router-dom";
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
} from "lucide-react";

interface SearchNavigationProps {
  activeFilter?: string;
  className?: string;
}

const filters = [
  { id: "all", label: "All", icon: Globe, path: "/search", color: "from-blue-500 to-cyan-500" },
  { id: "ai", label: "AI Answers", icon: Sparkles, path: "/search", mode: "ai", color: "from-purple-500 to-pink-500" },
  { id: "academic", label: "Academic", icon: BookOpen, path: "/academic", color: "from-emerald-500 to-teal-500" },
  { id: "images", label: "Images", icon: Image, path: "/images", color: "from-green-500 to-emerald-500" },
  { id: "videos", label: "Videos", icon: Video, path: "/videos", color: "from-red-500 to-orange-500" },
  { id: "news", label: "News", icon: Newspaper, path: "/news", color: "from-amber-500 to-yellow-500" },
  { id: "maps", label: "Maps", icon: MapPin, path: "/maps", color: "from-teal-500 to-green-500" },
  { id: "shopping", label: "Shopping", icon: ShoppingBag, path: "/shopping", color: "from-pink-500 to-rose-500" },
  { id: "alsamos", label: "Alsamos", icon: Building2, path: "/search", mode: "alsamos", color: "from-indigo-500 to-violet-500" },
];

export function SearchNavigation({ activeFilter = "all", className }: SearchNavigationProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const handleFilterClick = (filter: typeof filters[0]) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (filter.mode) params.set("mode", filter.mode);
    
    const url = params.toString() ? `${filter.path}?${params.toString()}` : filter.path;
    navigate(url);
  };

  return (
    <div className={cn(
      "border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-14 z-40",
      className
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-hide">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.id;
            
            return (
              <button
                key={filter.id}
                onClick={() => handleFilterClick(filter)}
                className={cn(
                  "group relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200",
                  "border border-transparent",
                  isActive
                    ? "bg-gradient-to-r text-white shadow-lg scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/80 hover:border-border"
                )}
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
                
                {/* Icon */}
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
      </div>
    </div>
  );
}
