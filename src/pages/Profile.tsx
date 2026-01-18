import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { AlsamosLogo } from "@/components/AlsamosLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  Mail,
  Calendar,
  Settings,
  History,
  Bookmark,
  BookOpen,
  Shield,
  ExternalLink,
  ArrowLeft,
  LogOut,
  Camera,
  Pencil,
  Trash2,
  Loader2,
  Check,
  X,
} from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, signOut, searchHistory, savedSearches } = useAuth();
  const { profile, isLoading: profileLoading, isSaving, updateDisplayName, uploadAvatar, removeAvatar } = useProfile();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoading = authLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
        <AlsamosLogo size="lg" />
        <p className="text-muted-foreground">Please sign in to view your profile</p>
        <Button onClick={() => navigate("/")}>Go to Home</Button>
      </div>
    );
  }

  const userMetadata = user?.user_metadata || {};
  const displayName = profile?.display_name || userMetadata.full_name || userMetadata.name || user?.email?.split("@")[0] || "User";
  const avatarUrl = profile?.avatar_url || userMetadata.avatar_url || userMetadata.picture;
  const alsamosId = userMetadata.alsamos_id;
  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleStartEditName = () => {
    setEditedName(displayName);
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    const success = await updateDisplayName(editedName);
    if (success) {
      setIsEditingName(false);
    }
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName("");
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
      setShowAvatarDialog(false);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    await removeAvatar();
    setShowAvatarDialog(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <button onClick={() => navigate("/")} className="flex items-center gap-2">
              <AlsamosLogo size="sm" />
            </button>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Header Card */}
        <Card className="mb-6 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20" />
          <CardContent className="relative pt-0 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12">
              {/* Avatar with edit button */}
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center border-4 border-background shadow-lg overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-primary-foreground">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowAvatarDialog(true)}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isSaving}
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              {/* Name & Email */}
              <div className="flex-1 text-center sm:text-left">
                {isEditingName ? (
                  <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="max-w-[200px] h-9"
                      placeholder="Display name"
                      disabled={isSaving}
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleSaveName}
                      disabled={isSaving}
                      className="h-9 w-9"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleCancelEditName}
                      disabled={isSaving}
                      className="h-9 w-9"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
                    <button
                      onClick={handleStartEditName}
                      className="p-1 rounded hover:bg-muted transition-colors"
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                )}
                <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-2">
                  <Mail className="h-4 w-4" />
                  {user?.email}
                </p>
                {alsamosId && (
                  <Badge variant="secondary" className="mt-2">
                    <Shield className="h-3 w-3 mr-1" />
                    Alsamos ID: {alsamosId.slice(0, 8)}...
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.open("https://accounts.alsamos.com/settings", "_blank")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Account Settings
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate("/history")}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-full bg-blue-500/10">
                <History className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{searchHistory.length}</p>
                <p className="text-sm text-muted-foreground">Search History</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate("/saved")}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-full bg-green-500/10">
                <Bookmark className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{savedSearches.length}</p>
                <p className="text-sm text-muted-foreground">Saved Searches</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate("/reading-list")}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-full bg-purple-500/10">
                <BookOpen className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">—</p>
                <p className="text-sm text-muted-foreground">Reading List</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Details
            </CardTitle>
            <CardDescription>Your Alsamos account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Display Name</span>
              <span className="font-medium">{displayName}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Member Since
              </span>
              <span className="font-medium">{createdAt}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Authentication Provider</span>
              <Badge variant="outline">Alsamos SSO</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate("/history")}
            >
              <History className="h-4 w-4 mr-3" />
              View Search History
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate("/saved")}
            >
              <Bookmark className="h-4 w-4 mr-3" />
              Manage Saved Searches
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate("/reading-list")}
            >
              <BookOpen className="h-4 w-4 mr-3" />
              View Reading List
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => window.open("https://accounts.alsamos.com/settings", "_blank")}
            >
              <Settings className="h-4 w-4 mr-3" />
              Account Settings
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
            <Separator className="my-2" />
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Avatar Dialog */}
      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Avatar</DialogTitle>
            <DialogDescription>
              Upload a new avatar image or remove the current one.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center py-6">
            <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-primary-foreground">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {avatarUrl && (
              <Button
                variant="outline"
                onClick={handleRemoveAvatar}
                disabled={isSaving}
                className="w-full sm:w-auto"
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Remove
              </Button>
            )}
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
              Upload New Avatar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
