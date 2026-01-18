import { cn } from "@/lib/utils";
import alsamosLogoImage from "@/assets/alsamos-logo.png";

interface AlsamosLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

const sizeClasses = {
  sm: "h-6",
  md: "h-8",
  lg: "h-12",
  xl: "h-16",
};

const textSizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-3xl",
  xl: "text-4xl",
};

export function AlsamosLogo({ className, size = "md", showText = true }: AlsamosLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Logo Icon */}
      <img 
        src={alsamosLogoImage} 
        alt="Alsamos" 
        className={cn(sizeClasses[size], "w-auto")}
      />
      
      {showText && (
        <div className="flex flex-col">
          <span className={cn("font-semibold tracking-tight text-foreground", textSizeClasses[size])}>
            Alsamos
          </span>
          {size !== "sm" && (
            <span className="text-xs font-medium text-muted-foreground tracking-widest uppercase -mt-1">
              Search
            </span>
          )}
        </div>
      )}
    </div>
  );
}
