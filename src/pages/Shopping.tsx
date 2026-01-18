import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchNavigation } from "@/components/SearchNavigation";
import { 
  ShoppingCart, 
  Star, 
  Truck, 
  AlertCircle, 
  ExternalLink,
  BadgeCheck,
  Heart,
  SlidersHorizontal,
  Grid3X3,
  List
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useShoppingSearch } from "@/hooks/useShoppingSearch";

interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  originalPrice: string | null;
  rating: number;
  reviews: number;
  url: string;
  domain: string;
  image: string;
  store: string | null;
  freeShipping: boolean;
  inStock: boolean;
  prime: boolean;
}

const Shopping = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const { search, isLoading, error, products } = useShoppingSearch();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"relevance" | "price-low" | "price-high" | "rating">("relevance");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (query) {
      search(query);
    }
  }, [query, search]);

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return parseFloat(a.price.replace(/[^0-9.]/g, '')) - parseFloat(b.price.replace(/[^0-9.]/g, ''));
      case "price-high":
        return parseFloat(b.price.replace(/[^0-9.]/g, '')) - parseFloat(a.price.replace(/[^0-9.]/g, ''));
      case "rating":
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-3.5 w-3.5",
              star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showSearch initialQuery={query} />
      <SearchNavigation activeFilter="shopping" />

      <main className="flex-1 container mx-auto px-4 py-6">
        {query ? (
          <>
            {/* Header with filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  Shopping results for "{query}"
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {products.length > 0 
                    ? `${products.length} products found`
                    : isLoading ? "Searching..." : "No products found"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Rating</option>
                </select>

                {/* View Toggle */}
                <div className="flex items-center rounded-lg bg-muted p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      viewMode === "grid" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      viewMode === "list" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="glass-card rounded-2xl p-6 border border-destructive/20 mb-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 text-destructive shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Shopping Search Error</h3>
                    <p className="text-muted-foreground text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="glass-card rounded-xl p-4 animate-pulse">
                    <div className="aspect-square bg-muted rounded-lg mb-3" />
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {/* Products Grid */}
            {!isLoading && sortedProducts.length > 0 && (
              <div className={cn(
                viewMode === "grid" 
                  ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                  : "flex flex-col gap-4"
              )}>
                {sortedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    viewMode={viewMode}
                    isFavorite={favorites.has(product.id)}
                    onToggleFavorite={() => toggleFavorite(product.id)}
                    renderStars={renderStars}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Search for Products
              </h2>
              <p className="text-muted-foreground">
                Enter a search term to find products from across the web
              </p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

interface ProductCardProps {
  product: Product;
  viewMode: "grid" | "list";
  isFavorite: boolean;
  onToggleFavorite: () => void;
  renderStars: (rating: number) => JSX.Element;
}

const ProductCard = ({ product, viewMode, isFavorite, onToggleFavorite, renderStars }: ProductCardProps) => {
  const discount = product.originalPrice 
    ? Math.round((1 - parseFloat(product.price.replace(/[^0-9.]/g, '')) / parseFloat(product.originalPrice.replace(/[^0-9.]/g, ''))) * 100)
    : null;

  if (viewMode === "list") {
    return (
      <div className="glass-card rounded-xl p-4 flex gap-4 group hover:shadow-lg transition-all">
        <div className="relative w-40 h-40 shrink-0">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${product.id}/400/400`;
            }}
          />
          {product.store && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium">
              {product.store}
            </span>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite();
            }}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors"
          >
            <Heart className={cn("h-4 w-4", isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {product.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {product.description}
          </p>
          
          <div className="flex items-center gap-2 mb-2">
            {renderStars(product.rating)}
            <span className="text-xs text-muted-foreground">
              ({product.reviews.toLocaleString()})
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-xl font-bold text-foreground">{product.price}</span>
            {product.originalPrice && (
              <>
                <span className="text-sm text-muted-foreground line-through">{product.originalPrice}</span>
                <span className="text-xs font-medium text-green-500">-{discount}%</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            {product.freeShipping && (
              <span className="flex items-center gap-1">
                <Truck className="h-3.5 w-3.5" />
                Free Shipping
              </span>
            )}
            {product.prime && (
              <span className="flex items-center gap-1 text-blue-500">
                <BadgeCheck className="h-3.5 w-3.5" />
                Prime
              </span>
            )}
            {product.inStock ? (
              <span className="text-green-500">In Stock</span>
            ) : (
              <span className="text-red-500">Out of Stock</span>
            )}
          </div>

          <div className="flex gap-2">
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <ShoppingCart className="h-4 w-4" />
              Buy Now
            </a>
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent/80 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden group hover:shadow-lg transition-all">
      <div className="relative aspect-square">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${product.id}/400/400`;
          }}
        />
        {product.store && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium">
            {product.store}
          </span>
        )}
        {discount && discount > 0 && (
          <span className="absolute top-2 right-10 px-2 py-0.5 rounded-full bg-green-500 text-white text-xs font-medium">
            -{discount}%
          </span>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite();
          }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors opacity-0 group-hover:opacity-100"
        >
          <Heart className={cn("h-4 w-4", isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
        </button>
      </div>

      <div className="p-3">
        <h3 className="font-medium text-foreground line-clamp-2 text-sm mb-1 min-h-[2.5rem]">
          {product.title}
        </h3>
        
        <div className="flex items-center gap-1 mb-2">
          {renderStars(product.rating)}
          <span className="text-xs text-muted-foreground">
            ({product.reviews.toLocaleString()})
          </span>
        </div>

        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="text-lg font-bold text-foreground">{product.price}</span>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">{product.originalPrice}</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          {product.freeShipping && (
            <span className="flex items-center gap-0.5">
              <Truck className="h-3 w-3" />
              Free
            </span>
          )}
          {product.prime && (
            <span className="text-blue-500 font-medium">Prime</span>
          )}
        </div>

        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <ShoppingCart className="h-4 w-4" />
          Buy Now
        </a>
      </div>
    </div>
  );
};

export default Shopping;
