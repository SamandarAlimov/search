import { useState, useRef, useEffect } from "react";
import { Search, Mic, Camera, X, Sparkles, Globe, TrendingUp, Clock, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { VoiceSearchModal } from "@/components/VoiceSearchModal";
import { useAutocomplete } from "@/hooks/useAutocomplete";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SearchHistoryItem {
  id: string;
  query: string;
  mode: "ai" | "web";
  timestamp: string;
}

interface SearchBarProps {
  onSearch: (query: string, mode: "ai" | "web") => void;
  initialQuery?: string;
  size?: "default" | "large";
  autoFocus?: boolean;
  className?: string;
  searchHistory?: SearchHistoryItem[];
  onDeleteHistoryItem?: (id: string) => void;
  onClearAllHistory?: () => void;
}

const trendingSuggestions = [
  "What is quantum computing?",
  "Latest AI developments",
  "Climate change solutions",
  "How does blockchain work?",
  "Best programming languages 2024",
];

export function SearchBar({ 
  onSearch, 
  initialQuery = "", 
  size = "default",
  autoFocus = false,
  className,
  searchHistory = [],
  onDeleteHistoryItem,
  onClearAllHistory
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [mode, setMode] = useState<"ai" | "web">("ai");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { isListening, transcript, startListening, stopListening, isSupported: voiceSupported } = useVoiceSearch();
  const { suggestions, getSuggestions, clearSuggestions, isLoading: suggestionsLoading } = useAutocomplete();

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !isFocused) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFocused]);

  // Fetch autocomplete suggestions when query changes
  useEffect(() => {
    if (query.trim().length > 0 && isFocused) {
      getSuggestions(query);
    } else {
      clearSuggestions();
    }
    setSelectedIndex(-1);
  }, [query, isFocused, getSuggestions, clearSuggestions]);

  // Get recent history (limited to 5)
  const recentHistory = searchHistory.slice(0, 5);
  
  // When typing: show autocomplete suggestions
  // When empty with history: show history + trending
  // When empty without history: show trending only
  const hasHistory = recentHistory.length > 0;
  const displaySuggestions = query.trim() ? suggestions : (hasHistory ? recentHistory.map(h => h.query) : trendingSuggestions);
  const showTrendingSection = !query.trim() && hasHistory;
  
  const handleDeleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteHistoryItem?.(id);
  };

  const handleClearAllHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowClearConfirm(true);
  };

  const confirmClearAllHistory = () => {
    onClearAllHistory?.();
    setShowClearConfirm(false);
  };
  
  const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const totalItems = displaySuggestions.length + (showTrendingSection ? trendingSuggestions.length : 0);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth"
      });
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;
    
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < totalItems - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : totalItems - 1);
        break;
      case "Enter":
        if (selectedIndex >= 0) {
          e.preventDefault();
          const allItems = [...displaySuggestions, ...(showTrendingSection ? trendingSuggestions : [])];
          if (allItems[selectedIndex]) {
            handleSuggestionClick(allItems[selectedIndex]);
          }
        }
        break;
      case "Tab":
        if (totalItems > 0) {
          e.preventDefault();
          const nextIndex = e.shiftKey 
            ? (selectedIndex > 0 ? selectedIndex - 1 : totalItems - 1)
            : (selectedIndex < totalItems - 1 ? selectedIndex + 1 : 0);
          setSelectedIndex(nextIndex);
        }
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), mode);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion, mode);
    setShowSuggestions(false);
  };

  const clearQuery = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const handleVoiceSearch = () => {
    if (!voiceSupported) return;
    setVoiceModalOpen(true);
    startListening();
  };

  const handleVoiceSubmit = (voiceTranscript: string) => {
    stopListening();
    setQuery(voiceTranscript);
    onSearch(voiceTranscript, mode);
  };

  const isLarge = size === "large";

  return (
    <>
      <div ref={containerRef} className={cn("relative w-full max-w-2xl", className)}>
        <form onSubmit={handleSubmit}>
          <div
            className={cn(
              "search-container flex items-center gap-3",
              isLarge ? "px-6 py-4" : "px-4 py-3",
              isFocused && "ring-1 ring-primary/20"
            )}
          >
            {/* Mode Toggle */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setMode("ai")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all",
                  mode === "ai"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">AI</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("web")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all",
                  mode === "web"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Globe className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Web</span>
              </button>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-border shrink-0" />

            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                setIsFocused(true);
                setShowSuggestions(true);
              }}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder={mode === "ai" ? "Ask anything..." : "Search the web..."}
              className={cn(
                "search-input flex-1",
                isLarge ? "text-lg" : "text-base"
              )}
            />

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {query && (
                <button
                  type="button"
                  onClick={clearQuery}
                  className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {voiceSupported && (
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  className={cn(
                    "p-1.5 rounded-full transition-colors",
                    isListening
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Mic className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Camera className="h-4 w-4" />
              </button>
              <button
                type="submit"
                className={cn(
                  "p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
                  !query.trim() && "opacity-50 cursor-not-allowed"
                )}
                disabled={!query.trim()}
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>

        {/* Suggestions Dropdown */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-2 py-2 rounded-xl shadow-xl z-[100] animate-scale-in overflow-hidden border border-border bg-background dark:bg-[hsl(230,8%,8%)] max-h-[400px] overflow-y-auto">
            {/* Section Header */}
            <div className="px-3 py-1.5 flex items-center gap-2">
              {query.trim() ? (
                <>
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Suggestions
                  </span>
                  {suggestionsLoading && (
                    <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </>
              ) : hasHistory ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <History className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Recent Searches
                    </span>
                  </div>
                  {onClearAllHistory && (
                    <button
                      type="button"
                      onClick={handleClearAllHistory}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Trending Searches
                  </span>
                </>
              )}
            </div>

            {/* Main Suggestions (autocomplete or history) */}
            {displaySuggestions.map((suggestion, index) => {
              const historyItem = !query.trim() && hasHistory ? recentHistory[index] : null;
              return (
                <button
                  key={`main-${index}`}
                  ref={(el) => (suggestionRefs.current[index] = el)}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onMouseLeave={() => setSelectedIndex(-1)}
                  className={cn(
                    "w-full px-4 py-2.5 flex items-center gap-3 text-left transition-all duration-150 group",
                    selectedIndex === index 
                      ? "bg-accent/80 dark:bg-accent" 
                      : "hover:bg-accent/50"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150",
                    selectedIndex === index 
                      ? "bg-primary/10 text-primary" 
                      : "bg-muted/50 text-muted-foreground group-hover:bg-primary/5 group-hover:text-foreground"
                  )}>
                    {query.trim() ? (
                      <Search className="h-4 w-4" />
                    ) : hasHistory ? (
                      <Clock className="h-4 w-4" />
                    ) : (
                      <TrendingUp className="h-4 w-4" />
                    )}
                  </div>
                  <span className={cn(
                    "text-sm flex-1 transition-colors duration-150",
                    selectedIndex === index ? "text-foreground font-medium" : "text-foreground/80"
                  )}>
                    {suggestion}
                  </span>
                  <div className={cn(
                    "flex items-center gap-1.5 transition-opacity duration-150",
                    selectedIndex === index ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}>
                    {historyItem && onDeleteHistoryItem && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteHistoryItem(e, historyItem.id)}
                        className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Remove from history"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted rounded border border-border">
                      Enter
                    </kbd>
                  </div>
                </button>
              );
            })}

            {/* Trending Section (shown when history exists and no query) */}
            {showTrendingSection && (
              <>
                <div className="px-3 py-1.5 mt-2 flex items-center gap-2 border-t border-border pt-3">
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Trending
                  </span>
                </div>
                {trendingSuggestions.map((suggestion, index) => {
                  const actualIndex = displaySuggestions.length + index;
                  return (
                    <button
                      key={`trending-${index}`}
                      ref={(el) => (suggestionRefs.current[actualIndex] = el)}
                      onClick={() => handleSuggestionClick(suggestion)}
                      onMouseEnter={() => setSelectedIndex(actualIndex)}
                      onMouseLeave={() => setSelectedIndex(-1)}
                      className={cn(
                        "w-full px-4 py-2.5 flex items-center gap-3 text-left transition-all duration-150 group",
                        selectedIndex === actualIndex 
                          ? "bg-accent/80 dark:bg-accent" 
                          : "hover:bg-accent/50"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150",
                        selectedIndex === actualIndex 
                          ? "bg-primary/10 text-primary" 
                          : "bg-muted/50 text-muted-foreground group-hover:bg-primary/5 group-hover:text-foreground"
                      )}>
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <span className={cn(
                        "text-sm flex-1 transition-colors duration-150",
                        selectedIndex === actualIndex ? "text-foreground font-medium" : "text-foreground/80"
                      )}>
                        {suggestion}
                      </span>
                      <div className={cn(
                        "flex items-center gap-1.5 transition-opacity duration-150",
                        selectedIndex === actualIndex ? "opacity-100" : "opacity-0"
                      )}>
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted rounded border border-border">
                          Enter
                        </kbd>
                      </div>
                    </button>
                  );
                })}
              </>
            )}

            {query.trim() && displaySuggestions.length === 0 && !suggestionsLoading && (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                Press Enter to search for "{query}"
              </div>
            )}
          </div>
        )}

        {/* Keyboard shortcut hint */}
        {!isFocused && !query && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1 pointer-events-none">
            <kbd className="px-2 py-1 text-xs font-mono text-muted-foreground bg-muted rounded border border-border">
              /
            </kbd>
          </div>
        )}
      </div>

      {/* Voice Search Modal */}
      <VoiceSearchModal
        open={voiceModalOpen}
        onOpenChange={(open) => {
          setVoiceModalOpen(open);
          if (!open) stopListening();
        }}
        isListening={isListening}
        transcript={transcript}
        onSubmit={handleVoiceSubmit}
      />

      {/* Clear History Confirmation Dialog */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear search history?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your search history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearAllHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
