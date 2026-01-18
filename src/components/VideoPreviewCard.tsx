import { useState, useRef, useEffect } from "react";
import { Play, Clock, Eye } from "lucide-react";
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

interface VideoPreviewCardProps {
  video: VideoResult;
  onClick: () => void;
  formatDate: (date: string) => string;
}

// Extract video ID for generating preview thumbnails
const getVideoId = (url: string): { platform: string; id: string } | null => {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|invidious[^/]*\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return { platform: 'youtube', id: ytMatch[1] };
  
  // Invidious instances
  const invMatch = url.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
  if (invMatch) return { platform: 'youtube', id: invMatch[1] };
  
  return null;
};

// Generate storyboard preview URLs for YouTube videos
const getPreviewThumbnails = (videoId: string): string[] => {
  // YouTube provides multiple thumbnails at different positions
  return [
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/1.jpg`,
    `https://i.ytimg.com/vi/${videoId}/2.jpg`,
    `https://i.ytimg.com/vi/${videoId}/3.jpg`,
  ];
};

export function VideoPreviewCard({ video, onClick, formatDate }: VideoPreviewCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Setup preview images based on video platform
  useEffect(() => {
    const videoInfo = getVideoId(video.url);
    if (videoInfo?.platform === 'youtube') {
      const thumbs = getPreviewThumbnails(videoInfo.id);
      setPreviewImages(thumbs);
      
      // Preload images
      const loadPromises = thumbs.map(src => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src;
        });
      });
      
      Promise.all(loadPromises).then(() => setImagesLoaded(true));
    }
  }, [video.url]);

  // Handle hover animation
  useEffect(() => {
    if (isHovering && previewImages.length > 1 && imagesLoaded) {
      intervalRef.current = setInterval(() => {
        setPreviewIndex((prev) => (prev + 1) % previewImages.length);
      }, 800); // Change image every 800ms
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setPreviewIndex(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isHovering, previewImages.length, imagesLoaded]);

  const currentThumbnail = isHovering && previewImages.length > 0 && imagesLoaded
    ? previewImages[previewIndex]
    : video.thumbnail;

  return (
    <article
      className="group cursor-pointer"
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-3">
        {/* Main thumbnail with fade transition */}
        <div className="relative w-full h-full">
          <img
            src={currentThumbnail}
            alt={video.title}
            className={cn(
              "w-full h-full object-cover transition-all duration-300",
              isHovering && "scale-105"
            )}
            loading="lazy"
          />
          
          {/* Preview indicator dots */}
          {isHovering && previewImages.length > 1 && imagesLoaded && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {previewImages.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-200",
                    idx === previewIndex
                      ? "bg-white scale-125"
                      : "bg-white/50"
                  )}
                />
              ))}
            </div>
          )}

          {/* Preview progress bar */}
          {isHovering && previewImages.length > 1 && imagesLoaded && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
              <div
                className="h-full bg-primary transition-all duration-700 ease-linear"
                style={{
                  width: `${((previewIndex + 1) / previewImages.length) * 100}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Duration badge */}
        <div className={cn(
          "absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded transition-opacity",
          isHovering && previewImages.length > 1 && "opacity-0"
        )}>
          {video.duration}
        </div>

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center pointer-events-none">
          <div className={cn(
            "w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center transition-all duration-300",
            isHovering ? "opacity-100 scale-100" : "opacity-0 scale-90"
          )}>
            <Play className="h-6 w-6 text-primary-foreground fill-current ml-1" />
          </div>
        </div>

        {/* Watch on Alsamos badge */}
        <div className={cn(
          "absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs font-medium px-2 py-1 rounded transition-all duration-300",
          isHovering ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        )}>
          Watch here
        </div>

        {/* Preview indicator */}
        {isHovering && previewImages.length > 1 && imagesLoaded && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Preview
          </div>
        )}
      </div>
      
      <h3 className="font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-1">
        {video.title}
      </h3>
      
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="font-medium text-primary/80">{video.source}</span>
        {video.views && (
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {video.views} views
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDate(video.publishedAt)}
        </span>
      </div>
    </article>
  );
}
