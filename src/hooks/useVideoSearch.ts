import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VideoResult {
  title: string;
  url: string;
  thumbnail: string;
  duration: string;
  source: string;
  publishedAt: string;
  views?: string;
  description?: string;
}

interface VideoSearchResponse {
  success: boolean;
  videos: VideoResult[];
  total: number;
  query: string;
  error?: string;
}

interface SearchOptions {
  limit?: number;
  lang?: string;
  country?: string;
}

export function useVideoSearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VideoSearchResponse | null>(null);

  const search = useCallback(async (query: string, options?: SearchOptions) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: response, error: fnError } = await supabase.functions.invoke("video-search", {
        body: { query, options: { limit: options?.limit || 20, ...options } },
      });

      if (fnError) throw fnError;

      if (response.error) {
        throw new Error(response.error);
      }

      setData(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Video search failed";
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
