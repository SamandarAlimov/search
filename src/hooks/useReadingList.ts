import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { AcademicPaper } from "./useAcademicSearch";

export interface ReadingListItem {
  id: string;
  user_id: string;
  paper_id: string;
  title: string;
  authors: string[];
  abstract: string | null;
  url: string;
  pdf_url: string | null;
  source: string;
  published_date: string | null;
  journal: string | null;
  doi: string | null;
  notes: string | null;
  is_read: boolean;
  highlight_color: string | null;
  created_at: string;
  updated_at: string;
}

const HIGHLIGHT_COLORS = [
  { id: "yellow", label: "Yellow", class: "bg-yellow-500/20 border-yellow-500/50" },
  { id: "green", label: "Green", class: "bg-green-500/20 border-green-500/50" },
  { id: "blue", label: "Blue", class: "bg-blue-500/20 border-blue-500/50" },
  { id: "purple", label: "Purple", class: "bg-purple-500/20 border-purple-500/50" },
  { id: "red", label: "Red", class: "bg-red-500/20 border-red-500/50" },
];

export { HIGHLIGHT_COLORS };

export function useReadingList() {
  const { user } = useAuth();
  const [items, setItems] = useState<ReadingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savedPaperIds, setSavedPaperIds] = useState<Set<string>>(new Set());

  const fetchReadingList = useCallback(async () => {
    if (!user) {
      setItems([]);
      setSavedPaperIds(new Set());
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("reading_list")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setItems(data || []);
      setSavedPaperIds(new Set((data || []).map(item => item.paper_id)));
    } catch (error) {
      console.error("Failed to fetch reading list:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReadingList();
  }, [fetchReadingList]);

  const addPaper = useCallback(async (paper: AcademicPaper) => {
    if (!user) {
      toast.error("Please sign in to save papers");
      return false;
    }

    try {
      const { error } = await supabase.from("reading_list").insert({
        user_id: user.id,
        paper_id: paper.id,
        title: paper.title,
        authors: paper.authors,
        abstract: paper.abstract,
        url: paper.url,
        pdf_url: paper.pdfUrl || null,
        source: paper.source,
        published_date: paper.publishedDate || null,
        journal: paper.journal || null,
        doi: paper.doi || null,
      });

      if (error) {
        if (error.code === "23505") {
          toast.info("Paper already in reading list");
          return false;
        }
        throw error;
      }

      setSavedPaperIds(prev => new Set([...prev, paper.id]));
      toast.success("Added to reading list");
      await fetchReadingList();
      return true;
    } catch (error) {
      console.error("Failed to add paper:", error);
      toast.error("Failed to add paper");
      return false;
    }
  }, [user, fetchReadingList]);

  const removePaper = useCallback(async (paperId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("reading_list")
        .delete()
        .eq("user_id", user.id)
        .eq("paper_id", paperId);

      if (error) throw error;

      setSavedPaperIds(prev => {
        const next = new Set(prev);
        next.delete(paperId);
        return next;
      });
      setItems(prev => prev.filter(item => item.paper_id !== paperId));
      toast.success("Removed from reading list");
      return true;
    } catch (error) {
      console.error("Failed to remove paper:", error);
      toast.error("Failed to remove paper");
      return false;
    }
  }, [user]);

  const updateNotes = useCallback(async (paperId: string, notes: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("reading_list")
        .update({ notes })
        .eq("user_id", user.id)
        .eq("paper_id", paperId);

      if (error) throw error;

      setItems(prev => prev.map(item => 
        item.paper_id === paperId ? { ...item, notes } : item
      ));
      return true;
    } catch (error) {
      console.error("Failed to update notes:", error);
      toast.error("Failed to save notes");
      return false;
    }
  }, [user]);

  const toggleRead = useCallback(async (paperId: string) => {
    if (!user) return false;

    const item = items.find(i => i.paper_id === paperId);
    if (!item) return false;

    try {
      const { error } = await supabase
        .from("reading_list")
        .update({ is_read: !item.is_read })
        .eq("user_id", user.id)
        .eq("paper_id", paperId);

      if (error) throw error;

      setItems(prev => prev.map(i => 
        i.paper_id === paperId ? { ...i, is_read: !i.is_read } : i
      ));
      toast.success(item.is_read ? "Marked as unread" : "Marked as read");
      return true;
    } catch (error) {
      console.error("Failed to toggle read status:", error);
      toast.error("Failed to update status");
      return false;
    }
  }, [user, items]);

  const setHighlightColor = useCallback(async (paperId: string, color: string | null) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("reading_list")
        .update({ highlight_color: color })
        .eq("user_id", user.id)
        .eq("paper_id", paperId);

      if (error) throw error;

      setItems(prev => prev.map(item => 
        item.paper_id === paperId ? { ...item, highlight_color: color } : item
      ));
      return true;
    } catch (error) {
      console.error("Failed to set highlight color:", error);
      toast.error("Failed to update highlight");
      return false;
    }
  }, [user]);

  const isPaperSaved = useCallback((paperId: string) => {
    return savedPaperIds.has(paperId);
  }, [savedPaperIds]);

  return {
    items,
    isLoading,
    addPaper,
    removePaper,
    updateNotes,
    toggleRead,
    setHighlightColor,
    isPaperSaved,
    refresh: fetchReadingList,
  };
}
