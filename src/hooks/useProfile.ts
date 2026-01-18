import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch or create profile
  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      if (data) {
        setProfile(data);
      } else {
        // Create profile if it doesn't exist
        const newProfile = {
          user_id: user.id,
          display_name: user.user_metadata?.full_name || user.email?.split("@")[0] || null,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        };

        const { data: createdProfile, error: createError } = await supabase
          .from("profiles")
          .insert(newProfile)
          .select()
          .single();

        if (createError) {
          console.error("Error creating profile:", createError);
        } else {
          setProfile(createdProfile);
        }
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    } else {
      setProfile(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchProfile]);

  // Update display name
  const updateDisplayName = useCallback(async (displayName: string) => {
    if (!user?.id) return false;

    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() || null })
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating display name:", error);
        toast.error("Failed to update display name");
        return false;
      }

      setProfile(prev => prev ? { ...prev, display_name: displayName.trim() || null } : null);
      toast.success("Display name updated");
      return true;
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update display name");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  // Upload avatar
  const uploadAvatar = useCallback(async (file: File) => {
    if (!user?.id) return false;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return false;
    }

    try {
      setIsSaving(true);

      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete old avatar if exists
      await supabase.storage.from("avatars").remove([fileName]);

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Failed to upload avatar");
        return false;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`; // Cache bust

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating avatar URL:", updateError);
        toast.error("Failed to save avatar");
        return false;
      }

      setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
      toast.success("Avatar updated");
      return true;
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("Failed to upload avatar");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  // Remove avatar
  const removeAvatar = useCallback(async () => {
    if (!user?.id) return false;

    try {
      setIsSaving(true);

      // List and remove all avatars for user
      const { data: files } = await supabase.storage
        .from("avatars")
        .list(user.id);

      if (files && files.length > 0) {
        const filePaths = files.map(f => `${user.id}/${f.name}`);
        await supabase.storage.from("avatars").remove(filePaths);
      }

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("user_id", user.id);

      if (error) {
        console.error("Error removing avatar:", error);
        toast.error("Failed to remove avatar");
        return false;
      }

      setProfile(prev => prev ? { ...prev, avatar_url: null } : null);
      toast.success("Avatar removed");
      return true;
    } catch (error) {
      console.error("Remove avatar error:", error);
      toast.error("Failed to remove avatar");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  return {
    profile,
    isLoading,
    isSaving,
    updateDisplayName,
    uploadAvatar,
    removeAvatar,
    refetch: fetchProfile,
  };
}
