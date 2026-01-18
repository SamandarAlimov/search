import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchNavigation } from "@/components/SearchNavigation";
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Quote, 
  ExternalLink, 
  Sparkles, 
  AlertCircle,
  GraduationCap,
  FileText,
  Microscope,
  Brain,
  Heart,
  Cpu,
  Atom,
  FlaskConical,
  TrendingUp,
  Filter,
  Download,
  Eye,
  X,
  FileIcon,
  Loader2,
  BookmarkPlus,
  BookmarkCheck,
  BookMarked
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAcademicSearch, AcademicPaper } from "@/hooks/useAcademicSearch";
import { useReadingList } from "@/hooks/useReadingList";

const categories = [
  { id: "all", label: "All Fields", icon: GraduationCap },
  { id: "cs", label: "Computer Science", icon: Cpu },
  { id: "physics", label: "Physics", icon: Atom },
  { id: "biology", label: "Biology", icon: Microscope },
  { id: "medicine", label: "Medicine", icon: Heart },
  { id: "neuroscience", label: "Neuroscience", icon: Brain },
  { id: "chemistry", label: "Chemistry", icon: FlaskConical },
];

const sortOptions = [
  { id: "relevance", label: "Relevance" },
  { id: "date", label: "Most Recent" },
  { id: "citations", label: "Most Cited" },
];

const Academic = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");
const [selectedPaper, setSelectedPaper] = useState<AcademicPaper | null>(null);
  const [activeTab, setActiveTab] = useState<"abstract" | "pdf">("abstract");
  const [pdfLoading, setPdfLoading] = useState(false);

  const { search, isLoading, error, data } = useAcademicSearch();
  const { addPaper, removePaper, isPaperSaved } = useReadingList();

  useEffect(() => {
    if (query) {
      search(query, { 
        category: activeCategory === "all" ? undefined : activeCategory,
        sortBy 
      });
    }
  }, [query, activeCategory, sortBy, search]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Date unknown";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const getSourceBadge = (source: string) => {
    const styles = {
      arxiv: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
      pubmed: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    };
    return styles[source as keyof typeof styles] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showSearch initialQuery={query} />
      <SearchNavigation activeFilter="academic" />

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-6">
            {/* Categories */}
            <div className="glass-card rounded-2xl p-4">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                Research Fields
              </h3>
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

            {/* Sort Options */}
            <div className="glass-card rounded-2xl p-4">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Sort By
              </h3>
              <div className="space-y-1">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSortBy(opt.id)}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg text-sm text-left transition-colors",
                      sortBy === opt.id
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Related Topics */}
            {data?.relatedTopics && data.relatedTopics.length > 0 && (
              <div className="glass-card rounded-2xl p-4">
                <h3 className="font-semibold text-foreground mb-4">Related Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {data.relatedTopics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => navigate(`/academic?q=${encodeURIComponent(topic)}`)}
                      className="px-3 py-1.5 text-xs rounded-full bg-accent hover:bg-primary hover:text-primary-foreground text-accent-foreground transition-colors"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="glass-card rounded-2xl p-4">
              <h3 className="font-semibold text-foreground mb-4">Academic Resources</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate("/reading-list")}
                  className="w-full flex items-center gap-2 text-sm text-primary font-medium hover:text-primary/80 transition-colors"
                >
                  <BookMarked className="h-3 w-3" />
                  My Reading List
                </button>
                <div className="border-t border-border my-2" />
                <a
                  href={`https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Google Scholar
                </a>
                <a
                  href={`https://www.semanticscholar.org/search?q=${encodeURIComponent(query)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Semantic Scholar
                </a>
                <a
                  href={`https://arxiv.org/search/?query=${encodeURIComponent(query)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  arXiv
                </a>
                <a
                  href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(query)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  PubMed
                </a>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <GraduationCap className="h-7 w-7 text-primary" />
                {query ? `Research: "${query}"` : "Academic Search"}
              </h1>
              {data && (
                <span className="text-sm text-muted-foreground">
                  {data.totalResults} papers found
                </span>
              )}
            </div>

            {/* AI Research Summary */}
            {data?.aiSummary && (
              <div className="glass-card rounded-2xl p-6 mb-6 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-3">
                  <Sparkles className="h-4 w-4" />
                  AI Research Summary
                </div>
                <p className="text-foreground leading-relaxed">{data.aiSummary}</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="glass-card rounded-2xl p-6 border border-destructive/20 mb-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 text-destructive shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Search Error</h3>
                    <p className="text-muted-foreground text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-lg bg-muted" />
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-muted rounded w-1/4" />
                        <div className="h-6 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                        <div className="h-20 bg-muted rounded w-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {data?.papers.map((paper) => (
                  <article
                    key={paper.id}
                    className="glass-card rounded-2xl p-6 hover:ring-1 hover:ring-primary/20 transition-all cursor-pointer group"
                    onClick={() => setSelectedPaper(paper)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Source Badge */}
                      <div className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border",
                        getSourceBadge(paper.source)
                      )}>
                        {paper.source === "arxiv" ? (
                          <FileText className="h-6 w-6" />
                        ) : (
                          <BookOpen className="h-6 w-6" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Source & Date */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border",
                            getSourceBadge(paper.source)
                          )}>
                            {paper.source}
                          </span>
                          {paper.publishedDate && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(paper.publishedDate)}
                              </span>
                            </>
                          )}
                          {paper.journal && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[200px]">{paper.journal}</span>
                            </>
                          )}
                        </div>

                        {/* Title */}
                        <h2 className="font-semibold text-foreground text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {paper.title}
                        </h2>

                        {/* Authors */}
                        {paper.authors.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <Users className="h-4 w-4 shrink-0" />
                            <span className="truncate">
                              {paper.authors.slice(0, 4).join(", ")}
                              {paper.authors.length > 4 && ` +${paper.authors.length - 4} more`}
                            </span>
                          </div>
                        )}

                        {/* Abstract */}
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                          {paper.abstract}
                        </p>

                        {/* Footer Stats */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {paper.citations !== undefined && paper.citations > 0 && (
                              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                <Quote className="h-3 w-3" />
                                {paper.citations} citations
                              </span>
                            )}
                            {paper.categories && paper.categories.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {paper.categories.slice(0, 3).map((cat) => (
                                  <span key={cat} className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                                    {cat}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isPaperSaved(paper.id)) {
                                removePaper(paper.id);
                              } else {
                                addPaper(paper);
                              }
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition-colors",
                              isPaperSaved(paper.id)
                                ? "bg-primary/10 text-primary hover:bg-primary/20"
                                : "bg-accent text-accent-foreground hover:bg-accent/80"
                            )}
                          >
                            {isPaperSaved(paper.id) ? (
                              <>
                                <BookmarkCheck className="h-3 w-3" />
                                Saved
                              </>
                            ) : (
                              <>
                                <BookmarkPlus className="h-3 w-3" />
                                Save
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && data?.papers.length === 0 && (
              <div className="text-center py-16">
                <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No papers found</h3>
                <p className="text-muted-foreground mb-6">
                  Try different keywords or browse by category
                </p>
                <button
                  onClick={() => navigate("/academic?q=machine learning")}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Try "machine learning"
                </button>
              </div>
            )}

            {/* No Query State */}
            {!query && !isLoading && (
              <div className="text-center py-16">
                <div className="glass-card rounded-2xl p-8 max-w-xl mx-auto">
                  <GraduationCap className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Academic Search</h3>
                  <p className="text-muted-foreground mb-6">
                    Search millions of research papers from arXiv and PubMed
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {["machine learning", "climate change", "CRISPR", "quantum computing", "COVID-19"].map((topic) => (
                      <button
                        key={topic}
                        onClick={() => navigate(`/academic?q=${encodeURIComponent(topic)}`)}
                        className="px-4 py-2 rounded-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors text-sm"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Paper Detail Modal */}
      {selectedPaper && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => {
            setSelectedPaper(null);
            setActiveTab("abstract");
          }}
        >
          <div 
            className="glass-card rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-border shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border",
                      getSourceBadge(selectedPaper.source)
                    )}>
                      {selectedPaper.source}
                    </div>
                    {selectedPaper.citations !== undefined && selectedPaper.citations > 0 && (
                      <span className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
                        <Quote className="h-4 w-4" />
                        {selectedPaper.citations} citations
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-foreground line-clamp-2">
                    {selectedPaper.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                    {selectedPaper.publishedDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(selectedPaper.publishedDate)}
                      </span>
                    )}
                    {selectedPaper.journal && (
                      <span className="truncate max-w-[200px]">{selectedPaper.journal}</span>
                    )}
                    {selectedPaper.doi && (
                      <span className="font-mono text-xs">DOI: {selectedPaper.doi}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedPaper(null);
                    setActiveTab("abstract");
                  }}
                  className="p-2 rounded-full hover:bg-accent transition-colors shrink-0"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Tabbed Content */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "abstract" | "pdf")} className="flex-1 flex flex-col min-h-0">
              <div className="px-6 pt-4 border-b border-border shrink-0">
                <TabsList className="w-full justify-start bg-transparent border-none gap-4">
                  <TabsTrigger 
                    value="abstract" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-2"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Abstract
                  </TabsTrigger>
                  {selectedPaper.pdfUrl && (
                    <TabsTrigger 
                      value="pdf" 
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-2"
                      onClick={() => setPdfLoading(true)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      PDF Preview
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0">
                <TabsContent value="abstract" className="p-6 space-y-4 m-0">
                  {/* Authors */}
                  {selectedPaper.authors.length > 0 && (
                    <div className="glass-card rounded-xl p-4 bg-accent/30">
                      <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Authors
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedPaper.authors.map((author, idx) => (
                          <a
                            key={idx}
                            href={`https://scholar.google.com/scholar?q=author:${encodeURIComponent(author)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-full bg-background/50 text-sm text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            {author}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Categories */}
                  {selectedPaper.categories && selectedPaper.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedPaper.categories.map((cat) => (
                        <span key={cat} className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm">
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Abstract */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Abstract</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedPaper.abstract}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="pdf" className="m-0 h-full">
                  {selectedPaper.pdfUrl ? (
                    <div className="relative h-[60vh]">
                      {pdfLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Loading PDF...</p>
                          </div>
                        </div>
                      )}
                      <iframe
                        src={selectedPaper.pdfUrl}
                        className="w-full h-full border-0"
                        title={`PDF: ${selectedPaper.title}`}
                        onLoad={() => setPdfLoading(false)}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[40vh] text-center">
                      <FileIcon className="h-16 w-16 text-muted-foreground mb-4" />
                      <h4 className="text-lg font-medium text-foreground mb-2">PDF Not Available</h4>
                      <p className="text-muted-foreground mb-4">
                        This paper doesn't have a direct PDF link available.
                      </p>
                      <a
                        href={selectedPaper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        View on {selectedPaper.source === "arxiv" ? "arXiv" : "PubMed"}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>

            {/* Modal Footer */}
            <div className="p-6 border-t border-border shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <a
                    href={selectedPaper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                  >
                    View Full Paper
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  {selectedPaper.pdfUrl && (
                    <a
                      href={selectedPaper.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-foreground hover:bg-accent/80 transition-colors font-medium"
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </a>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedPaper(null);
                    setActiveTab("abstract");
                  }}
                  className="px-5 py-2.5 rounded-full border border-border text-foreground hover:bg-accent transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Academic;
