import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AcademicPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  url: string;
  pdfUrl?: string;
  source: "arxiv" | "pubmed";
  publishedDate?: string;
  citations?: number;
  categories?: string[];
  journal?: string;
  doi?: string;
}

interface AcademicSearchResponse {
  papers: AcademicPaper[];
  totalResults: number;
  aiSummary: string;
  relatedTopics: string[];
}

export function useAcademicSearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AcademicSearchResponse | null>(null);

  const search = useCallback(async (query: string, options?: { category?: string; sortBy?: string }) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const { data: response, error: fnError } = await supabase.functions.invoke("academic-search", {
        body: { 
          query,
          category: options?.category,
          sortBy: options?.sortBy || "relevance",
        },
      });

      if (fnError) throw fnError;
      if (response.error) throw new Error(response.error);

      setData(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Academic search failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { search, isLoading, error, data, clearResults };
}
