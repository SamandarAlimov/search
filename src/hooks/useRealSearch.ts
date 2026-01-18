import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  title: string;
  url: string;
  description: string;
  markdown?: string;
  favicon?: string;
}

interface Source {
  title: string;
  url: string;
  domain: string;
}

interface RealSearchResponse {
  aiResponse: string;
  sources: Source[];
  webResults: SearchResult[];
  relatedSearches: string[];
  totalResults: number;
  error?: string;
}

interface SearchOptions {
  limit?: number;
  lang?: string;
  country?: string;
  tbs?: string; // Time filter
  domain?: string;
  fileType?: string;
  filter?: string; // Search filter mode (academic, etc.)
}

export function useRealSearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RealSearchResponse | null>(null);

  const search = useCallback(async (
    query: string, 
    mode: "ai" | "web" = "ai",
    options?: SearchOptions
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // Build the search query with options
      let searchQuery = query;
      if (options?.domain) {
        searchQuery = `site:${options.domain} ${query}`;
      }
      if (options?.fileType) {
        searchQuery = `${searchQuery} filetype:${options.fileType}`;
      }

      const { data: response, error: fnError } = await supabase.functions.invoke("real-search", {
        body: { 
          query: searchQuery, 
          mode,
          options: {
            limit: options?.limit || 50, // Increased for more comprehensive results
            lang: options?.lang,
            country: options?.country,
            tbs: options?.tbs,
            filter: options?.filter,
          }
        },
      });

      if (fnError) throw fnError;

      if (response.error) {
        throw new Error(response.error);
      }

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

  const clearResults = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { search, isLoading, error, data, clearResults };
}
