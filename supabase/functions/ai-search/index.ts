import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, mode } = await req.json();
    console.log("Search request:", { query, mode });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Generate AI response
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are Alsamos Search AI, a helpful and knowledgeable search assistant. Provide comprehensive, accurate, and well-structured answers. Use paragraphs, lists, and formatting where appropriate. Be concise but thorough. Always cite that information comes from web sources.`,
          },
          {
            role: "user",
            content: query,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "Unable to generate response.";

    // Generate mock sources and results based on query
    const sources = [
      { title: `${query} - Wikipedia`, url: `https://wikipedia.org/wiki/${encodeURIComponent(query)}`, domain: "wikipedia.org" },
      { title: `Understanding ${query}`, url: `https://britannica.com/topic/${encodeURIComponent(query)}`, domain: "britannica.com" },
      { title: `${query} Explained`, url: `https://medium.com/topic/${encodeURIComponent(query)}`, domain: "medium.com" },
    ];

    const webResults = [
      {
        title: `${query} - Wikipedia`,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
        description: `Comprehensive article about ${query} covering history, concepts, applications, and latest developments in the field.`,
      },
      {
        title: `What is ${query}? Complete Guide`,
        url: `https://www.britannica.com/topic/${encodeURIComponent(query)}`,
        description: `Expert-reviewed explanation of ${query} with detailed analysis, examples, and references to primary sources.`,
      },
      {
        title: `${query}: Latest News and Updates`,
        url: `https://www.reuters.com/search/news?query=${encodeURIComponent(query)}`,
        description: `Breaking news and recent developments related to ${query}. Stay informed with the latest updates.`,
      },
      {
        title: `The Ultimate Guide to ${query}`,
        url: `https://www.medium.com/topic/${encodeURIComponent(query)}`,
        description: `In-depth exploration of ${query} by industry experts. Learn everything from basics to advanced concepts.`,
      },
      {
        title: `${query} Research Papers`,
        url: `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`,
        description: `Academic research and scholarly articles about ${query}. Peer-reviewed sources from leading institutions.`,
      },
    ];

    const relatedSearches = [
      `${query} explained simply`,
      `${query} examples`,
      `${query} vs alternatives`,
      `how does ${query} work`,
      `${query} latest news`,
      `${query} for beginners`,
    ];

    const result = {
      aiResponse: aiContent,
      sources,
      webResults,
      relatedSearches,
    };

    console.log("Search completed successfully");
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Search error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Search failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
