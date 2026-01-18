import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

interface SearchHistoryItem {
  id: string;
  query: string;
  mode: "ai" | "web";
  timestamp: string;
}

interface SavedSearch {
  id: string;
  query: string;
  mode: "ai" | "web";
  name: string;
  createdAt: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        // Load user data when signed in
        if (session?.user) {
          setTimeout(() => {
            loadUserData(session.user.id);
          }, 0);
        } else {
          setSearchHistory([]);
          setSavedSearches([]);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      if (session?.user) {
        loadUserData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      // Load search history from database
      const { data: historyData, error: historyError } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!historyError && historyData) {
        setSearchHistory(historyData.map(item => ({
          id: item.id,
          query: item.query,
          mode: item.mode as "ai" | "web",
          timestamp: item.created_at,
        })));
      }

      // Load saved searches from database
      const { data: savedData, error: savedError } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!savedError && savedData) {
        setSavedSearches(savedData.map(item => ({
          id: item.id,
          query: item.query,
          mode: item.mode as "ai" | "web",
          name: item.name,
          createdAt: item.created_at,
        })));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Fallback to localStorage if database fails
      const storedHistory = localStorage.getItem(`search_history_${userId}`);
      const storedSaved = localStorage.getItem(`saved_searches_${userId}`);
      
      if (storedHistory) {
        setSearchHistory(JSON.parse(storedHistory));
      }
      if (storedSaved) {
        setSavedSearches(JSON.parse(storedSaved));
      }
    }
  };

  const addToHistory = useCallback(async (query: string, mode: "ai" | "web") => {
    if (!user) return;
    
    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query,
      mode,
      timestamp: new Date().toISOString(),
    };
    
    // Update local state immediately
    setSearchHistory(prev => {
      const updated = [newItem, ...prev.filter(h => h.query !== query)].slice(0, 100);
      return updated;
    });

    // Persist to database
    try {
      // Remove duplicate query first
      await supabase
        .from('search_history')
        .delete()
        .eq('user_id', user.id)
        .eq('query', query);

      // Insert new record
      const { error } = await supabase
        .from('search_history')
        .insert({
          user_id: user.id,
          query,
          mode,
        });

      if (error) {
        console.error('Error saving to history:', error);
        // Fallback to localStorage
        localStorage.setItem(`search_history_${user.id}`, JSON.stringify(
          [newItem, ...searchHistory.filter(h => h.query !== query)].slice(0, 100)
        ));
      }
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }, [user, searchHistory]);

  const removeFromHistory = useCallback(async (id: string) => {
    if (!user) return;
    
    setSearchHistory(prev => prev.filter(h => h.id !== id));

    try {
      await supabase
        .from('search_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error removing from history:', error);
    }
  }, [user]);

  const clearHistory = useCallback(async () => {
    if (!user) return;
    
    setSearchHistory([]);
    
    try {
      await supabase
        .from('search_history')
        .delete()
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
    
    localStorage.removeItem(`search_history_${user.id}`);
  }, [user]);

  const saveSearch = useCallback(async (query: string, mode: "ai" | "web", name?: string) => {
    if (!user) return;
    
    const newSaved: SavedSearch = {
      id: Date.now().toString(),
      query,
      mode,
      name: name || query,
      createdAt: new Date().toISOString(),
    };
    
    // Update local state immediately
    setSavedSearches(prev => [newSaved, ...prev]);

    // Persist to database
    try {
      const { data, error } = await supabase
        .from('saved_searches')
        .insert({
          user_id: user.id,
          query,
          mode,
          name: name || query,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving search:', error);
        localStorage.setItem(`saved_searches_${user.id}`, JSON.stringify([newSaved, ...savedSearches]));
      } else if (data) {
        // Update with actual ID from database
        setSavedSearches(prev => prev.map(s => 
          s.id === newSaved.id ? { ...s, id: data.id } : s
        ));
      }
    } catch (error) {
      console.error('Error saving search:', error);
    }
  }, [user, savedSearches]);

  const removeSavedSearch = useCallback(async (id: string) => {
    if (!user) return;
    
    setSavedSearches(prev => prev.filter(s => s.id !== id));

    try {
      await supabase
        .from('saved_searches')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error removing saved search:', error);
    }
    
    localStorage.setItem(`saved_searches_${user.id}`, JSON.stringify(
      savedSearches.filter(s => s.id !== id)
    ));
  }, [user, savedSearches]);

  const signInWithSSO = useCallback(async () => {
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      
      // Get authorization URL from edge function
      const { data, error } = await supabase.functions.invoke("alsamos-oauth", {
        body: {
          action: "get_auth_url",
          redirect_uri: redirectUri,
        },
      });

      if (error) {
        console.error("Failed to get auth URL:", error);
        return;
      }

      if (data?.auth_url && data?.state) {
        // Store state for CSRF protection
        sessionStorage.setItem("alsamos_oauth_state", data.state);
        // Redirect to Alsamos OAuth
        window.location.href = data.auth_url;
      }
    } catch (error) {
      console.error("SSO error:", error);
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    searchHistory,
    savedSearches,
    addToHistory,
    removeFromHistory,
    clearHistory,
    saveSearch,
    removeSavedSearch,
    signInWithSSO,
    signOut,
  };
}
