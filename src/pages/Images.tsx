import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchNavigation } from "@/components/SearchNavigation";
import { ZoomIn, AlertCircle } from "lucide-react";
import { useImageSearch } from "@/hooks/useImageSearch";
import { ImageLightbox } from "@/components/ImageLightbox";

interface ImageResult {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  source: string;
  domain: string;
  width: number;
  height: number;
}

const Images = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const { search, loadMore, isLoading, error, images, hasMore } = useImageSearch();
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query) {
      search(query);
    }
  }, [query, search]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && query) {
          loadMore(query);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, isLoading, query, loadMore]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showSearch initialQuery={query} />
      <SearchNavigation activeFilter="images" />

      <main className="flex-1 container mx-auto px-4 py-6">
        {query ? (
          <>
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-foreground">
                Images for "{query}"
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {images.length > 0 
                  ? `${images.length} images found from real websites`
                  : isLoading ? "Searching..." : "No images found"}
              </p>
            </div>

            {/* Error State */}
            {error && (
              <div className="glass-card rounded-2xl p-6 border border-destructive/20 mb-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 text-destructive shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Image Search Error</h3>
                    <p className="text-muted-foreground text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Masonry Grid */}
            {images.length > 0 && (
              <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="break-inside-avoid group cursor-pointer"
                    onClick={() => setSelectedImage(image)}
                  >
                    <div className="relative rounded-xl overflow-hidden bg-muted">
                      <img
                        src={image.thumbnail || image.url}
                        alt={image.title}
                        className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-sm font-medium text-foreground truncate">
                            {image.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {image.domain}
                          </p>
                        </div>
                        <button className="absolute top-2 right-2 p-2 rounded-full bg-background/80 hover:bg-background transition-colors">
                          <ZoomIn className="h-4 w-4 text-foreground" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Loading / Load More Trigger */}
            <div ref={loadMoreRef} className="py-8 flex justify-center">
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Loading images...
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <ZoomIn className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Search for Images
              </h2>
              <p className="text-muted-foreground">
                Enter a search term to find real images from the web
              </p>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Image Lightbox */}
      <ImageLightbox
        image={selectedImage}
        images={images}
        onClose={() => setSelectedImage(null)}
        onNavigate={setSelectedImage}
      />
    </div>
  );
};

export default Images;
