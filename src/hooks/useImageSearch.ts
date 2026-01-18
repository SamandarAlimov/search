import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ImageResult {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  source: string;
  domain: string;
  width: number;
  height: number;
}

interface ImageSearchResponse {
  success: boolean;
  images: ImageResult[];
  totalResults: number;
  query: string;
  error?: string;
}

interface SearchOptions {
  limit?: number;
  lang?: string;
}

export function useImageSearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<ImageResult[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const search = useCallback(async (
    query: string,
    options?: SearchOptions,
    append: boolean = false
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: response, error: fnError } = await supabase.functions.invoke("image-search", {
        body: { 
          query,
          options: {
            limit: options?.limit || 20,
            lang: options?.lang || "en",
          }
        },
      });

      if (fnError) throw fnError;

      if (!response.success) {
        throw new Error(response.error || "Image search failed");
      }

      if (append) {
        setImages(prev => [...prev, ...response.images]);
      } else {
        setImages(response.images);
      }

      setHasMore(response.images.length >= (options?.limit || 20));
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Image search failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async (query: string) => {
    return search(query, { limit: 20 }, true);
  }, [search]);

  const clearResults = useCallback(() => {
    setImages([]);
    setError(null);
    setHasMore(true);
  }, []);

  return { search, loadMore, isLoading, error, images, hasMore, clearResults };
}
