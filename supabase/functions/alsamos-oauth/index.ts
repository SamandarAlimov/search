import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, code, redirect_uri } = await req.json();
    
    const clientId = Deno.env.get("ALSAMOS_CLIENT_ID");
    const clientSecret = Deno.env.get("ALSAMOS_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!clientId || !clientSecret) {
      throw new Error("OAuth credentials not configured");
    }

    if (action === "get_auth_url") {
      // Generate authorization URL
      const state = crypto.randomUUID();
      const authUrl = new URL("https://accounts.alsamos.com/oauth/authorize");
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", redirect_uri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "openid profile email");
      authUrl.searchParams.set("state", state);

      return new Response(
        JSON.stringify({ auth_url: authUrl.toString(), state }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "exchange_code") {
      // Exchange authorization code for tokens
      const tokenResponse = await fetch("https://accounts.alsamos.com/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error("Token exchange failed:", error);
        throw new Error("Failed to exchange authorization code");
      }

      const tokens = await tokenResponse.json();

      // Get user info from Alsamos
      const userInfoResponse = await fetch("https://accounts.alsamos.com/oauth/userinfo", {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        throw new Error("Failed to get user info");
      }

      const userInfo = await userInfoResponse.json();

      // Create Supabase admin client to manage auth
      const supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      // Check if user exists, create or update
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === userInfo.email);

      let userId: string;
      let accessToken: string;
      let refreshToken: string;

      if (existingUser) {
        // Generate a session for existing user
        const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: userInfo.email,
        });

        if (sessionError) {
          console.error("Session generation error:", sessionError);
          throw new Error("Failed to generate session");
        }

        // Sign in the user using the token
        const { data: signInData, error: signInError } = await supabase.auth.admin.createUser({
          email: userInfo.email,
          email_confirm: true,
          user_metadata: {
            alsamos_id: userInfo.sub,
            full_name: userInfo.name,
            avatar_url: userInfo.picture,
          },
        });

        // Use admin API to create a session directly
        const { data: newSession, error: newSessionError } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: userInfo.email,
          options: {
            data: {
              alsamos_id: userInfo.sub,
              provider: "alsamos",
            },
          },
        });

        userId = existingUser.id;
        
        // Return token hash for client-side verification
        return new Response(
          JSON.stringify({
            success: true,
            user: {
              id: existingUser.id,
              email: userInfo.email,
              name: userInfo.name,
              avatar: userInfo.picture,
              alsamos_id: userInfo.sub,
            },
            token_hash: newSession?.properties?.hashed_token,
            verification_url: newSession?.properties?.verification_type === "magiclink" 
              ? newSession?.properties?.action_link 
              : null,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: userInfo.email,
          email_confirm: true,
          user_metadata: {
            alsamos_id: userInfo.sub,
            full_name: userInfo.name,
            avatar_url: userInfo.picture,
            provider: "alsamos",
          },
        });

        if (createError) {
          console.error("User creation error:", createError);
          throw new Error("Failed to create user");
        }

        userId = newUser.user.id;

        // Generate session for new user
        const { data: newSession, error: sessionError } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: userInfo.email,
        });

        return new Response(
          JSON.stringify({
            success: true,
            user: {
              id: userId,
              email: userInfo.email,
              name: userInfo.name,
              avatar: userInfo.picture,
              alsamos_id: userInfo.sub,
            },
            token_hash: newSession?.properties?.hashed_token,
            verification_url: newSession?.properties?.action_link,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("OAuth error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
