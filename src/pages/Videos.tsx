import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Play, X, Maximize2, Minimize2, ExternalLink } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchNavigation } from "@/components/SearchNavigation";
import { VideoPreviewCard } from "@/components/VideoPreviewCard";
import { useVideoSearch } from "@/hooks/useVideoSearch";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export default function Videos() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const { search, isLoading, error, data } = useVideoSearch();
  const [selectedVideo, setSelectedVideo] = useState<VideoResult | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (query) {
      search(query);
    }
  }, [query, search]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const getEmbedUrl = (url: string) => {
    // YouTube embed
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    }
    // Vimeo embed
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }
    // Dailymotion embed
    const dmMatch = url.match(/dailymotion\.com\/video\/([a-z0-9]+)/i);
    if (dmMatch) {
      return `https://www.dailymotion.com/embed/video/${dmMatch[1]}?autoplay=1`;
    }
    // TikTok embed
    const tiktokMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
    if (tiktokMatch) {
      return `https://www.tiktok.com/embed/${tiktokMatch[1]}`;
    }
    return null;
  };

  return (
    <>
      <Helmet>
        <title>{query ? `${query} - Videos` : "Videos"} - Alsamos Search</title>
        <meta name="description" content={`Video search results for ${query}`} />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header showSearch initialQuery={query} />
        <SearchNavigation activeFilter="videos" />

        <main className="flex-1 container max-w-6xl mx-auto px-4 py-6">
          {!query ? (
            <div className="text-center py-20">
              <Play className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h2 className="text-xl font-medium text-muted-foreground">
                Search for videos
              </h2>
              <p className="text-muted-foreground/70 mt-2">
                Enter a search term to find videos from across the web
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-video w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-destructive">{error}</p>
            </div>
          ) : data?.videos && data.videos.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                About {data.total} video results for "{query}" • Watch directly on Alsamos
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.videos.map((video, index) => (
                  <VideoPreviewCard
                    key={index}
                    video={video}
                    onClick={() => setSelectedVideo(video)}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <Play className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h2 className="text-xl font-medium text-muted-foreground">
                No videos found
              </h2>
              <p className="text-muted-foreground/70 mt-2">
                Try different search terms
              </p>
            </div>
          )}
        </main>

        <Footer />

        {/* In-page Video Player */}
        {selectedVideo && (
          <div
            className={cn(
              "fixed z-50 bg-background border border-border shadow-2xl rounded-lg overflow-hidden flex flex-col transition-all duration-300",
              isFullscreen
                ? "inset-4"
                : "right-4 bottom-4 w-[800px] h-[550px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-100px)]"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
              <div className="flex-1 min-w-0 mr-4">
                <h3 className="font-medium text-sm text-foreground truncate">{selectedVideo.title}</h3>
                <p className="text-xs text-muted-foreground">{selectedVideo.source} • Watching on Alsamos Search</p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(selectedVideo.url, "_blank")}
                  title="Open original"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setSelectedVideo(null);
                    setIsFullscreen(false);
                  }}
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Video Player */}
            <div className="flex-1 bg-black">
              {getEmbedUrl(selectedVideo.url) ? (
                <iframe
                  src={getEmbedUrl(selectedVideo.url) || ""}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white">
                  <img
                    src={selectedVideo.thumbnail}
                    alt={selectedVideo.title}
                    className="max-w-full max-h-[60%] object-contain mb-4"
                  />
                  <p className="text-sm text-white/70 mb-4">This video cannot be embedded directly</p>
                  <Button onClick={() => window.open(selectedVideo.url, "_blank")}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Watch on {selectedVideo.source}
                  </Button>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="p-4 bg-muted/30 border-t border-border">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {selectedVideo.views && <span>{selectedVideo.views} views</span>}
                <span>{formatDate(selectedVideo.publishedAt)}</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Playing on Alsamos
                </span>
              </div>
              {selectedVideo.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {selectedVideo.description}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
