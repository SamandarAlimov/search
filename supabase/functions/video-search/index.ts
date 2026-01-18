const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// Updated list of working Invidious instances (Jan 2025)
const INVIDIOUS_INSTANCES = [
  'https://vid.puffyan.us',
  'https://yewtu.be',
  'https://invidious.kavin.rocks',
  'https://inv.vern.cc',
  'https://invidious.privacydev.net',
  'https://iv.ggtyler.dev',
  'https://invidious.nerdvpn.de',
  'https://invidious.slipfox.xyz',
];

// Piped instances as backup for YouTube
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.yt',
  'https://pipedapi.in.projectsegfau.lt',
];

async function searchInvidious(query: string, limit: number): Promise<VideoResult[]> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      console.log(`Trying Invidious: ${instance}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(
        `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort_by=relevance`,
        { 
          signal: controller.signal,
          headers: { 
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      );
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.log(`${instance} returned ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const videos = data.filter((item: any) => item.type === 'video').slice(0, limit);
      
      if (videos.length === 0) continue;
      
      console.log(`Got ${videos.length} YouTube videos from ${instance}`);
      
      return videos.map((item: any) => ({
        title: item.title || 'Untitled',
        url: `https://www.youtube.com/watch?v=${item.videoId}`,
        thumbnail: item.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
        duration: formatDuration(item.lengthSeconds || 0),
        source: 'YouTube',
        publishedAt: item.publishedText || 'Unknown',
        views: formatViews(item.viewCount || 0),
        description: item.description?.substring(0, 200) || '',
      }));
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      console.log(`Invidious ${instance} error:`, errMsg);
      continue;
    }
  }
  return [];
}

async function searchPiped(query: string, limit: number): Promise<VideoResult[]> {
  for (const instance of PIPED_INSTANCES) {
    try {
      console.log(`Trying Piped: ${instance}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(
        `${instance}/search?q=${encodeURIComponent(query)}&filter=videos`,
        { 
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        }
      );
      clearTimeout(timeoutId);
      
      if (!response.ok) continue;
      
      const data = await response.json();
      const items = (data.items || []).filter((i: any) => i.type === 'stream').slice(0, limit);
      
      if (items.length === 0) continue;
      
      console.log(`Got ${items.length} YouTube videos from Piped`);
      
      return items.map((item: any) => {
        const videoId = item.url?.replace('/watch?v=', '') || '';
        return {
          title: item.title || 'Untitled',
          url: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          duration: formatDuration(item.duration || 0),
          source: 'YouTube',
          publishedAt: item.uploadedDate || 'Unknown',
          views: formatViews(item.views || 0),
          description: item.shortDescription?.substring(0, 200) || '',
        };
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      console.log(`Piped ${instance} error:`, errMsg);
      continue;
    }
  }
  return [];
}

async function searchDailymotion(query: string, limit: number): Promise<VideoResult[]> {
  try {
    console.log('Searching Dailymotion...');
    const response = await fetch(
      `https://api.dailymotion.com/videos?search=${encodeURIComponent(query)}&limit=${limit}&fields=id,title,description,thumbnail_480_url,duration,created_time,views_total`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const videos = data.list || [];
    
    console.log(`Got ${videos.length} Dailymotion videos`);
    
    return videos.map((item: any) => ({
      title: item.title || 'Untitled',
      url: `https://www.dailymotion.com/video/${item.id}`,
      thumbnail: item.thumbnail_480_url || '',
      duration: formatDuration(item.duration || 0),
      source: 'Dailymotion',
      publishedAt: item.created_time ? new Date(item.created_time * 1000).toLocaleDateString() : 'Unknown',
      views: formatViews(item.views_total || 0),
      description: item.description?.substring(0, 200) || '',
    }));
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.log('Dailymotion error:', errMsg);
    return [];
  }
}

async function searchArchiveOrg(query: string, limit: number): Promise<VideoResult[]> {
  try {
    console.log('Searching Archive.org...');
    const response = await fetch(
      `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+mediatype:movies&fl=identifier,title,description,date,downloads&sort=downloads+desc&rows=${limit}&output=json`
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const docs = data.response?.docs || [];
    
    console.log(`Got ${docs.length} Archive.org videos`);
    
    return docs.map((item: any) => ({
      title: item.title || item.identifier,
      url: `https://archive.org/details/${item.identifier}`,
      thumbnail: `https://archive.org/services/img/${item.identifier}`,
      duration: 'N/A',
      source: 'Archive.org',
      publishedAt: item.date || 'Unknown',
      views: item.downloads ? `${formatViews(item.downloads)} downloads` : undefined,
      description: typeof item.description === 'string' ? item.description.substring(0, 200) : '',
    }));
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.log('Archive.org error:', errMsg);
    return [];
  }
}

async function searchPeerTube(query: string, limit: number): Promise<VideoResult[]> {
  const instances = [
    'https://framatube.org',
    'https://peertube.social',
    'https://video.ploud.fr',
  ];
  
  for (const instance of instances) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(
        `${instance}/api/v1/search/videos?search=${encodeURIComponent(query)}&count=${limit}`,
        { 
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        }
      );
      clearTimeout(timeoutId);
      
      if (!response.ok) continue;
      
      const data = await response.json();
      const videos = data.data || [];
      
      if (videos.length === 0) continue;
      
      console.log(`Got ${videos.length} PeerTube videos from ${instance}`);
      
      return videos.map((item: any) => ({
        title: item.name || 'Untitled',
        url: item.url || `${instance}/w/${item.uuid}`,
        thumbnail: item.thumbnailPath ? `${instance}${item.thumbnailPath}` : '',
        duration: formatDuration(item.duration || 0),
        source: 'PeerTube',
        publishedAt: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : 'Unknown',
        views: formatViews(item.views || 0),
        description: item.description?.substring(0, 200) || '',
      }));
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      console.log(`PeerTube ${instance} error:`, errMsg);
      continue;
    }
  }
  return [];
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return 'N/A';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatViews(count: number): string {
  if (!count) return '0';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M views`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K views`;
  return `${count} views`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, options = {} } = await req.json();
    const limit = options.limit || 20;

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Video search: "${query}", limit: ${limit}`);

    // Search all sources in parallel
    const [invidiousResults, pipedResults, dailymotionResults, archiveResults, peertubeResults] = await Promise.all([
      searchInvidious(query, Math.ceil(limit / 2)),
      searchPiped(query, Math.ceil(limit / 2)),
      searchDailymotion(query, Math.ceil(limit / 4)),
      searchArchiveOrg(query, Math.ceil(limit / 4)),
      searchPeerTube(query, Math.ceil(limit / 4)),
    ]);

    // Use Invidious results, fallback to Piped for YouTube
    const youtubeResults = invidiousResults.length > 0 ? invidiousResults : pipedResults;
    
    console.log(`Sources - YouTube: ${youtubeResults.length}, Dailymotion: ${dailymotionResults.length}, Archive: ${archiveResults.length}, PeerTube: ${peertubeResults.length}`);

    // Interleave results (YouTube first, then others)
    const allVideos: VideoResult[] = [];
    const sources = [youtubeResults, dailymotionResults, archiveResults, peertubeResults];
    const maxLen = Math.max(...sources.map(s => s.length));

    for (let i = 0; i < maxLen; i++) {
      for (const source of sources) {
        if (source[i]) allVideos.push(source[i]);
      }
    }

    // Remove duplicates by URL
    const seen = new Set<string>();
    const videos = allVideos.filter(v => {
      if (seen.has(v.url)) return false;
      seen.add(v.url);
      return true;
    }).slice(0, limit);

    console.log(`Returning ${videos.length} unique videos`);

    return new Response(
      JSON.stringify({
        success: true,
        videos,
        total: videos.length,
        query,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Video search failed';
    console.error('Video search error:', errMsg);
    return new Response(
      JSON.stringify({ success: false, error: errMsg, videos: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
