import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchNavigation } from "@/components/SearchNavigation";
import { AIResponse } from "@/components/AIResponse";
import { SearchResult } from "@/components/SearchResult";
import { RelatedSearches } from "@/components/RelatedSearches";
import { KnowledgePanel } from "@/components/KnowledgePanel";
import { EmbeddedContentViewer } from "@/components/EmbeddedContentViewer";
import { useRealSearch } from "@/hooks/useRealSearch";
import { useAuth } from "@/hooks/useAuth";
import { AlertCircle, Search as SearchIcon } from "lucide-react";

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const mode = (searchParams.get("mode") as "ai" | "web") || "ai";
  
  const [activeFilter, setActiveFilter] = useState("all");
  const { search, isLoading, data, error } = useRealSearch();
  const { addToHistory, isAuthenticated } = useAuth();
  
  // Embedded content viewer state
  const [embeddedContent, setEmbeddedContent] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (query) {
      const searchOptions = activeFilter !== "all" && activeFilter !== "ai" 
        ? { filter: activeFilter } 
        : undefined;
      search(query, mode, searchOptions);
      if (isAuthenticated) {
        addToHistory(query, mode);
      }
    }
  }, [query, mode, activeFilter, search]);

  const handleRelatedSearch = (relatedQuery: string) => {
    navigate(`/search?q=${encodeURIComponent(relatedQuery)}&mode=${mode}`);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    if (filter === "images") {
      navigate(`/images?q=${encodeURIComponent(query)}`);
    } else if (filter === "news") {
      navigate(`/news?q=${encodeURIComponent(query)}`);
    } else if (filter === "videos") {
      navigate(`/videos?q=${encodeURIComponent(query)}`);
    } else if (filter === "shopping") {
      navigate(`/shopping?q=${encodeURIComponent(query)}`);
    } else if (filter === "academic") {
      navigate(`/academic?q=${encodeURIComponent(query)}`);
    }
    // For other filters, stay on search page but re-search with filter
  };

  const handleOpenEmbed = (url: string, title: string) => {
    setEmbeddedContent({ url, title });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showSearch initialQuery={query} />

      <SearchNavigation activeFilter={activeFilter === "ai" ? "ai" : "all"} />

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex gap-8">
          <div className="flex-1 max-w-3xl space-y-6">
            {/* Search Info */}
            {!isLoading && data && (
              <p className="text-sm text-muted-foreground">
                {data.totalResults > 0 
                  ? `About ${data.totalResults.toLocaleString()} results from real websites`
                  : "Searching the web..."}
              </p>
            )}

            {/* AI Response */}
            {(activeFilter === "all" || activeFilter === "ai") && (
              <AIResponse
                content={data?.aiResponse || ""}
                sources={data?.sources || []}
                isLoading={isLoading}
              />
            )}

            {/* Real Web Results */}
            {!isLoading && data?.webResults && data.webResults.length > 0 && (
              <div className="space-y-4">
                {data.webResults.map((result, index) => (
                  <SearchResult
                    key={`${result.url}-${index}`}
                    title={result.title}
                    url={result.url}
                    description={result.description}
                    favicon={result.favicon}
                    onOpenEmbed={handleOpenEmbed}
                  />
                ))}
              </div>
            )}

            {/* No Results State */}
            {!isLoading && data?.webResults && data.webResults.length === 0 && (
              <div className="glass-card rounded-2xl p-8 text-center">
                <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try different keywords or check your spelling
                </p>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-4 space-y-3">
                    <div className="h-4 w-48 bg-muted rounded animate-shimmer" />
                    <div className="h-5 w-72 bg-muted rounded animate-shimmer" />
                    <div className="h-4 w-full bg-muted rounded animate-shimmer" />
                  </div>
                ))}
              </div>
            )}

            {/* Related Searches */}
            {!isLoading && data?.relatedSearches && data.relatedSearches.length > 0 && (
              <RelatedSearches
                searches={data.relatedSearches}
                onSelect={handleRelatedSearch}
              />
            )}

            {/* Error State */}
            {error && (
              <div className="glass-card rounded-2xl p-6 border border-destructive/20">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Search Error</h3>
                    <p className="text-muted-foreground text-sm mb-4">{error}</p>
                    <button
                      onClick={() => search(query, mode)}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Knowledge Panel */}
          <aside className="hidden lg:block w-80 shrink-0">
            {!isLoading && query && (
              <KnowledgePanel
                title={query}
                subtitle="Search Topic"
                description={`Explore comprehensive information about "${query}" from across the web, powered by Alsamos AI and real web search.`}
                facts={[
                  { label: "Search Mode", value: mode === "ai" ? "AI-Powered" : "Web Search" },
                  { label: "Real Results", value: `${data?.webResults?.length || 0} found` },
                  { label: "Sources", value: `${data?.sources?.length || 0} cited` },
                ]}
                links={[
                  { label: "Wikipedia", url: `https://wikipedia.org/wiki/${encodeURIComponent(query)}` },
                  { label: "News", url: `/news?q=${encodeURIComponent(query)}` },
                  { label: "Images", url: `/images?q=${encodeURIComponent(query)}` },
                  { label: "Videos", url: `/videos?q=${encodeURIComponent(query)}` },
                ]}
                source="Alsamos Search • Powered by Firecrawl"
              />
            )}
          </aside>
        </div>
      </main>

      <Footer />

      {/* Embedded Content Viewer */}
      {embeddedContent && (
        <EmbeddedContentViewer
          url={embeddedContent.url}
          title={embeddedContent.title}
          onClose={() => setEmbeddedContent(null)}
        />
      )}
    </div>
  );
};

export default Search;
