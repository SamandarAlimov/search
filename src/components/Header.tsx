import { Link, useNavigate } from "react-router-dom";
import { AlsamosLogo } from "./AlsamosLogo";
import { SearchBar } from "./SearchBar";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { User, Settings, Grid3X3, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  showSearch?: boolean;
  initialQuery?: string;
  className?: string;
}

export function Header({ showSearch = false, initialQuery = "", className }: HeaderProps) {
  const navigate = useNavigate();
  const { searchHistory, removeFromHistory, clearHistory } = useAuth();

  const handleSearch = (query: string, mode: "ai" | "web") => {
    navigate(`/search?q=${encodeURIComponent(query)}&mode=${mode}`);
  };

  return (
    <header className={cn("sticky top-0 z-50 glass border-b border-border/50", className)}>
      <div className="container mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="shrink-0">
          <AlsamosLogo size="sm" showText={!showSearch} />
        </Link>

        {/* Search Bar (when in results page) */}
        {showSearch && (
          <div className="flex-1 max-w-2xl mx-auto">
            <SearchBar
              onSearch={handleSearch}
              initialQuery={initialQuery}
              size="default"
              searchHistory={searchHistory}
              onDeleteHistoryItem={removeFromHistory}
              onClearAllHistory={clearHistory}
            />
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <ThemeToggle />
          
          <Link to="/advanced">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Advanced Search">
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          </Link>
          
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Grid3X3 className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Settings className="h-5 w-5" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="gap-2 ml-2"
            onClick={() => window.open("https://accounts.alsamos.com", "_blank")}
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Sign In</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
