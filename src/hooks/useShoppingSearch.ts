import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  originalPrice: string | null;
  rating: number;
  reviews: number;
  url: string;
  domain: string;
  image: string;
  store: string | null;
  freeShipping: boolean;
  inStock: boolean;
  prime: boolean;
}

interface ShoppingSearchResponse {
  success: boolean;
  products: Product[];
  totalResults: number;
  query: string;
  error?: string;
}

interface SearchOptions {
  limit?: number;
  lang?: string;
}

export function useShoppingSearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  const search = useCallback(async (query: string, options?: SearchOptions) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: response, error: fnError } = await supabase.functions.invoke("shopping-search", {
        body: { 
          query,
          options: {
            limit: options?.limit || 30,
            lang: options?.lang || "en",
          }
        },
      });

      if (fnError) throw fnError;

      if (!response.success) {
        throw new Error(response.error || "Shopping search failed");
      }

      setProducts(response.products);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Shopping search failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setProducts([]);
    setError(null);
  }, []);

  return { search, isLoading, error, products, clearResults };
}
