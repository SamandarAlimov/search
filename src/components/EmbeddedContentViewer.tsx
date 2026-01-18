import { useState } from "react";
import { X, ExternalLink, Maximize2, Minimize2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmbeddedContentViewerProps {
  url: string;
  title: string;
  onClose: () => void;
  isFullscreen?: boolean;
}

export const EmbeddedContentViewer = ({
  url,
  title,
  onClose,
  isFullscreen: initialFullscreen = false,
}: EmbeddedContentViewerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(initialFullscreen);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const getEmbedUrl = (originalUrl: string): string | null => {
    try {
      const urlObj = new URL(originalUrl);
      
      // YouTube
      const ytMatch = originalUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (ytMatch) {
        return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
      }
      
      // Vimeo
      const vimeoMatch = originalUrl.match(/vimeo\.com\/(\d+)/);
      if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
      }
      
      // Twitter/X - use publish.twitter.com embed
      if (urlObj.hostname.includes('twitter.com') || urlObj.hostname.includes('x.com')) {
        return `https://platform.twitter.com/embed/Tweet.html?id=${originalUrl.split('/').pop()}&theme=dark`;
      }
      
      // Instagram - oEmbed approach with iframe
      if (urlObj.hostname.includes('instagram.com')) {
        return `${originalUrl}embed/`;
      }
      
      // TikTok
      if (urlObj.hostname.includes('tiktok.com')) {
        const videoId = originalUrl.match(/video\/(\d+)/)?.[1];
        if (videoId) {
          return `https://www.tiktok.com/embed/${videoId}`;
        }
      }
      
      // Dailymotion
      const dmMatch = originalUrl.match(/dailymotion\.com\/video\/([a-z0-9]+)/i);
      if (dmMatch) {
        return `https://www.dailymotion.com/embed/video/${dmMatch[1]}`;
      }
      
      // Spotify
      if (urlObj.hostname.includes('spotify.com')) {
        return originalUrl.replace('spotify.com', 'spotify.com/embed');
      }
      
      // SoundCloud
      if (urlObj.hostname.includes('soundcloud.com')) {
        return `https://w.soundcloud.com/player/?url=${encodeURIComponent(originalUrl)}&color=%23f26c21&auto_play=true`;
      }
      
      // For other sites, try direct iframe (may be blocked by X-Frame-Options)
      return originalUrl;
    } catch {
      return originalUrl;
    }
  };

  const embedUrl = getEmbedUrl(url);
  const canEmbed = embedUrl !== null;

  return (
    <div
      className={cn(
        "fixed z-50 bg-background border border-border shadow-2xl rounded-lg overflow-hidden flex flex-col transition-all duration-300",
        isFullscreen
          ? "inset-4"
          : "right-4 bottom-4 w-[600px] h-[450px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-100px)]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
        <div className="flex-1 min-w-0 mr-4">
          <h3 className="font-medium text-sm text-foreground truncate">{title}</h3>
          <p className="text-xs text-muted-foreground truncate">{url}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsLoading(true)}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
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
            onClick={() => window.open(url, "_blank")}
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative bg-black/5 dark:bg-white/5">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading content...</p>
            </div>
          </div>
        )}
        
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <div className="text-center p-6">
              <p className="text-muted-foreground mb-4">
                This content cannot be embedded directly.
              </p>
              <Button onClick={() => window.open(url, "_blank")}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in new tab
              </Button>
            </div>
          </div>
        ) : canEmbed ? (
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError(true);
            }}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <div className="text-center p-6">
              <p className="text-muted-foreground mb-4">
                Cannot embed this content
              </p>
              <Button onClick={() => window.open(url, "_blank")}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in new tab
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
