import { supabase } from "@/integrations/supabase/client";

/**
 * Native Supabase Google OAuth. On success the browser redirects to Google,
 * then back to `redirectTo` with a session. Requires the Google provider to
 * be enabled in the Supabase dashboard (Authentication → Providers).
 */
export async function signInWithGoogle(redirectTo: string = window.location.origin) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  return { error };
}
