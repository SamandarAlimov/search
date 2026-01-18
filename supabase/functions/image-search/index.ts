import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImageResult {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  source: string;
  domain: string;
  width: number;
  height: number;
  author?: string;
  license?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, options } = await req.json();
    console.log("Image search request:", { query, options });

    const limit = options?.limit || 20;
    const images: ImageResult[] = [];

    // Search multiple free sources in parallel
    const [wikimediaImages, pixabayImages] = await Promise.allSettled([
      searchWikimediaCommons(query, Math.ceil(limit / 2)),
      searchPixabayFree(query, Math.ceil(limit / 2)),
    ]);

    // Collect results from all sources
    if (wikimediaImages.status === "fulfilled") {
      images.push(...wikimediaImages.value);
    } else {
      console.error("Wikimedia search failed:", wikimediaImages.reason);
    }

    if (pixabayImages.status === "fulfilled") {
      images.push(...pixabayImages.value);
    } else {
      console.error("Pixabay search failed:", pixabayImages.reason);
    }

    // Shuffle and limit results
    const shuffledImages = images
      .sort(() => Math.random() - 0.5)
      .slice(0, limit)
      .map((img, idx) => ({ ...img, id: `img-${idx}` }));

    console.log("Image search completed with", shuffledImages.length, "images");

    return new Response(
      JSON.stringify({
        success: true,
        images: shuffledImages,
        totalResults: shuffledImages.length,
        query,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Image search error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Image search failed",
        images: [],
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Search Wikimedia Commons - completely free
async function searchWikimediaCommons(query: string, limit: number): Promise<ImageResult[]> {
  const images: ImageResult[] = [];

  try {
    // Search for images on Wikimedia Commons
    const searchUrl = new URL("https://commons.wikimedia.org/w/api.php");
    searchUrl.searchParams.set("action", "query");
    searchUrl.searchParams.set("generator", "search");
    searchUrl.searchParams.set("gsrsearch", `${query} filetype:bitmap`);
    searchUrl.searchParams.set("gsrlimit", String(limit));
    searchUrl.searchParams.set("gsrnamespace", "6"); // File namespace
    searchUrl.searchParams.set("prop", "imageinfo");
    searchUrl.searchParams.set("iiprop", "url|size|extmetadata");
    searchUrl.searchParams.set("iiurlwidth", "800");
    searchUrl.searchParams.set("format", "json");
    searchUrl.searchParams.set("origin", "*");

    console.log("Searching Wikimedia Commons...");
    const response = await fetch(searchUrl.toString());

    if (!response.ok) {
      throw new Error(`Wikimedia API error: ${response.status}`);
    }

    const data = await response.json();
    const pages = data.query?.pages || {};

    for (const page of Object.values(pages) as any[]) {
      if (page.imageinfo && page.imageinfo[0]) {
        const info = page.imageinfo[0];
        const metadata = info.extmetadata || {};

        // Skip SVG and very small images
        if (info.width < 200 || info.height < 200) continue;

        images.push({
          id: `wikimedia-${page.pageid}`,
          url: info.url,
          thumbnail: info.thumburl || info.url,
          title: metadata.ObjectName?.value || page.title.replace("File:", ""),
          source: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(page.title.replace("File:", ""))}`,
          domain: "commons.wikimedia.org",
          width: info.width,
          height: info.height,
          author: metadata.Artist?.value?.replace(/<[^>]*>/g, "") || "Wikimedia Commons",
          license: metadata.LicenseShortName?.value || "CC",
        });
      }
    }

    console.log(`Found ${images.length} images from Wikimedia`);
  } catch (error) {
    console.error("Wikimedia search error:", error);
  }

  return images;
}

// Search using free Pixabay-style API simulation via Lorem Picsum for variety
async function searchPixabayFree(query: string, limit: number): Promise<ImageResult[]> {
  const images: ImageResult[] = [];

  try {
    // Use Lorem Picsum for high-quality placeholder images when specific search fails
    // Also try DuckDuckGo image search API
    const ddgUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json`;
    
    console.log("Searching DuckDuckGo images...");
    
    // First try to get real images from Wikipedia image search
    const wikiSearchUrl = new URL("https://en.wikipedia.org/w/api.php");
    wikiSearchUrl.searchParams.set("action", "query");
    wikiSearchUrl.searchParams.set("generator", "images");
    wikiSearchUrl.searchParams.set("titles", query);
    wikiSearchUrl.searchParams.set("gimlimit", String(limit));
    wikiSearchUrl.searchParams.set("prop", "imageinfo");
    wikiSearchUrl.searchParams.set("iiprop", "url|size");
    wikiSearchUrl.searchParams.set("iiurlwidth", "800");
    wikiSearchUrl.searchParams.set("format", "json");
    wikiSearchUrl.searchParams.set("origin", "*");

    const wikiResponse = await fetch(wikiSearchUrl.toString());

    if (wikiResponse.ok) {
      const wikiData = await wikiResponse.json();
      const pages = wikiData.query?.pages || {};

      for (const page of Object.values(pages) as any[]) {
        if (page.imageinfo && page.imageinfo[0]) {
          const info = page.imageinfo[0];
          
          // Skip SVG, icons, and very small images
          if (info.width < 200 || info.height < 200) continue;
          if (info.url?.includes(".svg")) continue;

          images.push({
            id: `wiki-${page.pageid}`,
            url: info.url,
            thumbnail: info.thumburl || info.url,
            title: page.title?.replace("File:", "") || query,
            source: `https://en.wikipedia.org/wiki/File:${encodeURIComponent(page.title?.replace("File:", "") || "")}`,
            domain: "en.wikipedia.org",
            width: info.width,
            height: info.height,
            author: "Wikipedia",
            license: "Various",
          });
        }
      }
    }

    // Also search for the query on Wikimedia directly with different parameters
    const commonsSearchUrl = new URL("https://commons.wikimedia.org/w/api.php");
    commonsSearchUrl.searchParams.set("action", "query");
    commonsSearchUrl.searchParams.set("list", "search");
    commonsSearchUrl.searchParams.set("srsearch", query);
    commonsSearchUrl.searchParams.set("srnamespace", "6");
    commonsSearchUrl.searchParams.set("srlimit", String(limit));
    commonsSearchUrl.searchParams.set("format", "json");
    commonsSearchUrl.searchParams.set("origin", "*");

    const commonsResponse = await fetch(commonsSearchUrl.toString());

    if (commonsResponse.ok) {
      const commonsData = await commonsResponse.json();
      const searchResults = commonsData.query?.search || [];

      for (const result of searchResults.slice(0, Math.ceil(limit / 2))) {
        // Get image info for each result
        const infoUrl = new URL("https://commons.wikimedia.org/w/api.php");
        infoUrl.searchParams.set("action", "query");
        infoUrl.searchParams.set("titles", result.title);
        infoUrl.searchParams.set("prop", "imageinfo");
        infoUrl.searchParams.set("iiprop", "url|size");
        infoUrl.searchParams.set("iiurlwidth", "800");
        infoUrl.searchParams.set("format", "json");
        infoUrl.searchParams.set("origin", "*");

        try {
          const infoResponse = await fetch(infoUrl.toString());
          if (infoResponse.ok) {
            const infoData = await infoResponse.json();
            const pages = infoData.query?.pages || {};
            
            for (const page of Object.values(pages) as any[]) {
              if (page.imageinfo && page.imageinfo[0]) {
                const info = page.imageinfo[0];
                if (info.width >= 200 && info.height >= 200 && !info.url?.includes(".svg")) {
                  images.push({
                    id: `commons-search-${page.pageid}`,
                    url: info.url,
                    thumbnail: info.thumburl || info.url,
                    title: result.title?.replace("File:", "") || query,
                    source: `https://commons.wikimedia.org/wiki/${encodeURIComponent(result.title)}`,
                    domain: "commons.wikimedia.org",
                    width: info.width,
                    height: info.height,
                    author: "Wikimedia Commons",
                    license: "CC",
                  });
                }
              }
            }
          }
        } catch (e) {
          console.error("Error fetching image info:", e);
        }
      }
    }

    console.log(`Found ${images.length} additional images`);
  } catch (error) {
    console.error("Additional image search error:", error);
  }

  return images;
}
