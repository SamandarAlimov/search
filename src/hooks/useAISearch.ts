import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  title: string;
  url: string;
  description: string;
}

interface AISearchResponse {
  aiResponse: string;
  sources: { title: string; url: string; domain: string }[];
  webResults: SearchResult[];
  relatedSearches: string[];
}

export function useAISearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AISearchResponse | null>(null);

  const search = useCallback(async (query: string, mode: "ai" | "web" = "ai") => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: response, error: fnError } = await supabase.functions.invoke("ai-search", {
        body: { query, mode },
      });

      if (fnError) throw fnError;

      setData(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { search, isLoading, error, data };
}
