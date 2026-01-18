import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, Trash2, Bookmark, Sparkles, Globe, Edit2, Clock } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
import { Skeleton } from '@/components/ui/skeleton';

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  mode: string;
  created_at: string;
}

const SavedSearches = () => {
  const navigate = useNavigate();
  const { isAuthenticated, signInWithSSO, user } = useAuth();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [searchToEdit, setSearchToEdit] = useState<SavedSearch | null>(null);
  const [editName, setEditName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchSavedSearches();
    }
  }, [user]);

  const fetchSavedSearches = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedSearches(data || []);
    } catch (error) {
      console.error('Error fetching saved searches:', error);
      toast.error('Failed to load saved searches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchClick = (query: string, mode: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}&mode=${mode}`);
  };

  const handleEdit = (search: SavedSearch, e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchToEdit(search);
    setEditName(search.name);
    setEditDialogOpen(true);
  };

  const confirmEdit = async () => {
    if (!searchToEdit) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('saved_searches')
        .update({ name: editName })
        .eq('id', searchToEdit.id);

      if (error) throw error;
      
      setSavedSearches(prev => 
        prev.map(s => s.id === searchToEdit.id ? { ...s, name: editName } : s)
      );
      toast.success('Search updated');
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating search:', error);
      toast.error('Failed to update search');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSavedSearches(prev => prev.filter(s => s.id !== id));
      toast.success('Search deleted');
    } catch (error) {
      console.error('Error deleting search:', error);
      toast.error('Failed to delete search');
    }
  };

  const handleClearAll = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      
      setSavedSearches([]);
      toast.success('All saved searches cleared');
    } catch (error) {
      console.error('Error clearing searches:', error);
      toast.error('Failed to clear searches');
    }
  };

  const filteredSearches = savedSearches.filter(s => 
    s.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    s.query.toLowerCase().includes(filterQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Helmet>
          <title>Saved Searches - Alsamos Search</title>
        </Helmet>
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Bookmark className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold mb-4">Sign in to view saved searches</h1>
            <p className="text-muted-foreground mb-6">
              Save your favorite searches for quick access across all your devices.
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
        <title>Saved Searches - Alsamos Search</title>
        <meta name="description" content="Manage your saved searches on Alsamos Search" />
      </Helmet>
      
      <Header />
      
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Saved Searches</h1>
            <p className="text-muted-foreground mt-1">
              {savedSearches.length} {savedSearches.length === 1 ? 'search' : 'searches'} saved
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/history')}>
              <Clock className="w-4 h-4 mr-2" />
              Search History
            </Button>
            {savedSearches.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all saved searches?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your saved searches. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {savedSearches.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Filter saved searches..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredSearches.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Bookmark className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-medium mb-2">
              {savedSearches.length === 0 ? 'No saved searches yet' : 'No matching searches'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {savedSearches.length === 0
                ? 'Save searches from your history for quick access'
                : 'Try adjusting your filter'}
            </p>
            {savedSearches.length === 0 && (
              <Button onClick={() => navigate('/history')} variant="outline">
                <Clock className="w-4 h-4 mr-2" />
                Go to History
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredSearches.map((search) => (
              <button
                key={search.id}
                onClick={() => handleSearchClick(search.query, search.mode)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-card hover:bg-accent/50 border border-border/50 transition-all duration-200 group text-left"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  search.mode === 'ai' 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-blue-500/10 text-blue-500'
                }`}>
                  {search.mode === 'ai' ? (
                    <Sparkles className="w-6 h-6" />
                  ) : (
                    <Globe className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                    {search.name}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {search.query !== search.name && `"${search.query}" • `}
                    {search.mode === 'ai' ? 'AI Search' : 'Web Search'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Saved {new Date(search.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleEdit(search, e)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete saved search?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{search.name}". This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={(e) => handleDelete(search.id, e)} 
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <Search className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        )}
      </main>
      
      <Footer />

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Search Name</DialogTitle>
            <DialogDescription>
              Update the name for this saved search.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="editName">Name</Label>
            <Input
              id="editName"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter a name"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmEdit} disabled={isUpdating || !editName.trim()}>
              {isUpdating ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SavedSearches;