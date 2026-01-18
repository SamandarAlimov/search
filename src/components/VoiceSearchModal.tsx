import { useEffect } from "react";
import { Mic, X, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface VoiceSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isListening: boolean;
  transcript: string;
  onSubmit: (transcript: string) => void;
}

export function VoiceSearchModal({
  open,
  onOpenChange,
  isListening,
  transcript,
  onSubmit,
}: VoiceSearchModalProps) {
  useEffect(() => {
    if (!isListening && transcript) {
      const timer = setTimeout(() => {
        onSubmit(transcript);
        onOpenChange(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isListening, transcript, onSubmit, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-card border-border/50">
        <div className="flex flex-col items-center py-8 space-y-6">
          {/* Animated Mic */}
          <div className="relative">
            <div
              className={cn(
                "absolute inset-0 rounded-full bg-primary/20 animate-pulse",
                isListening && "animate-ping"
              )}
              style={{ animationDuration: "1.5s" }}
            />
            <div
              className={cn(
                "relative w-20 h-20 rounded-full flex items-center justify-center transition-colors",
                isListening ? "bg-primary" : "bg-muted"
              )}
            >
              {isListening ? (
                <Mic className="h-8 w-8 text-primary-foreground animate-pulse" />
              ) : (
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
              )}
            </div>
          </div>

          {/* Status Text */}
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-foreground">
              {isListening ? "Listening..." : "Processing..."}
            </p>
            {transcript && (
              <p className="text-muted-foreground max-w-xs">
                "{transcript}"
              </p>
            )}
            {!transcript && isListening && (
              <p className="text-sm text-muted-foreground">
                Speak now to search
              </p>
            )}
          </div>

          {/* Cancel Button */}
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-full hover:bg-accent transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
