import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, History, Bookmark, Settings, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, signInWithSSO, signOut, searchHistory, savedSearches } = useAuth();

  if (!isAuthenticated) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn("gap-2", className)}
        onClick={signInWithSSO}
      >
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">Sign In</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("gap-2", className)}>
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
            <span className="text-xs font-medium text-primary-foreground">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 glass-card border-border/50">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-foreground truncate">
            {user?.email}
          </p>
          <p className="text-xs text-muted-foreground">
            Alsamos Account
          </p>
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="gap-3 cursor-pointer" onClick={() => navigate('/history')}>
          <History className="h-4 w-4" />
          <div className="flex-1">
            <span>Search History</span>
            <span className="text-xs text-muted-foreground ml-2">
              ({searchHistory.length})
            </span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="gap-3 cursor-pointer" onClick={() => navigate('/saved')}>
          <Bookmark className="h-4 w-4" />
          <div className="flex-1">
            <span>Saved Searches</span>
            <span className="text-xs text-muted-foreground ml-2">
              ({savedSearches.length})
            </span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="gap-3 cursor-pointer"
          onClick={() => navigate('/profile')}
        >
          <User className="h-4 w-4" />
          <span>My Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="gap-3 cursor-pointer"
          onClick={() => window.open("https://accounts.alsamos.com/settings", "_blank")}
        >
          <Settings className="h-4 w-4" />
          <span>Account Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="gap-3 cursor-pointer text-destructive focus:text-destructive"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
