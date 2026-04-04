import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const { code } = await req.json();
    if (!code || typeof code !== "string" || code.trim().length === 0 || code.trim().length > 50) {
      return new Response(JSON.stringify({ valid: false, error: "Invalid code format" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { data, error } = await supabase
      .from("discount_codes")
      .select("code, discount_percent, max_uses, current_uses, expires_at")
      .eq("code", code.trim().toUpperCase())
      .eq("active", true)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return new Response(JSON.stringify({ valid: false, error: "Invalid or expired promo code." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (data.max_uses && data.current_uses >= data.max_uses) {
      return new Response(JSON.stringify({ valid: false, error: "This code has reached its maximum uses." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return new Response(JSON.stringify({ valid: false, error: "This code has expired." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({
      valid: true,
      code: data.code,
      discount_percent: data.discount_percent,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ valid: false, error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
