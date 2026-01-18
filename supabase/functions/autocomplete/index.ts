import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Popular search suggestions based on common patterns
const trendingSuggestions = [
  "artificial intelligence",
  "machine learning",
  "cryptocurrency prices",
  "climate change news",
  "space exploration",
  "renewable energy",
  "electric vehicles",
  "quantum computing",
  "blockchain technology",
  "cybersecurity tips",
  "health and wellness",
  "remote work tools",
  "sustainable living",
  "digital marketing",
  "programming tutorials",
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit = 8 } = await req.json();

    if (!query || query.length < 1) {
      // Return trending suggestions when no query
      return new Response(
        JSON.stringify({
          success: true,
          suggestions: trendingSuggestions.slice(0, limit),
          type: 'trending',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lowerQuery = query.toLowerCase();
    
    // Generate contextual suggestions based on query
    const suggestions: string[] = [];
    
    // Add exact continuation suggestions
    const continuations = [
      `${query} tutorial`,
      `${query} guide`,
      `${query} examples`,
      `${query} vs`,
      `${query} best practices`,
      `${query} how to`,
      `${query} 2024`,
      `${query} free`,
      `${query} online`,
      `${query} near me`,
    ];
    
    // Add related suggestions based on common patterns
    const prefixes = [
      `what is ${query}`,
      `how to ${query}`,
      `best ${query}`,
      `${query} meaning`,
      `${query} definition`,
      `${query} price`,
      `${query} reviews`,
      `${query} download`,
    ];

    // Combine and deduplicate
    const allSuggestions = [...continuations, ...prefixes];
    
    // Filter and limit
    const filteredSuggestions = allSuggestions
      .filter(s => s.toLowerCase().includes(lowerQuery))
      .slice(0, limit);

    // Add trending that match
    const matchingTrending = trendingSuggestions
      .filter(s => s.toLowerCase().includes(lowerQuery))
      .slice(0, 3);

    const finalSuggestions = [...new Set([...filteredSuggestions, ...matchingTrending])].slice(0, limit);

    return new Response(
      JSON.stringify({
        success: true,
        suggestions: finalSuggestions,
        type: 'autocomplete',
        query,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Autocomplete error:', error);
    return new Response(
      JSON.stringify({ success: false, suggestions: [], error: 'Autocomplete failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
