import { useState, useEffect, useCallback } from "react";
import { 
  X, 
  Download, 
  ExternalLink, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Info,
  Share2,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageData {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  source: string;
  domain: string;
  width: number;
  height: number;
}

interface ImageLightboxProps {
  image: ImageData | null;
  images?: ImageData[];
  onClose: () => void;
  onNavigate?: (image: ImageData) => void;
}

export function ImageLightbox({ image, images = [], onClose, onNavigate }: ImageLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const currentIndex = images.findIndex(img => img.id === image?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const resetTransform = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handlePrev = useCallback(() => {
    if (hasPrev && onNavigate) {
      resetTransform();
      setImageLoaded(false);
      onNavigate(images[currentIndex - 1]);
    }
  }, [hasPrev, currentIndex, images, onNavigate, resetTransform]);

  const handleNext = useCallback(() => {
    if (hasNext && onNavigate) {
      resetTransform();
      setImageLoaded(false);
      onNavigate(images[currentIndex + 1]);
    }
  }, [hasNext, currentIndex, images, onNavigate, resetTransform]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          handlePrev();
          break;
        case "ArrowRight":
          handleNext();
          break;
        case "+":
        case "=":
          setZoom(z => Math.min(z + 0.25, 4));
          break;
        case "-":
          setZoom(z => Math.max(z - 0.25, 0.5));
          break;
        case "r":
          setRotation(r => r + 90);
          break;
        case "0":
          resetTransform();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, handlePrev, handleNext, resetTransform]);

  const handleDownload = async () => {
    if (!image) return;
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${image.title || 'image'}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      // Fallback: open in new tab
      window.open(image.url, '_blank');
    }
  };

  const handleShare = async () => {
    if (!image) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: image.title,
          url: image.source,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(image.source);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.min(Math.max(z + delta, 0.5), 4));
  };

  if (!image) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-background/98 backdrop-blur-xl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-background/80 to-transparent z-10">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {images.length > 1 && (
              <span className="px-2 py-1 rounded-md bg-muted">
                {currentIndex + 1} / {images.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Zoom Controls */}
            <button
              onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Zoom out (-)"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <span className="px-2 text-sm text-muted-foreground min-w-[4rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(z + 0.25, 4))}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Zoom in (+)"
            >
              <ZoomIn className="h-5 w-5" />
            </button>

            <div className="w-px h-6 bg-border mx-2" />

            <button
              onClick={() => setRotation(r => r + 90)}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Rotate (R)"
            >
              <RotateCw className="h-5 w-5" />
            </button>
            <button
              onClick={resetTransform}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Reset (0)"
            >
              <Maximize2 className="h-5 w-5" />
            </button>

            <div className="w-px h-6 bg-border mx-2" />

            <button
              onClick={() => setShowInfo(!showInfo)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                showInfo ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground hover:text-foreground"
              )}
              title="Info (I)"
            >
              <Info className="h-5 w-5" />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Share"
            >
              <Share2 className="h-5 w-5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Download"
            >
              <Download className="h-5 w-5" />
            </button>
            <a
              href={image.source}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Open source"
            >
              <ExternalLink className="h-5 w-5" />
            </a>

            <div className="w-px h-6 bg-border mx-2" />

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Close (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {hasPrev && (
        <button
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground transition-all z-10 shadow-lg"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {hasNext && (
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground transition-all z-10 shadow-lg"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Main Image */}
      <div 
        className="absolute inset-0 flex items-center justify-center pt-16 pb-4 px-4"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div 
          className={cn(
            "relative max-w-full max-h-full flex",
            zoom > 1 && "cursor-grab",
            isDragging && "cursor-grabbing"
          )}
        >
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <img
            src={image.url}
            alt={image.title}
            className={cn(
              "max-w-[90vw] max-h-[85vh] object-contain rounded-lg transition-all duration-200",
              !imageLoaded && "opacity-0"
            )}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            }}
            onLoad={() => setImageLoaded(true)}
            draggable={false}
          />

          {/* Info Panel */}
          {showInfo && (
            <div className="absolute top-0 right-0 w-80 glass-card rounded-xl p-4 m-4 space-y-4 animate-fade-in">
              <h3 className="font-semibold text-foreground line-clamp-2">
                {image.title}
              </h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Source</p>
                  <a 
                    href={image.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:text-primary transition-colors"
                  >
                    {image.domain}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Dimensions</p>
                  <p className="text-foreground">{image.width} × {image.height} px</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <a
                  href={image.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center p-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent/80 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/80 to-transparent">
        <div className="container mx-auto">
          <p className="text-sm text-muted-foreground truncate text-center">
            {image.title} • {image.domain}
          </p>
        </div>
      </div>
    </div>
  );
}
