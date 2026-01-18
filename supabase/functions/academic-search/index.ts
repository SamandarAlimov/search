import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AcademicPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  url: string;
  pdfUrl?: string;
  source: "arxiv" | "pubmed";
  publishedDate?: string;
  citations?: number;
  categories?: string[];
  journal?: string;
  doi?: string;
}

// arXiv API - academic papers with detailed parsing
async function searchArxiv(query: string, category?: string, limit: number = 20): Promise<AcademicPaper[]> {
  try {
    let searchQuery = `all:${encodeURIComponent(query)}`;
    if (category) {
      const categoryMap: Record<string, string> = {
        cs: "cat:cs.*",
        physics: "cat:physics.*",
        biology: "cat:q-bio.*",
        medicine: "cat:q-bio.*",
        neuroscience: "cat:q-bio.NC",
        chemistry: "cat:physics.chem-ph",
      };
      if (categoryMap[category]) {
        searchQuery = `${searchQuery} AND ${categoryMap[category]}`;
      }
    }

    const url = `https://export.arxiv.org/api/query?search_query=${searchQuery}&start=0&max_results=${limit}&sortBy=relevance`;
    console.log("arXiv URL:", url);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error("arXiv response not ok:", response.status);
      return [];
    }
    
    const text = await response.text();
    const results: AcademicPaper[] = [];
    
    const entries = text.match(/<entry>[\s\S]*?<\/entry>/g) || [];
    console.log(`arXiv found ${entries.length} entries`);
    
    for (const entry of entries) {
      const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/\s+/g, " ").trim();
      const id = entry.match(/<id>([\s\S]*?)<\/id>/)?.[1];
      const abstract = entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.replace(/\s+/g, " ").trim();
      const published = entry.match(/<published>([\s\S]*?)<\/published>/)?.[1];
      const doi = entry.match(/<arxiv:doi[^>]*>([\s\S]*?)<\/arxiv:doi>/)?.[1];
      
      // Extract all authors
      const authorMatches = entry.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g) || [];
      const authors = authorMatches.map(a => a.match(/<name>([\s\S]*?)<\/name>/)?.[1]?.trim()).filter(Boolean) as string[];
      
      // Extract categories
      const categoryMatches = entry.match(/<category term="([^"]+)"/g) || [];
      const categories = categoryMatches.map(c => c.match(/term="([^"]+)"/)?.[1]).filter(Boolean) as string[];
      
      if (title && id) {
        const arxivId = id.split("/abs/")[1] || id.split("/").pop() || "";
        // arXiv provides direct PDF links by changing /abs/ to /pdf/
        const pdfUrl = id.replace("/abs/", "/pdf/") + ".pdf";
        
        results.push({
          id: `arxiv-${arxivId}`,
          title,
          authors,
          abstract: abstract || "",
          url: id,
          pdfUrl,
          source: "arxiv",
          publishedDate: published,
          categories: categories.slice(0, 5),
          doi,
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error("arXiv error:", error);
    return [];
  }
}

// PubMed API - medical/biomedical research with detailed info
async function searchPubMed(query: string, category?: string, limit: number = 20): Promise<AcademicPaper[]> {
  try {
    let searchTerm = query;
    if (category) {
      const categoryMap: Record<string, string> = {
        medicine: "[mesh]",
        biology: "biology[mesh]",
        neuroscience: "neuroscience[mesh]",
        chemistry: "chemistry[mesh]",
      };
      if (categoryMap[category]) {
        searchTerm = `${query} ${categoryMap[category]}`;
      }
    }

    // Search for IDs
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchTerm)}&retmax=${limit}&retmode=json&sort=relevance`;
    console.log("PubMed search URL:", searchUrl);
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      console.error("PubMed search not ok:", searchResponse.status);
      return [];
    }
    
    const searchData = await searchResponse.json();
    const ids = searchData.esearchresult?.idlist || [];
    console.log(`PubMed found ${ids.length} IDs`);
    
    if (ids.length === 0) return [];
    
    // Fetch detailed summaries
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
    const summaryResponse = await fetch(summaryUrl);
    if (!summaryResponse.ok) return [];
    
    const summaryData = await summaryResponse.json();
    
    // Fetch abstracts
    const abstractUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(",")}&rettype=abstract&retmode=xml`;
    const abstractResponse = await fetch(abstractUrl);
    const abstractXml = abstractResponse.ok ? await abstractResponse.text() : "";
    
    const results: AcademicPaper[] = [];
    
    for (const id of ids) {
      const article = summaryData.result?.[id];
      if (article && article.title) {
        const authors = article.authors?.map((a: any) => a.name) || [];
        
        // Extract abstract from XML
        const abstractMatch = abstractXml.match(new RegExp(`<PMID[^>]*>${id}</PMID>[\\s\\S]*?<AbstractText[^>]*>([\\s\\S]*?)</AbstractText>`, "i"));
        const abstract = abstractMatch?.[1]?.replace(/<[^>]*>/g, "").trim() || "";
        
        // Extract DOI if available
        const doiMatch = article.articleids?.find((aid: any) => aid.idtype === "doi");
        
        // PubMed Central provides free PDF access for some papers
        const pmcId = article.articleids?.find((aid: any) => aid.idtype === "pmc")?.value;
        const pdfUrl = pmcId ? `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcId}/pdf/` : undefined;
        
        results.push({
          id: `pubmed-${id}`,
          title: article.title.replace(/<[^>]*>/g, ""),
          authors,
          abstract,
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
          pdfUrl,
          source: "pubmed",
          publishedDate: article.pubdate,
          journal: article.source,
          doi: doiMatch?.value,
          citations: article.pmcrefcount || 0,
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error("PubMed error:", error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, category, sortBy } = await req.json();
    console.log("Academic search request:", { query, category, sortBy });

    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // Search both sources in parallel
    const [arxivPapers, pubmedPapers] = await Promise.all([
      searchArxiv(query, category, 15),
      searchPubMed(query, category, 15),
    ]);

    console.log("Results:", { arxiv: arxivPapers.length, pubmed: pubmedPapers.length });

    // Combine and interleave results
    let papers: AcademicPaper[] = [];
    const maxLen = Math.max(arxivPapers.length, pubmedPapers.length);
    
    for (let i = 0; i < maxLen; i++) {
      if (arxivPapers[i]) papers.push(arxivPapers[i]);
      if (pubmedPapers[i]) papers.push(pubmedPapers[i]);
    }

    // Sort if requested
    if (sortBy === "date") {
      papers.sort((a, b) => {
        const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
        const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
        return dateB - dateA;
      });
    } else if (sortBy === "citations") {
      papers.sort((a, b) => (b.citations || 0) - (a.citations || 0));
    }

    // Generate AI summary
    let aiSummary = "";
    if (LOVABLE_API_KEY && papers.length > 0) {
      const context = papers.slice(0, 8).map(p => 
        `- "${p.title}" by ${p.authors.slice(0, 2).join(", ")}${p.authors.length > 2 ? " et al." : ""}: ${p.abstract.substring(0, 150)}...`
      ).join("\n");

      const prompt = `You are a research assistant. Based on these academic papers about "${query}", provide a brief 2-3 sentence summary of the current research landscape and key themes. Be specific and cite paper titles when relevant.

Papers:
${context}`;

      try {
        const aiRes = await fetch("https://ai.lovable.dev/api/chat", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${LOVABLE_API_KEY}` 
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 300,
          }),
        });
        
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          aiSummary = aiData.choices?.[0]?.message?.content || "";
        }
      } catch (e) {
        console.error("AI summary error:", e);
      }
    }

    // Generate related topics
    const relatedTopics = [
      `${query} review`,
      `${query} systematic review`,
      `${query} meta-analysis`,
      `${query} recent advances`,
    ];

    return new Response(JSON.stringify({
      papers,
      totalResults: papers.length,
      aiSummary,
      relatedTopics,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Academic search error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Search failed" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
