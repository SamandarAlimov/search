import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, Trash2, Clock, Sparkles, Globe, Calendar, Filter, Bookmark } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 20;

const SearchHistory = () => {
  const navigate = useNavigate();
  const { searchHistory, clearHistory, isAuthenticated, signInWithSSO, user } = useAuth();
  const [filterQuery, setFilterQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'ai' | 'web'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchToSave, setSearchToSave] = useState<{ query: string; mode: string } | null>(null);
  const [saveName, setSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const filteredHistory = searchHistory.filter((item) => {
    const matchesQuery = item.query.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesMode = filterMode === 'all' || item.mode === filterMode;
    return matchesQuery && matchesMode;
  });

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredHistory, currentPage]);

  const groupedHistory = paginatedHistory.reduce((groups, item) => {
    const date = new Date(item.timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, typeof searchHistory>);

  const handleSearchClick = (query: string, mode: 'ai' | 'web') => {
    navigate(`/search?q=${encodeURIComponent(query)}&mode=${mode}`);
  };

  const handleSaveSearch = (query: string, mode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchToSave({ query, mode });
    setSaveName(query);
    setSaveDialogOpen(true);
  };

  const confirmSaveSearch = async () => {
    if (!searchToSave || !user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase.from('saved_searches').insert({
        user_id: user.id,
        query: searchToSave.query,
        mode: searchToSave.mode,
        name: saveName || searchToSave.query,
      });

      if (error) throw error;
      toast.success('Search saved successfully');
      setSaveDialogOpen(false);
      setSearchToSave(null);
      setSaveName('');
    } catch (error) {
      console.error('Error saving search:', error);
      toast.error('Failed to save search');
    } finally {
      setIsSaving(false);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Helmet>
          <title>Search History - Alsamos Search</title>
        </Helmet>
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold mb-4">Sign in to view your search history</h1>
            <p className="text-muted-foreground mb-6">
              Your search history is synced across all your devices when you're signed in.
            </p>
            <Button onClick={signInWithSSO} size="lg">
              Sign in with Alsamos
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Search History - Alsamos Search</title>
        <meta name="description" content="View and manage your search history on Alsamos Search" />
      </Helmet>
      
      <Header />
      
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Search History</h1>
            <p className="text-muted-foreground mt-1">
              {searchHistory.length} {searchHistory.length === 1 ? 'search' : 'searches'} total
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/saved')}>
              <Bookmark className="w-4 h-4 mr-2" />
              Saved Searches
            </Button>
            {searchHistory.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear search history?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your search history. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={clearHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {searchHistory.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Filter history..."
                value={filterQuery}
                onChange={(e) => {
                  setFilterQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select value={filterMode} onValueChange={(v) => {
              setFilterMode(v as 'all' | 'ai' | 'web');
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All searches</SelectItem>
                <SelectItem value="ai">AI Search</SelectItem>
                <SelectItem value="web">Web Search</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {filteredHistory.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-medium mb-2">
              {searchHistory.length === 0 ? 'No search history yet' : 'No matching searches'}
            </h2>
            <p className="text-muted-foreground">
              {searchHistory.length === 0
                ? 'Your searches will appear here'
                : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-8">
              {Object.entries(groupedHistory).map(([date, items]) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-sm font-medium text-muted-foreground">{date}</h2>
                  </div>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSearchClick(item.query, item.mode)}
                        className="w-full flex items-center gap-4 p-4 rounded-xl bg-card hover:bg-accent/50 border border-border/50 transition-all duration-200 group text-left"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          item.mode === 'ai' 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          {item.mode === 'ai' ? (
                            <Sparkles className="w-5 h-5" />
                          ) : (
                            <Globe className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate group-hover:text-primary transition-colors">
                            {item.query}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.mode === 'ai' ? 'AI Search' : 'Web Search'} • {new Date(item.timestamp).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleSaveSearch(item.query, item.mode, e)}
                        >
                          <Bookmark className="w-4 h-4" />
                        </Button>
                        <Search className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {getPageNumbers().map((page, i) => (
                      <PaginationItem key={i}>
                        {page === 'ellipsis' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Page {currentPage} of {totalPages}
                </p>
              </div>
            )}
          </>
        )}
      </main>
      
      <Footer />

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
            <DialogDescription>
              Give this search a custom name for quick access later.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="saveName">Name</Label>
            <Input
              id="saveName"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Enter a name for this search"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSaveSearch} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SearchHistory;