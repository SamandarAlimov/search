import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchNavigation } from "@/components/SearchNavigation";
import { Clock, TrendingUp, Newspaper, Globe, Sparkles, ExternalLink, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNewsSearch } from "@/hooks/useNewsSearch";

const categories = [
  { id: "all", label: "All News", icon: Newspaper },
  { id: "technology", label: "Technology", icon: Globe },
  { id: "science", label: "Science", icon: Sparkles },
  { id: "business", label: "Business", icon: Globe },
  { id: "health", label: "Health", icon: Globe },
  { id: "sports", label: "Sports", icon: Globe },
  { id: "entertainment", label: "Entertainment", icon: Globe },
];

const News = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);

  const { search, isLoading, error, articles, aiSummary, trending } = useNewsSearch();

  useEffect(() => {
    search(query, activeCategory === "all" ? undefined : activeCategory);
  }, [query, activeCategory, search]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showSearch initialQuery={query} />
      <SearchNavigation activeFilter="news" />

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-6">
            {/* Categories */}
            <div className="glass-card rounded-2xl p-4">
              <h3 className="font-semibold text-foreground mb-4">Categories</h3>
              <nav className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      activeCategory === cat.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <cat.icon className="h-4 w-4" />
                    {cat.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Trending Topics */}
            {trending.length > 0 && (
              <div className="glass-card rounded-2xl p-4">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Trending Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {trending.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => navigate(`/news?q=${encodeURIComponent(topic)}`)}
                      className="px-3 py-1.5 text-xs rounded-full bg-accent hover:bg-primary hover:text-primary-foreground text-accent-foreground transition-colors"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* News Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-foreground">
                {query ? `News: "${query}"` : "Latest News"}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Real-time results
              </div>
            </div>

            {/* AI Summary */}
            {aiSummary && (
              <div className="glass-card rounded-2xl p-6 mb-6 border border-primary/10">
                <div className="flex items-center gap-2 text-sm font-medium text-primary mb-3">
                  <Sparkles className="h-4 w-4" />
                  AI News Summary
                </div>
                <p className="text-foreground">{aiSummary}</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="glass-card rounded-2xl p-6 border border-destructive/20 mb-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 text-destructive shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">News Search Error</h3>
                    <p className="text-muted-foreground text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="glass-card rounded-2xl overflow-hidden animate-pulse">
                    <div className="h-48 bg-muted" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-muted rounded w-1/4" />
                      <div className="h-6 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {articles.map((article) => (
                  <article
                    key={article.id}
                    className="glass-card rounded-2xl overflow-hidden hover:ring-1 hover:ring-primary/20 transition-all group cursor-pointer"
                    onClick={() => setSelectedArticle(article)}
                  >
                    {article.image && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                        <span className="absolute bottom-3 left-3 px-2 py-1 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                          {article.category}
                        </span>
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">{article.source}</span>
                        <span>•</span>
                        <span>{formatDate(article.publishedAt)}</span>
                      </div>
                      <h2 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h2>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {article.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {articles.length === 0 && !isLoading && !error && (
              <div className="text-center py-12">
                <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No news found. Try a different search.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Article Modal */}
      {selectedArticle && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedArticle(null)}
        >
          <div 
            className="glass-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedArticle.image && (
              <img
                src={selectedArticle.image}
                alt={selectedArticle.title}
                className="w-full h-64 object-cover"
              />
            )}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">{selectedArticle.source}</span>
                <span>•</span>
                <span>{formatDate(selectedArticle.publishedAt)}</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                {selectedArticle.title}
              </h2>
              <p className="text-muted-foreground">
                {selectedArticle.description}
              </p>
              
              {selectedArticle.content && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-foreground whitespace-pre-wrap">
                    {selectedArticle.content.substring(0, 1000)}...
                  </p>
                </div>
              )}

              <a
                href={selectedArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Read Full Article
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default News;
