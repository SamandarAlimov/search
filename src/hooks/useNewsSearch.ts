import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  source: string;
  category: string;
  publishedAt: string;
  image: string | null;
}

interface NewsSearchResponse {
  success: boolean;
  articles: NewsArticle[];
  aiSummary: string;
  trending: string[];
  totalResults: number;
  query: string;
  error?: string;
}

interface SearchOptions {
  limit?: number;
  lang?: string;
  tbs?: string; // Time filter: qdr:h, qdr:d, qdr:w, qdr:m
}

export function useNewsSearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [trending, setTrending] = useState<string[]>([]);

  const search = useCallback(async (
    query: string,
    category?: string,
    options?: SearchOptions
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: response, error: fnError } = await supabase.functions.invoke("news-search", {
        body: { 
          query,
          category,
          options: {
            limit: options?.limit || 15,
            lang: options?.lang || "en",
            tbs: options?.tbs || "qdr:d",
          }
        },
      });

      if (fnError) throw fnError;

      if (!response.success) {
        throw new Error(response.error || "News search failed");
      }

      setArticles(response.articles);
      setAiSummary(response.aiSummary || "");
      setTrending(response.trending || []);

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "News search failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setArticles([]);
    setAiSummary("");
    setTrending([]);
    setError(null);
  }, []);

  return { search, isLoading, error, articles, aiSummary, trending, clearResults };
}
