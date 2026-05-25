import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    let mounted = true;

    const handleCallback = async () => {
      const error = searchParams.get('error');
      const error_description = searchParams.get('error_description');

      if (error) {
        setErrorMsg(error_description || "Authentication failed.");
        return;
      }

      // Check if session already exists
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (session) {
        navigate("/dashboard", { replace: true });
        return;
      }

      // If no session yet, listen for the SIGNED_IN event (code exchange in progress)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          navigate("/dashboard", { replace: true });
        }
      });

      // Timeout just in case it hangs forever (10 seconds)
      const timer = setTimeout(() => {
        if (mounted && !errorMsg) {
          setErrorMsg("Authentication timed out. Please try again.");
        }
      }, 10000);

      return () => {
        mounted = false;
        subscription.unsubscribe();
        clearTimeout(timer);
      };
    };

    handleCallback();
  }, [navigate, searchParams]);

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="p-6 text-center max-w-md w-full border rounded-lg shadow-sm bg-card">
          <h2 className="text-lg font-semibold text-destructive mb-2">Authentication Error</h2>
          <p className="text-sm text-muted-foreground">{errorMsg}</p>
          <button
            onClick={() => navigate("/auth")}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm w-full"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-4">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
      <div className="text-lg font-medium text-foreground">Completing sign in...</div>
      <div className="text-sm text-muted-foreground">Please wait while we verify your account.</div>
    </div>
  );
}