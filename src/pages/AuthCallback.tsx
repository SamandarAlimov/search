import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { AlsamosLogo } from "@/components/AlsamosLogo";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Processing authentication...");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const errorParam = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      // Check for OAuth errors
      if (errorParam) {
        setError(errorDescription || errorParam);
        return;
      }

      // Validate state to prevent CSRF
      const savedState = sessionStorage.getItem("alsamos_oauth_state");
      if (state && savedState && state !== savedState) {
        setError("Invalid state parameter. Please try again.");
        return;
      }

      if (!code) {
        setError("No authorization code received");
        return;
      }

      try {
        setStatus("Exchanging authorization code...");

        const redirectUri = `${window.location.origin}/auth/callback`;

        // Exchange code for tokens via edge function
        const { data, error: fnError } = await supabase.functions.invoke("alsamos-oauth", {
          body: {
            action: "exchange_code",
            code,
            redirect_uri: redirectUri,
          },
        });

        if (fnError) {
          throw new Error(fnError.message);
        }

        if (!data?.success) {
          throw new Error(data?.error || "Authentication failed");
        }

        setStatus("Completing sign in...");

        // If we have a verification URL, use it to complete the sign in
        if (data.verification_url) {
          // Extract the token from the verification URL
          const verifyUrl = new URL(data.verification_url);
          const token = verifyUrl.searchParams.get("token");
          const type = verifyUrl.searchParams.get("type");

          if (token && type === "magiclink") {
            const { error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: "magiclink",
            });

            if (verifyError) {
              console.error("OTP verification error:", verifyError);
              // Try alternative approach - store user info and redirect
            }
          }
        }

        // Clear OAuth state
        sessionStorage.removeItem("alsamos_oauth_state");

        // Store user info temporarily for the session
        if (data.user) {
          localStorage.setItem("alsamos_user_pending", JSON.stringify(data.user));
        }

        setStatus("Success! Redirecting...");
        
        // Redirect to home
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 500);
      } catch (err) {
        console.error("Auth callback error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 p-8">
        <AlsamosLogo size="lg" />
        
        {error ? (
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="text-primary hover:underline"
            >
              Return to home
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
}
