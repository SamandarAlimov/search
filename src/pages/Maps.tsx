import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import { Icon, LatLngExpression, LatLng } from "leaflet";
import { Search, MapPin, Navigation, Layers, Route, X, Clock, Car, Footprints, Bike, ChevronDown, ChevronUp, AlertTriangle, Zap, Utensils, Hotel, Fuel, Coffee, ShoppingBag, ParkingCircle, Hospital, Loader2, Star, Phone, Globe, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchNavigation } from "@/components/SearchNavigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon
const defaultIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const startIcon = new Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const endIcon = new Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const placeIcon = new Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface SearchResult {
  name: string;
  lat: number;
  lon: number;
  displayName: string;
  type: string;
}

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: string;
}

interface RouteInfo {
  distance: number;
  duration: number;
  steps: RouteStep[];
  coordinates: [number, number][];
}

interface NearbyPlace {
  id: number;
  name: string;
  lat: number;
  lon: number;
  type: string;
  category: string;
  tags: Record<string, string>;
  phone?: string;
  website?: string;
  rating?: number;
  openingHours?: string;
  address?: string;
  cuisine?: string;
}

type PlaceCategory = "restaurant" | "hotel" | "fuel" | "cafe" | "shop" | "parking" | "hospital";

const PLACE_CATEGORIES: { id: PlaceCategory; label: string; icon: React.ElementType; query: string }[] = [
  { id: "restaurant", label: "Restaurants", icon: Utensils, query: '["amenity"="restaurant"]' },
  { id: "hotel", label: "Hotels", icon: Hotel, query: '["tourism"="hotel"]' },
  { id: "fuel", label: "Gas Stations", icon: Fuel, query: '["amenity"="fuel"]' },
  { id: "cafe", label: "Cafes", icon: Coffee, query: '["amenity"="cafe"]' },
  { id: "shop", label: "Shops", icon: ShoppingBag, query: '["shop"]' },
  { id: "parking", label: "Parking", icon: ParkingCircle, query: '["amenity"="parking"]' },
  { id: "hospital", label: "Hospitals", icon: Hospital, query: '["amenity"="hospital"]' },
];

// Route colors for alternatives
const ROUTE_COLORS = {
  primary: "#3b82f6",     // Blue
  alt1: "#8b5cf6",        // Purple
  alt2: "#f59e0b",        // Amber
  inactive: "#9ca3af",    // Gray
};

// Component to handle map movements
function MapController({ center, zoom }: { center: LatLngExpression; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

// Component to fit map to route bounds
function RouteBoundsController({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates.length > 0) {
      const latLngs = coordinates.map(([lat, lon]) => new LatLng(lat, lon));
      map.fitBounds(latLngs.map(ll => [ll.lat, ll.lng] as [number, number]), { padding: [50, 50] });
    }
  }, [coordinates, map]);
  
  return null;
}

const Maps = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([41.2995, 69.2401]);
  const [mapZoom, setMapZoom] = useState(12);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [mapStyle, setMapStyle] = useState<"standard" | "satellite" | "terrain">("standard");
  
  // Directions state
  const [showDirections, setShowDirections] = useState(false);
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [startCoords, setStartCoords] = useState<[number, number] | null>(null);
  const [endCoords, setEndCoords] = useState<[number, number] | null>(null);
  const [allRoutes, setAllRoutes] = useState<RouteInfo[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [travelMode, setTravelMode] = useState<"driving" | "walking" | "cycling">("driving");
  const [showSteps, setShowSteps] = useState(false);
  const [startSuggestions, setStartSuggestions] = useState<SearchResult[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<SearchResult[]>([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);
  
  // Traffic layer state
  const [showTraffic, setShowTraffic] = useState(false);

  // Nearby places state
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory | null>(null);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [showNearbyPanel, setShowNearbyPanel] = useState(false);

  const tileUrls = {
    standard: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    terrain: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
  };

  const osrmProfiles = {
    driving: "car",
    walking: "foot",
    cycling: "bike",
  };

  // Geocode a location string
  const geocodeLocation = async (query: string): Promise<SearchResult[]> => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
    );
    const data = await response.json();
    return data.map((item: any) => ({
      name: item.name || item.display_name.split(",")[0],
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      displayName: item.display_name,
      type: item.type,
    }));
  };

  // Get routes from OSRM with alternatives
  const getRoutes = async (start: [number, number], end: [number, number], mode: string): Promise<RouteInfo[]> => {
    const profile = osrmProfiles[mode as keyof typeof osrmProfiles];
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/${profile}/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true&alternatives=true`
    );
    const data = await response.json();
    
    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      throw new Error("No route found");
    }

    return data.routes.map((route: any) => {
      const coordinates: [number, number][] = route.geometry.coordinates.map(
        ([lon, lat]: [number, number]) => [lat, lon]
      );

      const steps: RouteStep[] = route.legs[0].steps.map((step: any) => ({
        instruction: step.maneuver.instruction || formatManeuver(step.maneuver.type, step.maneuver.modifier),
        distance: step.distance,
        duration: step.duration,
        maneuver: step.maneuver.type,
      }));

      return {
        distance: route.distance,
        duration: route.duration,
        steps,
        coordinates,
      };
    });
  };

  const formatManeuver = (type: string, modifier?: string) => {
    const typeMap: Record<string, string> = {
      depart: "Start",
      arrive: "Arrive at destination",
      turn: `Turn ${modifier || ""}`,
      "new name": "Continue",
      merge: "Merge",
      "on ramp": "Take ramp",
      "off ramp": "Exit",
      fork: `Take the ${modifier || ""} fork`,
      "end of road": `Turn ${modifier || ""}`,
      continue: "Continue straight",
      roundabout: "Enter roundabout",
      rotary: "Enter rotary",
      "roundabout turn": `At roundabout, take ${modifier || ""} exit`,
      notification: "Notice",
      "exit roundabout": "Exit roundabout",
      "exit rotary": "Exit rotary",
    };
    return typeMap[type] || type;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes} min`;
  };

  // Search nearby places using Overpass API
  const searchNearbyPlaces = async (category: PlaceCategory) => {
    const center = Array.isArray(mapCenter) ? mapCenter : [mapCenter.lat, mapCenter.lng];
    const [lat, lon] = center as [number, number];
    const radius = 2000; // 2km radius

    const categoryConfig = PLACE_CATEGORIES.find(c => c.id === category);
    if (!categoryConfig) return;

    setIsLoadingPlaces(true);
    setSelectedCategory(category);
    setShowNearbyPanel(true);

    const query = `
      [out:json][timeout:25];
      (
        node${categoryConfig.query}(around:${radius},${lat},${lon});
        way${categoryConfig.query}(around:${radius},${lat},${lon});
      );
      out body center 50;
    `;

    try {
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      });

      const data = await response.json();
      
      const places: NearbyPlace[] = data.elements
        .filter((el: any) => el.tags?.name)
        .map((el: any) => {
          const tags = el.tags || {};
          // Parse stars rating if available
          let rating: number | undefined;
          if (tags.stars) {
            rating = parseFloat(tags.stars);
          } else if (tags["review_score:value"]) {
            rating = parseFloat(tags["review_score:value"]);
          }
          
          // Build full address
          const addressParts = [
            tags["addr:housenumber"],
            tags["addr:street"],
            tags["addr:city"]
          ].filter(Boolean);
          
          return {
            id: el.id,
            name: tags.name,
            lat: el.lat || el.center?.lat,
            lon: el.lon || el.center?.lon,
            type: tags.amenity || tags.tourism || tags.shop || "place",
            category: category,
            tags: tags,
            phone: tags.phone || tags["contact:phone"],
            website: tags.website || tags["contact:website"] || tags.url,
            rating: rating,
            openingHours: tags.opening_hours,
            address: addressParts.length > 0 ? addressParts.join(" ") : undefined,
            cuisine: tags.cuisine?.replace(/_/g, " "),
          };
        })
        .slice(0, 20);

      setNearbyPlaces(places);
    } catch (error) {
      console.error("Failed to fetch nearby places:", error);
      setNearbyPlaces([]);
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  const clearNearbyPlaces = () => {
    setNearbyPlaces([]);
    setSelectedCategory(null);
    setShowNearbyPanel(false);
  };

  // Get route color based on index and selection
  const getRouteColor = (index: number, isSelected: boolean) => {
    if (!isSelected) return ROUTE_COLORS.inactive;
    if (index === 0) return ROUTE_COLORS.primary;
    if (index === 1) return ROUTE_COLORS.alt1;
    return ROUTE_COLORS.alt2;
  };

  // Get route label
  const getRouteLabel = (index: number) => {
    if (index === 0) return "Fastest";
    return `Alternative ${index}`;
  };

  // Handle location input with debounced suggestions
  const handleLocationInput = async (value: string, isStart: boolean) => {
    if (isStart) {
      setStartLocation(value);
      if (value.length > 2) {
        const suggestions = await geocodeLocation(value);
        setStartSuggestions(suggestions);
        setShowStartSuggestions(true);
      } else {
        setShowStartSuggestions(false);
      }
    } else {
      setEndLocation(value);
      if (value.length > 2) {
        const suggestions = await geocodeLocation(value);
        setEndSuggestions(suggestions);
        setShowEndSuggestions(true);
      } else {
        setShowEndSuggestions(false);
      }
    }
  };

  const selectSuggestion = (result: SearchResult, isStart: boolean) => {
    if (isStart) {
      setStartLocation(result.displayName);
      setStartCoords([result.lat, result.lon]);
      setShowStartSuggestions(false);
    } else {
      setEndLocation(result.displayName);
      setEndCoords([result.lat, result.lon]);
      setShowEndSuggestions(false);
    }
  };

  const handleGetDirections = async () => {
    if (!startCoords || !endCoords) {
      // Try to geocode if coordinates aren't set
      if (startLocation && !startCoords) {
        const results = await geocodeLocation(startLocation);
        if (results.length > 0) {
          setStartCoords([results[0].lat, results[0].lon]);
        }
      }
      if (endLocation && !endCoords) {
        const results = await geocodeLocation(endLocation);
        if (results.length > 0) {
          setEndCoords([results[0].lat, results[0].lon]);
        }
      }
      return;
    }

    setIsLoadingRoute(true);
    try {
      const routes = await getRoutes(startCoords, endCoords, travelMode);
      setAllRoutes(routes);
      setSelectedRouteIndex(0);
      setSearchResults([]);
    } catch (error) {
      console.error("Failed to get route:", error);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Recalculate route when travel mode changes
  useEffect(() => {
    if (startCoords && endCoords && allRoutes.length > 0) {
      handleGetDirections();
    }
  }, [travelMode]);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setStartLocation("Current Location");
          setStartCoords([position.coords.latitude, position.coords.longitude]);
        },
        (error) => console.error("Error getting location:", error)
      );
    }
  };

  const clearDirections = () => {
    setStartLocation("");
    setEndLocation("");
    setStartCoords(null);
    setEndCoords(null);
    setAllRoutes([]);
    setSelectedRouteIndex(0);
    setShowSteps(false);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchParams({ q: query });
    setAllRoutes([]);

    try {
      const results = await geocodeLocation(query);
      setSearchResults(results);

      if (results.length > 0) {
        setMapCenter([results[0].lat, results[0].lon]);
        setMapZoom(14);
        setSelectedResult(results[0]);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setMapCenter([result.lat, result.lon]);
    setMapZoom(16);
    setSelectedResult(result);
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
          setMapZoom(15);
        },
        (error) => console.error("Error getting location:", error)
      );
    }
  };

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      handleSearch();
    }
  }, []);

  const selectedRoute = allRoutes[selectedRouteIndex];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <SearchNavigation activeFilter="maps" />
      
      <main className="flex-1 flex flex-col">
        {/* Search Bar */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-[1000]">
          <div className="container mx-auto px-4 py-3">
            <div className="flex gap-2 max-w-3xl mx-auto">
              {!showDirections ? (
                <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search for places, addresses, or coordinates..."
                      className="pl-10 pr-4"
                    />
                  </div>
                  <Button type="submit" disabled={isSearching}>
                    <Search className="h-4 w-4 mr-2" />
                    {isSearching ? "..." : "Search"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDirections(true)}
                  >
                    <Route className="h-4 w-4 mr-2" />
                    Directions
                  </Button>
                </form>
              ) : (
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 space-y-2">
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-green-500" />
                        <Input
                          value={startLocation}
                          onChange={(e) => handleLocationInput(e.target.value, true)}
                          onFocus={() => startSuggestions.length > 0 && setShowStartSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowStartSuggestions(false), 200)}
                          placeholder="Starting point"
                          className="pl-10"
                        />
                        {showStartSuggestions && startSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-lg shadow-lg z-50 mt-1 max-h-48 overflow-y-auto">
                            {startSuggestions.map((s, i) => (
                              <button
                                key={i}
                                className="w-full text-left px-4 py-2 hover:bg-muted text-sm"
                                onClick={() => selectSuggestion(s, true)}
                              >
                                {s.displayName}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-500" />
                        <Input
                          value={endLocation}
                          onChange={(e) => handleLocationInput(e.target.value, false)}
                          onFocus={() => endSuggestions.length > 0 && setShowEndSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowEndSuggestions(false), 200)}
                          placeholder="Destination"
                          className="pl-10"
                        />
                        {showEndSuggestions && endSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-lg shadow-lg z-50 mt-1 max-h-48 overflow-y-auto">
                            {endSuggestions.map((s, i) => (
                              <button
                                key={i}
                                className="w-full text-left px-4 py-2 hover:bg-muted text-sm"
                                onClick={() => selectSuggestion(s, false)}
                              >
                                {s.displayName}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={handleGetDirections}
                        disabled={isLoadingRoute || !startLocation || !endLocation}
                      >
                        {isLoadingRoute ? "..." : "Go"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setShowDirections(false);
                          clearDirections();
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Travel Mode Tabs */}
                  <div className="flex gap-2 items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUseCurrentLocation}
                      className="text-xs"
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      Use my location
                    </Button>
                    <Tabs value={travelMode} onValueChange={(v) => setTravelMode(v as any)} className="ml-auto">
                      <TabsList className="h-8">
                        <TabsTrigger value="driving" className="h-6 px-2">
                          <Car className="h-3 w-3" />
                        </TabsTrigger>
                        <TabsTrigger value="walking" className="h-6 px-2">
                          <Footprints className="h-3 w-3" />
                        </TabsTrigger>
                        <TabsTrigger value="cycling" className="h-6 px-2">
                          <Bike className="h-3 w-3" />
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Nearby Places Categories */}
        {!showDirections && (
          <div className="border-b border-border bg-card/30 overflow-x-auto">
            <div className="container mx-auto px-4 py-2">
              <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground shrink-0">Nearby:</span>
                {PLACE_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Button
                      key={cat.id}
                      variant={selectedCategory === cat.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => selectedCategory === cat.id ? clearNearbyPlaces() : searchNearbyPlaces(cat.id)}
                      className="shrink-0"
                      disabled={isLoadingPlaces && selectedCategory !== cat.id}
                    >
                      {isLoadingPlaces && selectedCategory === cat.id ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Icon className="h-3 w-3 mr-1" />
                      )}
                      {cat.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div className="flex-1 flex">
          {/* Sidebar */}
          {(searchResults.length > 0 || allRoutes.length > 0 || showNearbyPanel) && (
            <div className="w-80 border-r border-border bg-card overflow-y-auto max-h-[calc(100vh-200px)]">
              <div className="p-4">
                {/* Nearby Places */}
                {showNearbyPanel && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold text-lg flex items-center gap-2">
                        {selectedCategory && (
                          <>
                            {(() => {
                              const cat = PLACE_CATEGORIES.find(c => c.id === selectedCategory);
                              const Icon = cat?.icon;
                              return Icon ? <Icon className="h-5 w-5 text-primary" /> : null;
                            })()}
                            {PLACE_CATEGORIES.find(c => c.id === selectedCategory)?.label}
                          </>
                        )}
                      </h2>
                      <Button variant="ghost" size="sm" onClick={clearNearbyPlaces}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {isLoadingPlaces ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="ml-2 text-sm text-muted-foreground">Searching nearby...</span>
                      </div>
                    ) : nearbyPlaces.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          {nearbyPlaces.length} places found within 2km
                        </p>
                        {nearbyPlaces.map((place) => (
                          <button
                            key={place.id}
                            onClick={() => {
                              setMapCenter([place.lat, place.lon]);
                              setMapZoom(17);
                            }}
                            className="w-full text-left p-3 rounded-lg transition-colors bg-muted/50 hover:bg-muted"
                          >
                            <div className="flex items-start gap-2">
                              {(() => {
                                const cat = PLACE_CATEGORIES.find(c => c.id === place.category);
                                const Icon = cat?.icon || MapPin;
                                return <Icon className="h-4 w-4 mt-1 text-orange-500 shrink-0" />;
                              })()}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-sm truncate">{place.name}</h3>
                                  {place.rating && (
                                    <div className="flex items-center gap-0.5 shrink-0">
                                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                      <span className="text-xs font-medium">{place.rating.toFixed(1)}</span>
                                    </div>
                                  )}
                                </div>
                                {place.cuisine && (
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {place.cuisine}
                                  </p>
                                )}
                                {place.address && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {place.address}
                                  </p>
                                )}
                                {place.openingHours && (
                                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                                    <Clock className="h-3 w-3" />
                                    {place.openingHours}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {place.phone && (
                                    <a
                                      href={`tel:${place.phone}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                      <Phone className="h-3 w-3" />
                                      Call
                                    </a>
                                  )}
                                  {place.website && (
                                    <a
                                      href={place.website.startsWith('http') ? place.website : `https://${place.website}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                      <Globe className="h-3 w-3" />
                                      Website
                                    </a>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEndLocation(place.name);
                                      setEndCoords([place.lat, place.lon]);
                                      setShowDirections(true);
                                      clearNearbyPlaces();
                                    }}
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                  >
                                    <Route className="h-3 w-3" />
                                    Directions
                                  </button>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">No places found nearby</p>
                        <p className="text-xs text-muted-foreground mt-1">Try a different location or category</p>
                      </div>
                    )}
                  </div>
                )}
                {/* Route Info */}
                {allRoutes.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold text-lg">Routes</h2>
                      <Button variant="ghost" size="sm" onClick={clearDirections}>
                        Clear
                      </Button>
                    </div>

                    {/* Alternative Routes Selection */}
                    {allRoutes.length > 1 && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          {allRoutes.length} routes available
                        </p>
                        {allRoutes.map((route, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedRouteIndex(index)}
                            className={`w-full p-3 rounded-lg border transition-all text-left ${
                              selectedRouteIndex === index
                                ? "border-primary bg-primary/10"
                                : "border-border hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: getRouteColor(index, selectedRouteIndex === index) }}
                              />
                              <span className="text-sm font-medium">
                                {getRouteLabel(index)}
                              </span>
                              {index === 0 && (
                                <Zap className="h-3 w-3 text-amber-500" />
                              )}
                            </div>
                            <div className="flex gap-4 text-sm">
                              <span className="font-semibold">{formatDistance(route.distance)}</span>
                              <span className="text-muted-foreground">{formatDuration(route.duration)}</span>
                            </div>
                            {index > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {route.duration > allRoutes[0].duration
                                  ? `+${formatDuration(route.duration - allRoutes[0].duration)} slower`
                                  : `${formatDuration(allRoutes[0].duration - route.duration)} faster`}
                              </p>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Selected Route Details */}
                    {selectedRoute && (
                      <>
                        <div className="bg-primary/10 rounded-lg p-4">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold">{formatDistance(selectedRoute.distance)}</div>
                              <div className="text-xs text-muted-foreground">Distance</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold">{formatDuration(selectedRoute.duration)}</div>
                              <div className="text-xs text-muted-foreground">Duration</div>
                            </div>
                          </div>
                        </div>

                        {/* Traffic Info Notice */}
                        {showTraffic && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                            <div className="text-xs">
                              <p className="font-medium text-amber-600 dark:text-amber-400">Traffic layer enabled</p>
                              <p className="text-muted-foreground">Real-time traffic data is displayed on the map</p>
                            </div>
                          </div>
                        )}

                        {/* Turn-by-turn steps */}
                        <div>
                          <button
                            onClick={() => setShowSteps(!showSteps)}
                            className="flex items-center justify-between w-full py-2 text-sm font-medium"
                          >
                            <span>Turn-by-turn ({selectedRoute.steps.length} steps)</span>
                            {showSteps ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                          
                          {showSteps && (
                            <div className="space-y-2 mt-2">
                              {selectedRoute.steps.map((step, index) => (
                                <div
                                  key={index}
                                  className="flex gap-3 p-2 rounded-lg bg-muted/50 text-sm"
                                >
                                  <div className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1">
                                    <p>{step.instruction}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {formatDistance(step.distance)} · {formatDuration(step.duration)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Search Results */}
                {searchResults.length > 0 && allRoutes.length === 0 && (
                  <>
                    <h2 className="font-semibold text-lg mb-3">
                      {searchResults.length} results found
                    </h2>
                    <div className="space-y-2">
                      {searchResults.map((result, index) => (
                        <button
                          key={index}
                          onClick={() => handleResultClick(result)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedResult?.lat === result.lat && selectedResult?.lon === result.lon
                              ? "bg-primary/10 border border-primary"
                              : "bg-muted/50 hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-1 text-primary shrink-0" />
                            <div>
                              <h3 className="font-medium text-sm">{result.name}</h3>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {result.displayName}
                              </p>
                              <span className="text-xs text-primary/70 capitalize mt-1 inline-block">
                                {result.type}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Map */}
          <div className="flex-1 relative">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              className="h-full w-full"
              style={{ minHeight: "calc(100vh - 200px)" }}
            >
              <MapController center={mapCenter} zoom={mapZoom} />
              {selectedRoute && <RouteBoundsController coordinates={selectedRoute.coordinates} />}
              
              {/* Base tile layer */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url={tileUrls[mapStyle]}
              />
              
              {/* Traffic layer overlay */}
              {showTraffic && (
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  opacity={0.3}
                  className="traffic-overlay"
                />
              )}
              
              {/* Alternative route polylines (render non-selected first) */}
              {allRoutes.map((route, index) => (
                index !== selectedRouteIndex && (
                  <Polyline
                    key={`alt-${index}`}
                    positions={route.coordinates}
                    pathOptions={{
                      color: ROUTE_COLORS.inactive,
                      weight: 4,
                      opacity: 0.5,
                      dashArray: "10, 10",
                    }}
                    eventHandlers={{
                      click: () => setSelectedRouteIndex(index),
                    }}
                  />
                )
              ))}
              
              {/* Selected route polyline (render last to be on top) */}
              {selectedRoute && (
                <Polyline
                  positions={selectedRoute.coordinates}
                  pathOptions={{
                    color: getRouteColor(selectedRouteIndex, true),
                    weight: 6,
                    opacity: 0.9,
                  }}
                />
              )}

              {/* Start and end markers */}
              {startCoords && (
                <Marker position={startCoords} icon={startIcon}>
                  <Popup>Start: {startLocation}</Popup>
                </Marker>
              )}
              {endCoords && (
                <Marker position={endCoords} icon={endIcon}>
                  <Popup>Destination: {endLocation}</Popup>
                </Marker>
              )}

              {/* Search result markers */}
              {searchResults.map((result, index) => (
                <Marker
                  key={index}
                  position={[result.lat, result.lon]}
                  icon={defaultIcon}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-semibold">{result.name}</h3>
                      <p className="text-sm text-gray-600">{result.displayName}</p>
                      <div className="flex gap-2 mt-2">
                        <a
                          href={`https://www.google.com/maps?q=${result.lat},${result.lon}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Open in Google Maps
                        </a>
                        <button
                          onClick={() => {
                            setEndLocation(result.displayName);
                            setEndCoords([result.lat, result.lon]);
                            setShowDirections(true);
                          }}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Get directions
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Nearby places markers */}
              {nearbyPlaces.map((place) => (
                <Marker
                  key={place.id}
                  position={[place.lat, place.lon]}
                  icon={placeIcon}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold">{place.name}</h3>
                        {place.rating && (
                          <div className="flex items-center gap-0.5 shrink-0 bg-amber-100 px-1.5 py-0.5 rounded">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            <span className="text-xs font-medium text-amber-700">{place.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      {place.cuisine && (
                        <p className="text-sm text-gray-600 capitalize">{place.cuisine}</p>
                      )}
                      {place.address && (
                        <p className="text-sm text-gray-600">{place.address}</p>
                      )}
                      {place.openingHours && (
                        <p className="text-xs text-gray-500 mt-1">🕐 {place.openingHours}</p>
                      )}
                      
                      <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-gray-200">
                        {place.phone && (
                          <a
                            href={`tel:${place.phone}`}
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Phone className="h-3 w-3" />
                            {place.phone}
                          </a>
                        )}
                        {place.website && (
                          <a
                            href={place.website.startsWith('http') ? place.website : `https://${place.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Globe className="h-3 w-3" />
                            Visit website
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-2 pt-2 border-t border-gray-200">
                        <a
                          href={`https://www.google.com/maps?q=${place.lat},${place.lon}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Open in Google Maps
                        </a>
                        <button
                          onClick={() => {
                            setEndLocation(place.name);
                            setEndCoords([place.lat, place.lon]);
                            setShowDirections(true);
                            clearNearbyPlaces();
                          }}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Get directions
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Map Controls */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
              <Button
                size="icon"
                variant="secondary"
                onClick={handleGetCurrentLocation}
                className="bg-card shadow-lg"
                title="My Location"
              >
                <Navigation className="h-4 w-4" />
              </Button>
              
              <div className="bg-card rounded-lg shadow-lg p-1 flex flex-col gap-1">
                <Button
                  size="icon"
                  variant={mapStyle === "standard" ? "default" : "ghost"}
                  onClick={() => setMapStyle("standard")}
                  className="h-8 w-8"
                  title="Standard View"
                >
                  <Layers className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant={mapStyle === "satellite" ? "default" : "ghost"}
                  onClick={() => setMapStyle("satellite")}
                  className="h-8 w-8"
                  title="Satellite View"
                >
                  🛰️
                </Button>
                <Button
                  size="icon"
                  variant={mapStyle === "terrain" ? "default" : "ghost"}
                  onClick={() => setMapStyle("terrain")}
                  className="h-8 w-8"
                  title="Terrain View"
                >
                  🏔️
                </Button>
              </div>

              {/* Traffic Toggle */}
              <div className="bg-card rounded-lg shadow-lg p-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="traffic"
                    checked={showTraffic}
                    onCheckedChange={setShowTraffic}
                    className="scale-75"
                  />
                  <Label htmlFor="traffic" className="text-xs cursor-pointer">
                    Traffic
                  </Label>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {searchResults.length === 0 && !isSearching && allRoutes.length === 0 && !showDirections && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-[500]">
                <div className="text-center p-8">
                  <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Search for a location</h2>
                  <p className="text-muted-foreground mb-4">
                    Enter an address, city, landmark, or coordinates to find it on the map
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    {["Tashkent", "New York", "Tokyo", "London", "Paris"].map((city) => (
                      <Button
                        key={city}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setQuery(city);
                          setTimeout(() => handleSearch(), 100);
                        }}
                      >
                        {city}
                      </Button>
                    ))}
                  </div>
                  <Button onClick={() => setShowDirections(true)}>
                    <Route className="h-4 w-4 mr-2" />
                    Get Directions
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Maps;
