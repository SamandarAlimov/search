import { useNavigate, Link } from "react-router-dom";
import { AlsamosLogo } from "@/components/AlsamosLogo";
import { SearchBar } from "@/components/SearchBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";
import { UserMenu } from "@/components/UserMenu";
import { 
  Grid3X3, 
  Image, 
  Newspaper, 
  Video, 
  MapPin, 
  ShoppingBag,
  Sparkles,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const trendingSearches = [
  "Latest AI news",
  "Climate change 2024",
  "Quantum computing explained",
  "Best programming languages",
  "Space exploration updates",
];

const quickCategories = [
  { id: "all", label: "All", icon: Globe, color: "from-blue-500 to-cyan-500", path: "/search" },
  { id: "ai", label: "AI", icon: Sparkles, color: "from-purple-500 to-pink-500", path: "/search" },
  { id: "images", label: "Images", icon: Image, color: "from-green-500 to-emerald-500", path: "/images" },
  { id: "videos", label: "Videos", icon: Video, color: "from-red-500 to-orange-500", path: "/videos" },
  { id: "news", label: "News", icon: Newspaper, color: "from-amber-500 to-yellow-500", path: "/news" },
  { id: "maps", label: "Maps", icon: MapPin, color: "from-teal-500 to-green-500", path: "/search" },
  { id: "shopping", label: "Shopping", icon: ShoppingBag, color: "from-pink-500 to-rose-500", path: "/shopping" },
];

const Index = () => {
  const navigate = useNavigate();
  const { searchHistory, isAuthenticated, addToHistory, removeFromHistory, clearHistory } = useAuth();

  const handleSearch = (query: string, mode: "ai" | "web") => {
    addToHistory(query, mode);
    navigate(`/search?q=${encodeURIComponent(query)}&mode=${mode}`);
  };

  const handleCategoryClick = (category: typeof quickCategories[0]) => {
    if (category.id === "maps") {
      navigate(`/search?q=maps&mode=web`);
    } else if (category.path === "/search") {
      navigate(`/search?mode=${category.id === "ai" ? "ai" : "web"}`);
    } else {
      navigate(category.path);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Gradient */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "var(--gradient-hero)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 px-4 py-4 flex items-center justify-between">
        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link to="/images" className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Image className="h-4 w-4" />Images
          </Link>
          <Link to="/news" className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Newspaper className="h-4 w-4" />News
          </Link>
          <Link to="/videos" className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Video className="h-4 w-4" />Videos
          </Link>
        </nav>
        
        <div className="flex items-center gap-2 ml-auto">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hidden sm:flex">
            <Grid3X3 className="h-5 w-5" />
          </Button>
          <UserMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 -mt-10">
        {/* Logo */}
        <div className="mb-8 animate-fade-in">
          <AlsamosLogo size="xl" />
        </div>

        {/* Search Bar */}
        <div className="w-full max-w-2xl mb-6 animate-slide-up relative z-50" style={{ animationDelay: "0.1s" }}>
          <SearchBar
            onSearch={handleSearch}
            size="large"
            autoFocus
            searchHistory={searchHistory}
            onDeleteHistoryItem={removeFromHistory}
            onClearAllHistory={clearHistory}
          />
        </div>

        {/* Quick Category Filters */}
        <div className="w-full max-w-2xl mb-6 animate-fade-in relative z-10" style={{ animationDelay: "0.15s" }}>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {quickCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                  className={cn(
                    "group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium",
                    "bg-card/50 backdrop-blur-sm border border-border/50",
                    "hover:border-transparent hover:shadow-lg transition-all duration-200",
                    "hover:scale-105"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-lg bg-gradient-to-br",
                    category.color
                  )}>
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-foreground/80 group-hover:text-foreground transition-colors">
                    {category.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Trending / Recent Searches */}
        <div className="animate-fade-in relative z-10" style={{ animationDelay: "0.2s" }}>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">
              {isAuthenticated && searchHistory.length > 0 ? "Recent:" : "Trending:"}
            </span>
            {(isAuthenticated && searchHistory.length > 0 
              ? searchHistory.slice(0, 4).map(h => h.query)
              : trendingSearches.slice(0, 4)
            ).map((search, index) => (
              <button
                key={index}
                onClick={() => handleSearch(search, "ai")}
                className="px-3 py-1.5 text-sm rounded-full bg-accent hover:bg-primary hover:text-primary-foreground text-accent-foreground transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
