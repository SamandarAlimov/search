import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { 
  BookOpen, 
  Users, 
  Calendar, 
  ExternalLink, 
  GraduationCap,
  FileText,
  Trash2,
  Check,
  Circle,
  StickyNote,
  Palette,
  Download,
  Eye,
  X,
  Loader2,
  BookMarked
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useReadingList, ReadingListItem, HIGHLIGHT_COLORS } from "@/hooks/useReadingList";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ReadingList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, isLoading, removePaper, updateNotes, toggleRead, setHighlightColor } = useReadingList();
  const [selectedItem, setSelectedItem] = useState<ReadingListItem | null>(null);
  const [activeTab, setActiveTab] = useState<"abstract" | "notes" | "pdf">("abstract");
  const [editingNotes, setEditingNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [pdfLoading, setPdfLoading] = useState(false);

  const filteredItems = items.filter(item => {
    if (filter === "unread") return !item.is_read;
    if (filter === "read") return item.is_read;
    return true;
  });

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Date unknown";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const getSourceBadge = (source: string) => {
    const styles: Record<string, string> = {
      arxiv: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
      pubmed: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    };
    return styles[source] || "bg-muted text-muted-foreground";
  };

  const getHighlightClass = (color: string | null) => {
    if (!color) return "";
    return HIGHLIGHT_COLORS.find(c => c.id === color)?.class || "";
  };

  const handleSaveNotes = async () => {
    if (!selectedItem) return;
    setSavingNotes(true);
    await updateNotes(selectedItem.paper_id, editingNotes);
    setSelectedItem(prev => prev ? { ...prev, notes: editingNotes } : null);
    setSavingNotes(false);
  };

  const openItem = (item: ReadingListItem) => {
    setSelectedItem(item);
    setEditingNotes(item.notes || "");
    setActiveTab("abstract");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 flex items-center justify-center">
          <div className="text-center max-w-md">
            <BookMarked className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Sign in to access your reading list</h2>
            <p className="text-muted-foreground mb-6">
              Save papers, add notes, and track your reading progress.
            </p>
            <button
              onClick={() => navigate("/auth")}
              className="px-6 py-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
            >
              Sign In
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <BookMarked className="h-7 w-7 text-primary" />
              Reading List
            </h1>
            <span className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? "paper" : "papers"} saved
            </span>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mb-6">
            {(["all", "unread", "read"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm transition-colors capitalize",
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-accent-foreground hover:bg-accent/80"
                )}
              >
                {f} {f === "all" ? `(${items.length})` : f === "unread" ? `(${items.filter(i => !i.is_read).length})` : `(${items.filter(i => i.is_read).length})`}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-lg bg-muted" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-muted rounded w-1/4" />
                      <div className="h-6 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {filter === "all" ? "No papers saved yet" : `No ${filter} papers`}
              </h3>
              <p className="text-muted-foreground mb-6">
                {filter === "all" 
                  ? "Search for academic papers and save them to your reading list"
                  : "Change the filter to see other papers"}
              </p>
              {filter === "all" && (
                <button
                  onClick={() => navigate("/academic?q=machine learning")}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Browse Academic Papers
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <article
                  key={item.id}
                  className={cn(
                    "glass-card rounded-2xl p-6 hover:ring-1 hover:ring-primary/20 transition-all cursor-pointer group border",
                    getHighlightClass(item.highlight_color),
                    item.is_read && "opacity-70"
                  )}
                  onClick={() => openItem(item)}
                >
                  <div className="flex items-start gap-4">
                    {/* Source Badge */}
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border relative",
                      getSourceBadge(item.source)
                    )}>
                      {item.source === "arxiv" ? (
                        <FileText className="h-6 w-6" />
                      ) : (
                        <BookOpen className="h-6 w-6" />
                      )}
                      {item.is_read && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Source & Date */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border",
                          getSourceBadge(item.source)
                        )}>
                          {item.source}
                        </span>
                        {item.published_date && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(item.published_date)}
                            </span>
                          </>
                        )}
                        {item.notes && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <StickyNote className="h-3 w-3" />
                              Has notes
                            </span>
                          </>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className="font-semibold text-foreground text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {item.title}
                      </h2>

                      {/* Authors */}
                      {item.authors.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Users className="h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {item.authors.slice(0, 3).join(", ")}
                            {item.authors.length > 3 && ` +${item.authors.length - 3} more`}
                          </span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleRead(item.paper_id)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition-colors",
                            item.is_read
                              ? "bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20"
                              : "bg-accent text-accent-foreground hover:bg-accent/80"
                          )}
                        >
                          {item.is_read ? <Check className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                          {item.is_read ? "Read" : "Mark as read"}
                        </button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 bg-accent text-accent-foreground hover:bg-accent/80 transition-colors">
                              <Palette className="h-3 w-3" />
                              Highlight
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {HIGHLIGHT_COLORS.map((color) => (
                              <DropdownMenuItem
                                key={color.id}
                                onClick={() => setHighlightColor(item.paper_id, color.id)}
                                className="flex items-center gap-2"
                              >
                                <div className={cn("w-4 h-4 rounded-full border", color.class)} />
                                {color.label}
                              </DropdownMenuItem>
                            ))}
                            {item.highlight_color && (
                              <DropdownMenuItem
                                onClick={() => setHighlightColor(item.paper_id, null)}
                                className="text-muted-foreground"
                              >
                                Remove highlight
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <button
                          onClick={() => removePaper(item.paper_id)}
                          className="px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Detail Modal */}
      {selectedItem && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
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
                      getSourceBadge(selectedItem.source)
                    )}>
                      {selectedItem.source}
                    </div>
                    {selectedItem.is_read && (
                      <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                        <Check className="h-4 w-4" />
                        Read
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-foreground line-clamp-2">
                    {selectedItem.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                    {selectedItem.published_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(selectedItem.published_date)}
                      </span>
                    )}
                    {selectedItem.journal && (
                      <span className="truncate max-w-[200px]">{selectedItem.journal}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 rounded-full hover:bg-accent transition-colors shrink-0"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Tabbed Content */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
              <div className="px-6 pt-4 border-b border-border shrink-0">
                <TabsList className="w-full justify-start bg-transparent border-none gap-4">
                  <TabsTrigger 
                    value="abstract" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-2"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Abstract
                  </TabsTrigger>
                  <TabsTrigger 
                    value="notes" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-2"
                  >
                    <StickyNote className="h-4 w-4 mr-2" />
                    Notes
                  </TabsTrigger>
                  {selectedItem.pdf_url && (
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
                  {selectedItem.authors.length > 0 && (
                    <div className="glass-card rounded-xl p-4 bg-accent/30">
                      <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Authors
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.authors.map((author, idx) => (
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

                  {/* Abstract */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Abstract</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedItem.abstract || "No abstract available."}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="p-6 space-y-4 m-0">
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <StickyNote className="h-4 w-4" />
                      Your Notes
                    </h4>
                    <textarea
                      value={editingNotes}
                      onChange={(e) => setEditingNotes(e.target.value)}
                      placeholder="Add your notes, highlights, and thoughts about this paper..."
                      className="w-full h-64 p-4 rounded-xl bg-accent/30 border border-border text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={handleSaveNotes}
                        disabled={savingNotes || editingNotes === (selectedItem.notes || "")}
                        className="px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {savingNotes ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            Save Notes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pdf" className="m-0 h-full">
                  {selectedItem.pdf_url ? (
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
                        src={selectedItem.pdf_url}
                        className="w-full h-full border-0"
                        title={`PDF: ${selectedItem.title}`}
                        onLoad={() => setPdfLoading(false)}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[40vh] text-center">
                      <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                      <h4 className="text-lg font-medium text-foreground mb-2">PDF Not Available</h4>
                      <p className="text-muted-foreground">
                        This paper doesn't have a direct PDF link.
                      </p>
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
                    href={selectedItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                  >
                    View Full Paper
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  {selectedItem.pdf_url && (
                    <a
                      href={selectedItem.pdf_url}
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
                  onClick={() => setSelectedItem(null)}
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

export default ReadingList;
