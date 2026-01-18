import { useState } from "react";
import { Sparkles, Copy, Share2, ThumbsUp, ThumbsDown, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface Source {
  title: string;
  url: string;
  domain: string;
}

interface AIResponseProps {
  content: string;
  sources: Source[];
  isLoading?: boolean;
  className?: string;
}

export function AIResponse({ content, sources, isLoading = false, className }: AIResponseProps) {
  const [showAllSources, setShowAllSources] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const displayedSources = showAllSources ? sources : sources.slice(0, 3);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "The AI response has been copied.",
    });
  };

  const handleFeedback = (type: "up" | "down") => {
    setFeedback(type);
    toast({
      title: "Thank you for your feedback",
      description: "Your feedback helps us improve.",
    });
  };

  if (isLoading) {
    return (
      <div className={cn("glass-card rounded-2xl p-6", className)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <span className="font-medium text-foreground">AI Answer</span>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded animate-shimmer" style={{ width: "90%" }} />
          <div className="h-4 bg-muted rounded animate-shimmer" style={{ width: "75%" }} />
          <div className="h-4 bg-muted rounded animate-shimmer" style={{ width: "85%" }} />
          <div className="h-4 bg-muted rounded animate-shimmer" style={{ width: "60%" }} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("glass-card rounded-2xl overflow-hidden", className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <span className="font-medium text-foreground">AI Answer</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5">
        <div 
          className="ai-response text-foreground leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>

      {/* Sources */}
      {sources.length > 0 && (
        <div className="px-6 py-4 border-t border-border/50 bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Sources ({sources.length})
            </span>
            {sources.length > 3 && (
              <button
                onClick={() => setShowAllSources(!showAllSources)}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                {showAllSources ? (
                  <>
                    Show less <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Show all <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {displayedSources.map((source, index) => (
              <a
                key={index}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background hover:bg-accent transition-colors text-sm group"
              >
                <img
                  src={`https://www.google.com/s2/favicons?domain=${source.domain}&sz=32`}
                  alt=""
                  className="h-4 w-4 rounded"
                />
                <span className="text-foreground group-hover:text-primary transition-colors truncate max-w-[200px]">
                  {source.title}
                </span>
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
      <div className="px-6 py-3 border-t border-border/50 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Was this helpful?</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              feedback === "up" 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => handleFeedback("up")}
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              feedback === "down" 
                ? "text-destructive bg-destructive/10" 
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => handleFeedback("down")}
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
