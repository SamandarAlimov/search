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
    const { query, category, options } = await req.json();
    console.log("News search request:", { query, category, options });

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!FIRECRAWL_API_KEY) {
      throw new Error("FIRECRAWL_API_KEY not configured");
    }

    // Build search query for news
    let searchQuery = query || "latest news today";
    if (category && category !== "all") {
      searchQuery = `${category} news ${query || ""}`.trim();
    }

    console.log("Searching news:", searchQuery);

    // Use Firecrawl with time filter for recent news
    const searchResponse = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: options?.limit || 15,
        lang: options?.lang || "en",
        tbs: options?.tbs || "qdr:d", // Default to past day
        scrapeOptions: { formats: ["markdown"] },
      }),
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("Firecrawl news error:", searchResponse.status, errorText);
      throw new Error(`News search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log("Found", searchData.data?.length || 0, "news results");

    // Transform to news articles
    const articles = (searchData.data || []).map((result: any, index: number) => {
      const domain = new URL(result.url).hostname;
      return {
        id: `news-${index}`,
        title: result.title || "Untitled Article",
        description: result.description || result.markdown?.substring(0, 200) || "",
        content: result.markdown || "",
        url: result.url,
        source: domain.replace("www.", ""),
        category: category || "general",
        publishedAt: new Date().toISOString(), // Firecrawl doesn't provide exact dates
        image: result.screenshot || null,
      };
    });

    // Generate AI summary if we have content and AI key
    let aiSummary = "";
    if (LOVABLE_API_KEY && articles.length > 0) {
      const context = articles
        .slice(0, 5)
        .map((a: any) => `- ${a.title}: ${a.description}`)
        .join("\n");

      try {
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
                content: "You are a news summarizer. Provide a brief, objective 2-3 sentence summary of the main news themes.",
              },
              {
                role: "user",
                content: `Summarize these news headlines:\n${context}`,
              },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiSummary = aiData.choices?.[0]?.message?.content || "";
        }
      } catch (e) {
        console.error("AI summary error:", e);
      }
    }

    // Extract trending topics from titles
    const words = articles
      .flatMap((a: any) => a.title.toLowerCase().split(/\s+/))
      .filter((w: string) => w.length > 4);
    const wordCount: Record<string, number> = {};
    words.forEach((w: string) => {
      wordCount[w] = (wordCount[w] || 0) + 1;
    });
    const trending = Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

    const result = {
      success: true,
      articles,
      aiSummary,
      trending,
      totalResults: articles.length,
      query: searchQuery,
    };

    console.log("News search completed with", articles.length, "articles");
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("News search error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : "News search failed",
        articles: [],
        trending: [],
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
