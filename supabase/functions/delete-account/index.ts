import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[DELETE-ACCOUNT] ${step}${d}`);
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
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("Deleting account", { userId: user.id });

    // Best-effort: cancel any active Stripe subscriptions so the card stops
    // being charged after the account is gone.
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (stripeKey && user.email) {
      try {
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        let customerId: string | undefined;
        const { data: upc } = await supabase
          .from("user_payment_config")
          .select("stripe_customer_id")
          .eq("user_id", user.id)
          .maybeSingle();
        customerId = upc?.stripe_customer_id ??
          (await stripe.customers.list({ email: user.email, limit: 1 })).data[0]?.id;
        if (customerId) {
          const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 100 });
          for (const s of subs.data) {
            await stripe.subscriptions.cancel(s.id);
          }
          logStep("Cancelled active Stripe subscriptions", { count: subs.data.length });
        }
      } catch (stripeErr) {
        // Don't block account deletion on Stripe hiccups
        logStep("Stripe cleanup failed (continuing)", { message: String(stripeErr) });
      }
    }

    // If the user is a mentor, remove their listing + content (FKs cascade
    // subscriptions, reviews, showcase images, payment config).
    const { data: mentor } = await supabase
      .from("mentors")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (mentor) {
      await supabase.from("mentors").delete().eq("id", mentor.id);
      logStep("Deleted mentor listing", { mentorId: mentor.id });
    }

    // Deleting the auth user cascades everything keyed on auth.users(id):
    // profiles, subscriptions, saved_mentors, messages, feed_posts, roles…
    const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
    if (delError) throw delError;
    logStep("Auth user deleted");

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
