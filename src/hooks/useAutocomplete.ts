import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAutocomplete() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const getSuggestions = useCallback(async (query: string) => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the request
    return new Promise<string[]>((resolve) => {
      debounceRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const { data: response, error } = await supabase.functions.invoke("autocomplete", {
            body: { query, limit: 8 },
          });

          if (error) {
            console.error("Autocomplete error:", error);
            resolve([]);
            return;
          }

          const newSuggestions = response?.suggestions || [];
          setSuggestions(newSuggestions);
          resolve(newSuggestions);
        } catch (err) {
          console.error("Autocomplete failed:", err);
          resolve([]);
        } finally {
          setIsLoading(false);
        }
      }, 150);
    });
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return { suggestions, isLoading, getSuggestions, clearSuggestions };
}
