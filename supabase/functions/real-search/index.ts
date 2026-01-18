import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchResult {
  title: string;
  url: string;
  description: string;
  markdown?: string;
  favicon?: string;
  type?: string;
  thumbnail?: string;
}

// Major platforms
const MAJOR_PLATFORMS = {
  social: [
    { name: "Instagram", domain: "instagram.com", keywords: ["instagram", "insta", "ig"] },
    { name: "Facebook", domain: "facebook.com", keywords: ["facebook", "fb"] },
    { name: "Twitter/X", domain: "twitter.com", keywords: ["twitter", "x.com", "tweet"] },
    { name: "TikTok", domain: "tiktok.com", keywords: ["tiktok", "tik tok"] },
    { name: "LinkedIn", domain: "linkedin.com", keywords: ["linkedin"] },
    { name: "Pinterest", domain: "pinterest.com", keywords: ["pinterest"] },
    { name: "Reddit", domain: "reddit.com", keywords: ["reddit"] },
  ],
  messaging: [
    { name: "Telegram", domain: "telegram.org", keywords: ["telegram", "tg"] },
    { name: "WhatsApp", domain: "whatsapp.com", keywords: ["whatsapp"] },
    { name: "Discord", domain: "discord.com", keywords: ["discord"] },
  ],
  video: [
    { name: "YouTube", domain: "youtube.com", keywords: ["youtube", "yt"] },
    { name: "Twitch", domain: "twitch.tv", keywords: ["twitch"] },
    { name: "Vimeo", domain: "vimeo.com", keywords: ["vimeo"] },
  ],
  maps: [
    { name: "Google Maps", domain: "google.com/maps", keywords: ["google maps", "maps", "location", "directions"] },
    { name: "OpenStreetMap", domain: "openstreetmap.org", keywords: ["openstreetmap", "osm"] },
  ],
  shopping: [
    { name: "Amazon", domain: "amazon.com", keywords: ["amazon"] },
    { name: "eBay", domain: "ebay.com", keywords: ["ebay"] },
  ],
  news: [
    { name: "BBC", domain: "bbc.com", keywords: ["bbc"] },
    { name: "CNN", domain: "cnn.com", keywords: ["cnn"] },
    { name: "Reuters", domain: "reuters.com", keywords: ["reuters"] },
  ],
  books: [
    { name: "Open Library", domain: "openlibrary.org", keywords: ["book", "books", "read", "author", "novel"] },
    { name: "Goodreads", domain: "goodreads.com", keywords: ["goodreads"] },
  ],
  academic: [
    { name: "arXiv", domain: "arxiv.org", keywords: ["arxiv", "paper", "research", "academic", "scientific"] },
    { name: "PubMed", domain: "pubmed.ncbi.nlm.nih.gov", keywords: ["pubmed", "medical", "health"] },
  ],
};

function detectPlatformIntent(query: string): { platforms: any[], categories: string[] } {
  const lowerQuery = query.toLowerCase();
  const detectedPlatforms: any[] = [];
  const categories: string[] = [];
  
  for (const [category, platforms] of Object.entries(MAJOR_PLATFORMS)) {
    for (const platform of platforms) {
      if (platform.keywords.some(kw => lowerQuery.includes(kw))) {
        detectedPlatforms.push(platform);
        if (!categories.includes(category)) categories.push(category);
      }
    }
  }

  const intentKeywords: Record<string, string[]> = {
    video: ["video", "watch", "stream", "clip"],
    maps: ["map", "location", "address", "directions", "near me"],
    images: ["image", "photo", "picture", "pic"],
    shopping: ["buy", "price", "shop", "purchase"],
    news: ["news", "latest", "breaking"],
    books: ["book", "author", "novel", "read", "literature"],
    academic: ["research", "paper", "study", "scientific", "academic"],
  };

  for (const [intent, keywords] of Object.entries(intentKeywords)) {
    if (keywords.some(kw => lowerQuery.includes(kw)) && !categories.includes(intent)) {
      categories.push(intent);
    }
  }

  return { platforms: detectedPlatforms, categories };
}

function generatePlatformResults(query: string, platforms: any[], categories: string[]): SearchResult[] {
  const results: SearchResult[] = [];

  for (const platform of platforms) {
    const searchQuery = query.replace(new RegExp(platform.keywords.join("|"), "gi"), "").trim();
    results.push({
      title: `${platform.name} - ${searchQuery || "Home"}`,
      url: `https://${platform.domain}${searchQuery ? `/search?q=${encodeURIComponent(searchQuery)}` : ""}`,
      description: `Search "${searchQuery || query}" on ${platform.name}.`,
      favicon: `https://www.google.com/s2/favicons?domain=${platform.domain}&sz=32`,
      type: "platform",
    });
  }

  if (categories.includes("maps")) {
    const q = query.replace(/map|location|directions|near me/gi, "").trim();
    results.push({
      title: `${q} - Google Maps`,
      url: `https://www.google.com/maps/search/${encodeURIComponent(q)}`,
      description: `Find ${q} on Google Maps.`,
      favicon: "https://www.google.com/s2/favicons?domain=google.com&sz=32",
      type: "map",
    });
  }

  if (categories.includes("video")) {
    const q = query.replace(/video|watch|stream/gi, "").trim();
    results.push({
      title: `${q} - YouTube`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
      description: `Watch ${q} videos on YouTube.`,
      favicon: "https://www.google.com/s2/favicons?domain=youtube.com&sz=32",
      type: "video",
    });
  }

  if (categories.includes("images")) {
    const q = query.replace(/image|photo|picture|pic/gi, "").trim();
    results.push({
      title: `${q} Images`,
      url: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`,
      description: `Find ${q} images and photos.`,
      favicon: "https://www.google.com/s2/favicons?domain=google.com&sz=32",
      type: "image",
    });
  }

  return results;
}

// DuckDuckGo Instant Answer API
async function searchDuckDuckGo(query: string): Promise<{ abstract: string; relatedTopics: SearchResult[]; infobox: any }> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const response = await fetch(url);
    if (!response.ok) return { abstract: "", relatedTopics: [], infobox: null };
    
    const data = await response.json();
    const relatedTopics: SearchResult[] = [];
    
    if (data.Results) {
      for (const result of data.Results) {
        if (result.FirstURL && result.Text) {
          relatedTopics.unshift({
            title: result.Text,
            url: result.FirstURL,
            description: result.Text,
            favicon: `https://www.google.com/s2/favicons?domain=${new URL(result.FirstURL).hostname}&sz=32`,
            type: "official",
          });
        }
      }
    }
    
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics) {
        if (topic.FirstURL && topic.Text) {
          relatedTopics.push({
            title: topic.Text.split(" - ")[0] || topic.Text.substring(0, 60),
            url: topic.FirstURL,
            description: topic.Text,
            favicon: `https://www.google.com/s2/favicons?domain=${new URL(topic.FirstURL).hostname}&sz=32`,
            type: "related",
          });
        }
        if (topic.Topics) {
          for (const nested of topic.Topics) {
            if (nested.FirstURL && nested.Text) {
              relatedTopics.push({
                title: nested.Text.split(" - ")[0],
                url: nested.FirstURL,
                description: nested.Text,
                favicon: `https://www.google.com/s2/favicons?domain=${new URL(nested.FirstURL).hostname}&sz=32`,
                type: "related",
              });
            }
          }
        }
      }
    }
    
    return { abstract: data.AbstractText || "", relatedTopics, infobox: data.Infobox };
  } catch (error) {
    console.error("DuckDuckGo error:", error);
    return { abstract: "", relatedTopics: [], infobox: null };
  }
}

// Wikipedia API
async function searchWikipedia(query: string): Promise<SearchResult[]> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=8&origin=*`;
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    return (data.query?.search || []).map((item: any) => ({
      title: item.title,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, "_"))}`,
      description: item.snippet.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"'),
      favicon: "https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32",
      type: "wikipedia",
    }));
  } catch (error) {
    console.error("Wikipedia error:", error);
    return [];
  }
}

// Wikipedia summary for knowledge panel
async function getWikipediaSummary(query: string): Promise<any> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.replace(/ /g, "_"))}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.type === "standard" || data.type === "disambiguation") {
      return {
        title: data.title,
        extract: data.extract,
        thumbnail: data.thumbnail?.source,
        url: data.content_urls?.desktop?.page,
      };
    }
    return null;
  } catch { return null; }
}

// Wikidata API - structured entity data
async function searchWikidata(query: string): Promise<{ entities: any[]; results: SearchResult[] }> {
  try {
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&format=json&limit=5&origin=*`;
    const response = await fetch(searchUrl);
    if (!response.ok) return { entities: [], results: [] };
    
    const data = await response.json();
    const results: SearchResult[] = [];
    const entities: any[] = [];
    
    if (data.search) {
      for (const item of data.search) {
        entities.push({
          id: item.id,
          label: item.label,
          description: item.description,
          url: item.concepturi,
        });
        results.push({
          title: item.label,
          url: item.concepturi || `https://www.wikidata.org/wiki/${item.id}`,
          description: item.description || `Wikidata entity: ${item.label}`,
          favicon: "https://www.google.com/s2/favicons?domain=wikidata.org&sz=32",
          type: "wikidata",
        });
      }
    }
    
    return { entities, results };
  } catch (error) {
    console.error("Wikidata error:", error);
    return { entities: [], results: [] };
  }
}

// Open Library API - books
async function searchOpenLibrary(query: string): Promise<SearchResult[]> {
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8`;
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    return (data.docs || []).slice(0, 8).map((book: any) => ({
      title: book.title,
      url: `https://openlibrary.org${book.key}`,
      description: `${book.author_name?.join(", ") || "Unknown author"}${book.first_publish_year ? ` (${book.first_publish_year})` : ""}`,
      favicon: "https://www.google.com/s2/favicons?domain=openlibrary.org&sz=32",
      thumbnail: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : undefined,
      type: "book",
    }));
  } catch (error) {
    console.error("Open Library error:", error);
    return [];
  }
}

// arXiv API - academic papers
async function searchArxiv(query: string, limit: number = 5): Promise<SearchResult[]> {
  try {
    const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${limit}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const text = await response.text();
    const results: SearchResult[] = [];
    
    // Parse XML entries
    const entries = text.match(/<entry>[\s\S]*?<\/entry>/g) || [];
    for (const entry of entries) {
      const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/\s+/g, " ").trim();
      const id = entry.match(/<id>([\s\S]*?)<\/id>/)?.[1];
      const summary = entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.replace(/\s+/g, " ").trim().substring(0, 200);
      const authors = entry.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/g)?.map(a => a.match(/<name>([\s\S]*?)<\/name>/)?.[1]).filter(Boolean).slice(0, 3).join(", ");
      const published = entry.match(/<published>([\s\S]*?)<\/published>/)?.[1]?.substring(0, 10);
      const categories = entry.match(/<category term="([^"]+)"/g)?.map(c => c.match(/term="([^"]+)"/)?.[1]).filter(Boolean).slice(0, 2).join(", ");
      
      if (title && id) {
        results.push({
          title,
          url: id,
          description: `${authors ? `By ${authors}` : ""}${published ? ` • ${published}` : ""}${categories ? ` • ${categories}` : ""}. ${summary}...`,
          favicon: "https://www.google.com/s2/favicons?domain=arxiv.org&sz=32",
          type: "academic",
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error("arXiv error:", error);
    return [];
  }
}

// PubMed API - medical/biomedical research papers
async function searchPubMed(query: string, limit: number = 5): Promise<SearchResult[]> {
  try {
    // First, search for IDs
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${limit}&retmode=json`;
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) return [];
    
    const searchData = await searchResponse.json();
    const ids = searchData.esearchresult?.idlist || [];
    
    if (ids.length === 0) return [];
    
    // Fetch summaries for the IDs
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
    const summaryResponse = await fetch(summaryUrl);
    if (!summaryResponse.ok) return [];
    
    const summaryData = await summaryResponse.json();
    const results: SearchResult[] = [];
    
    for (const id of ids) {
      const article = summaryData.result?.[id];
      if (article && article.title) {
        const authors = article.authors?.slice(0, 3).map((a: any) => a.name).join(", ") || "";
        const pubDate = article.pubdate || "";
        const source = article.source || "";
        
        results.push({
          title: article.title.replace(/<[^>]*>/g, ""),
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
          description: `${authors ? `By ${authors}` : ""}${pubDate ? ` • ${pubDate}` : ""}${source ? ` • ${source}` : ""}`,
          favicon: "https://www.google.com/s2/favicons?domain=pubmed.ncbi.nlm.nih.gov&sz=32",
          type: "academic",
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error("PubMed error:", error);
    return [];
  }
}

// Wikimedia Commons - free images
async function searchWikimediaCommons(query: string): Promise<SearchResult[]> {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&format=json&srlimit=5&origin=*`;
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    return (data.query?.search || []).map((item: any) => ({
      title: item.title.replace("File:", ""),
      url: `https://commons.wikimedia.org/wiki/${encodeURIComponent(item.title)}`,
      description: item.snippet?.replace(/<[^>]*>/g, "") || "Free media file from Wikimedia Commons",
      favicon: "https://www.google.com/s2/favicons?domain=commons.wikimedia.org&sz=32",
      type: "media",
    }));
  } catch (error) {
    console.error("Wikimedia Commons error:", error);
    return [];
  }
}

// Internet Archive - digital library
async function searchInternetArchive(query: string): Promise<SearchResult[]> {
  try {
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier,title,description,mediatype&rows=5&output=json`;
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    return (data.response?.docs || []).map((item: any) => ({
      title: item.title || item.identifier,
      url: `https://archive.org/details/${item.identifier}`,
      description: item.description?.substring(0, 150) || `${item.mediatype} on Internet Archive`,
      favicon: "https://www.google.com/s2/favicons?domain=archive.org&sz=32",
      type: "archive",
    }));
  } catch (error) {
    console.error("Internet Archive error:", error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, mode, options } = await req.json();
    const searchMode = options?.filter || mode;
    console.log("Search request:", { query, mode, searchMode, options });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const { platforms, categories } = detectPlatformIntent(query);
    console.log("Detected:", { platforms: platforms.map(p => p.name), categories });

    const isAcademicMode = searchMode === "academic";
    const platformResults = isAcademicMode ? [] : generatePlatformResults(query, platforms, categories);

    // For academic mode, prioritize arXiv and PubMed with more results
    if (isAcademicMode) {
      console.log("Academic mode: Searching arXiv and PubMed");
      const [arxivResults, pubmedResults, wikiSummary] = await Promise.all([
        searchArxiv(query, 15),
        searchPubMed(query, 15),
        getWikipediaSummary(query),
      ]);

      console.log("Academic results:", { arxiv: arxivResults.length, pubmed: pubmedResults.length });

      // Interleave arXiv and PubMed results for variety
      const allResults: SearchResult[] = [];
      const seenUrls = new Set<string>();
      const maxLen = Math.max(arxivResults.length, pubmedResults.length);
      
      for (let i = 0; i < maxLen; i++) {
        if (arxivResults[i] && !seenUrls.has(arxivResults[i].url)) {
          seenUrls.add(arxivResults[i].url);
          allResults.push(arxivResults[i]);
        }
        if (pubmedResults[i] && !seenUrls.has(pubmedResults[i].url)) {
          seenUrls.add(pubmedResults[i].url);
          allResults.push(pubmedResults[i]);
        }
      }

      // Add academic search links
      allResults.push(
        { title: `${query} - Google Scholar`, url: `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`, description: `Search academic papers on Google Scholar`, favicon: "https://www.google.com/s2/favicons?domain=scholar.google.com&sz=32", type: "search" },
        { title: `${query} - Semantic Scholar`, url: `https://www.semanticscholar.org/search?q=${encodeURIComponent(query)}`, description: `AI-powered research tool for scientific literature`, favicon: "https://www.google.com/s2/favicons?domain=semanticscholar.org&sz=32", type: "search" },
        { title: `${query} - ResearchGate`, url: `https://www.researchgate.net/search/publication?q=${encodeURIComponent(query)}`, description: `Find publications and connect with researchers`, favicon: "https://www.google.com/s2/favicons?domain=researchgate.net&sz=32", type: "search" },
      );

      // Generate academic-focused AI response
      let aiResponse = "";
      if (LOVABLE_API_KEY) {
        const academicContext = allResults.slice(0, 10).map(r => `- ${r.title}: ${r.description}`).join("\n");
        const aiPrompt = `You are a research assistant. Based on these academic papers and sources about "${query}", provide a helpful summary of the research landscape, key findings, and notable papers. Be concise and cite specific papers when relevant.\n\nSources:\n${academicContext}`;
        
        try {
          const aiRes = await fetch("https://ai.lovable.dev/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${LOVABLE_API_KEY}` },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [{ role: "user", content: aiPrompt }],
              max_tokens: 800,
            }),
          });
          if (aiRes.ok) {
            const aiData = await aiRes.json();
            aiResponse = aiData.choices?.[0]?.message?.content || "";
          }
        } catch (e) { console.error("AI error:", e); }
      }

      return new Response(JSON.stringify({
        webResults: allResults,
        totalResults: allResults.length,
        aiResponse,
        sources: allResults.slice(0, 5).map(r => ({ title: r.title, url: r.url })),
        relatedSearches: [
          `${query} systematic review`,
          `${query} meta-analysis`,
          `${query} recent research`,
          `${query} clinical trials`,
        ],
        knowledgePanel: wikiSummary,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Standard search for non-academic modes
    const searchPromises: Promise<any>[] = [
      searchDuckDuckGo(query),
      searchWikipedia(query),
      getWikipediaSummary(query),
      searchWikidata(query),
    ];

    // Add category-specific searches
    if (categories.includes("books") || categories.includes("academic")) {
      searchPromises.push(searchOpenLibrary(query));
      searchPromises.push(searchArxiv(query, 5));
      searchPromises.push(searchPubMed(query, 5));
    } else {
      searchPromises.push(Promise.resolve([]));
      searchPromises.push(Promise.resolve([]));
      searchPromises.push(Promise.resolve([]));
    }

    searchPromises.push(searchWikimediaCommons(query));
    searchPromises.push(searchInternetArchive(query));

    const [ddgData, wikiResults, wikiSummary, wikidataData, openLibraryResults, arxivResults, pubmedResults, commonsResults, archiveResults] = await Promise.all(searchPromises);

    console.log("API results:", {
      ddg: ddgData.relatedTopics.length,
      wiki: wikiResults.length,
      wikidata: wikidataData.results.length,
      openLibrary: openLibraryResults?.length || 0,
      arxiv: arxivResults?.length || 0,
      pubmed: pubmedResults?.length || 0,
      commons: commonsResults.length,
      archive: archiveResults.length,
    });

    // Combine all results
    const seenUrls = new Set<string>();
    const allResults: SearchResult[] = [];

    const addResults = (results: SearchResult[]) => {
      for (const r of results) {
        if (r.url && !seenUrls.has(r.url)) {
          seenUrls.add(r.url);
          allResults.push(r);
        }
      }
    };

    addResults(platformResults);
    addResults(ddgData.relatedTopics);
    addResults(wikiResults);
    addResults(wikidataData.results);
    if (openLibraryResults?.length) addResults(openLibraryResults);
    if (arxivResults?.length) addResults(arxivResults);
    if (pubmedResults?.length) addResults(pubmedResults);
    addResults(commonsResults);
    addResults(archiveResults);

    // Add useful search links
    const searchLinks: SearchResult[] = [
      { title: `${query} - Google`, url: `https://www.google.com/search?q=${encodeURIComponent(query)}`, description: `Search Google for "${query}"`, favicon: "https://www.google.com/s2/favicons?domain=google.com&sz=32", type: "search" },
      { title: `${query} - Reddit`, url: `https://www.reddit.com/search/?q=${encodeURIComponent(query)}`, description: `Discussions about "${query}" on Reddit`, favicon: "https://www.google.com/s2/favicons?domain=reddit.com&sz=32", type: "social" },
      { title: `${query} - GitHub`, url: `https://github.com/search?q=${encodeURIComponent(query)}`, description: `Code and projects for "${query}"`, favicon: "https://www.google.com/s2/favicons?domain=github.com&sz=32", type: "code" },
      { title: `${query} - Stack Overflow`, url: `https://stackoverflow.com/search?q=${encodeURIComponent(query)}`, description: `Technical Q&A for "${query}"`, favicon: "https://www.google.com/s2/favicons?domain=stackoverflow.com&sz=32", type: "code" },
    ];
    addResults(searchLinks);

    const webResults = allResults.slice(0, 50);
    const sources = webResults.slice(0, 8).map(r => ({
      title: r.title,
      url: r.url,
      domain: new URL(r.url).hostname,
    }));

    const relatedSearches = [
      `${query} meaning`, `${query} examples`, `what is ${query}`,
      `${query} tutorial`, `${query} vs`, `${query} best`,
      `how to ${query}`, `${query} 2024`,
    ].slice(0, 8);

    let aiResponse = "";

    if (mode === "ai" && LOVABLE_API_KEY) {
      console.log("Generating AI response...");
      
      let context = "";
      if (ddgData.abstract) context += `Summary: ${ddgData.abstract}\n\n`;
      if (wikiSummary?.extract) context += `Wikipedia: ${wikiSummary.extract}\n\n`;
      if (wikidataData.entities.length) {
        context += `Wikidata: ${wikidataData.entities.map((e: { label: string; description: string }) => `${e.label}: ${e.description}`).join("; ")}\n\n`;
      }
      context += "Sources:\n" + webResults.slice(0, 8).map((r, i) => `[${i + 1}] ${r.title}: ${r.description}`).join("\n");

      try {
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are Alsamos Search AI. Provide comprehensive answers based on search results. Cite sources [1], [2], etc. Be factual and concise." },
              { role: "user", content: `Query: "${query}"\n\n${context}\n\nProvide a helpful answer with citations.` },
            ],
          }),
        });

        if (aiResp.ok) {
          const aiData = await aiResp.json();
          aiResponse = aiData.choices?.[0]?.message?.content || "";
        } else {
          console.error("AI error:", aiResp.status);
          aiResponse = ddgData.abstract || wikiSummary?.extract || `Found ${webResults.length} results.`;
        }
      } catch (e) {
        console.error("AI error:", e);
        aiResponse = ddgData.abstract || wikiSummary?.extract || `Found ${webResults.length} results.`;
      }
    } else {
      aiResponse = ddgData.abstract || wikiSummary?.extract || (webResults.length ? `Found ${webResults.length} results for "${query}".` : `No results for "${query}".`);
    }

    console.log("Search completed:", webResults.length, "results");
    return new Response(JSON.stringify({
      aiResponse,
      sources,
      webResults,
      relatedSearches,
      totalResults: webResults.length,
      searchTime: Date.now(),
      detectedCategories: categories,
      knowledgePanel: wikiSummary,
      wikidataEntities: wikidataData.entities,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Search error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Search failed",
      aiResponse: "", sources: [], webResults: [], relatedSearches: [],
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
