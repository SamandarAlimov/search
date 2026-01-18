import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, X, Plus } from "lucide-react";

const presetDomains = [
  { id: "instagram", label: "Instagram", domain: "instagram.com" },
  { id: "telegram", label: "Telegram", domain: "telegram.com" },
  { id: "facebook", label: "Facebook", domain: "facebook.com" },
  { id: "twitter", label: "Twitter/X", domain: "twitter.com" },
  { id: "linkedin", label: "LinkedIn", domain: "linkedin.com" },
  { id: "youtube", label: "YouTube", domain: "youtube.com" },
  { id: "reddit", label: "Reddit", domain: "reddit.com" },
  { id: "tiktok", label: "TikTok", domain: "tiktok.com" },
  { id: "pinterest", label: "Pinterest", domain: "pinterest.com" },
  { id: "github", label: "GitHub", domain: "github.com" },
];

const fileTypes = [
  { value: "any", label: "Any format" },
  { value: "pdf", label: "PDF (.pdf)" },
  { value: "doc", label: "Word (.doc, .docx)" },
  { value: "xls", label: "Excel (.xls, .xlsx)" },
  { value: "ppt", label: "PowerPoint (.ppt, .pptx)" },
  { value: "txt", label: "Text (.txt)" },
  { value: "jpg", label: "Images (.jpg, .png, .gif)" },
  { value: "mp4", label: "Video (.mp4, .avi, .mov)" },
  { value: "mp3", label: "Audio (.mp3, .wav)" },
];

const regions = [
  { value: "any", label: "Any region" },
  { value: "us", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "ca", label: "Canada" },
  { value: "au", label: "Australia" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "jp", label: "Japan" },
  { value: "kr", label: "South Korea" },
  { value: "in", label: "India" },
  { value: "br", label: "Brazil" },
  { value: "mx", label: "Mexico" },
  { value: "es", label: "Spain" },
  { value: "it", label: "Italy" },
  { value: "nl", label: "Netherlands" },
];

const dateRanges = [
  { value: "any", label: "Any time" },
  { value: "day", label: "Past 24 hours" },
  { value: "week", label: "Past week" },
  { value: "month", label: "Past month" },
  { value: "year", label: "Past year" },
  { value: "custom", label: "Custom range" },
];

export default function Advanced() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [exactMatch, setExactMatch] = useState("");
  const [excludeWords, setExcludeWords] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [customDomain, setCustomDomain] = useState("");
  const [fileType, setFileType] = useState("any");
  const [region, setRegion] = useState("any");
  const [dateRange, setDateRange] = useState("any");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const toggleDomain = (domain: string) => {
    setSelectedDomains((prev) =>
      prev.includes(domain)
        ? prev.filter((d) => d !== domain)
        : [...prev, domain]
    );
  };

  const addCustomDomain = () => {
    if (customDomain && !selectedDomains.includes(customDomain)) {
      setSelectedDomains((prev) => [...prev, customDomain]);
      setCustomDomain("");
    }
  };

  const removeDomain = (domain: string) => {
    setSelectedDomains((prev) => prev.filter((d) => d !== domain));
  };

  const handleSearch = () => {
    const params = new URLSearchParams();

    let searchQuery = query;

    if (exactMatch) {
      searchQuery += ` "${exactMatch}"`;
    }

    if (excludeWords) {
      const excluded = excludeWords.split(",").map((w) => `-${w.trim()}`);
      searchQuery += ` ${excluded.join(" ")}`;
    }

    if (selectedDomains.length > 0) {
      const siteQuery = selectedDomains.map((d) => `site:${d}`).join(" OR ");
      searchQuery += ` (${siteQuery})`;
    }

    if (fileType !== "any") {
      searchQuery += ` filetype:${fileType}`;
    }

    params.set("q", searchQuery.trim());

    if (region !== "any") {
      params.set("region", region);
    }

    if (dateRange !== "any") {
      params.set("date", dateRange);
      if (dateRange === "custom" && dateFrom && dateTo) {
        params.set("from", dateFrom);
        params.set("to", dateTo);
      }
    }

    navigate(`/search?${params.toString()}`);
  };

  return (
    <>
      <Helmet>
        <title>Advanced Search - Alsamos Search</title>
        <meta
          name="description"
          content="Use advanced filters to refine your search results on Alsamos Search"
        />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                Advanced Search
              </h1>
              <p className="text-muted-foreground">
                Refine your search with powerful filters
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-6 space-y-6">
              {/* Main Query */}
              <div className="space-y-2">
                <Label htmlFor="query" className="text-sm font-medium">
                  Search Query
                </Label>
                <Input
                  id="query"
                  placeholder="Enter your search terms..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-12 text-lg"
                />
              </div>

              {/* Exact Match */}
              <div className="space-y-2">
                <Label htmlFor="exact" className="text-sm font-medium">
                  Exact Match
                </Label>
                <Input
                  id="exact"
                  placeholder="Find pages with this exact phrase..."
                  value={exactMatch}
                  onChange={(e) => setExactMatch(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Results will contain this exact phrase
                </p>
              </div>

              {/* Exclude Words */}
              <div className="space-y-2">
                <Label htmlFor="exclude" className="text-sm font-medium">
                  Exclude Words
                </Label>
                <Input
                  id="exclude"
                  placeholder="word1, word2, word3..."
                  value={excludeWords}
                  onChange={(e) => setExcludeWords(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated words to exclude from results
                </p>
              </div>

              {/* Domain Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Search Within Sites</Label>

                {/* Preset Domains */}
                <div className="flex flex-wrap gap-2">
                  {presetDomains.map((site) => (
                    <button
                      key={site.id}
                      onClick={() => toggleDomain(site.domain)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedDomains.includes(site.domain)
                          ? "bg-primary text-primary-foreground"
                          : "bg-accent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {site.label}
                    </button>
                  ))}
                </div>

                {/* Custom Domain Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter custom domain (e.g., example.com)"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustomDomain()}
                    className="flex-1"
                  />
                  <Button
                    onClick={addCustomDomain}
                    variant="outline"
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Selected Domains */}
                {selectedDomains.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedDomains.map((domain) => (
                      <Badge
                        key={domain}
                        variant="secondary"
                        className="pl-3 pr-1 py-1 gap-1"
                      >
                        {domain}
                        <button
                          onClick={() => removeDomain(domain)}
                          className="ml-1 hover:bg-muted rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* File Type & Region Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">File Type</Label>
                  <Select value={fileType} onValueChange={setFileType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select file type" />
                    </SelectTrigger>
                    <SelectContent>
                      {fileTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Region</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    {dateRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {dateRange === "custom" && (
                  <div className="flex gap-4 pt-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">From</Label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">To</Label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Search Button */}
              <div className="pt-4">
                <Button
                  onClick={handleSearch}
                  className="w-full h-12 text-lg gap-2"
                  disabled={!query && !exactMatch}
                >
                  <Search className="h-5 w-5" />
                  Advanced Search
                </Button>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
