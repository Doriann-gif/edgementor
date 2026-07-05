import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { email: user.email });

    const { mentorId } = await req.json().catch(() => ({} as { mentorId?: string }));

    // One-time purchases never appear in Stripe's subscription list —
    // the local record (written by verify-payment) is the source of truth.
    if (mentorId) {
      const { data: mentorRow } = await supabaseClient
        .from("mentors")
        .select("payment_type")
        .eq("id", mentorId)
        .maybeSingle();

      if (mentorRow?.payment_type === "one_time") {
        const { data: localSub } = await supabaseClient
          .from("subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .eq("mentor_id", mentorId)
          .eq("status", "active")
          .maybeSingle();
        logStep("One-time mentor check", { subscribed: !!localSub });
        return new Response(JSON.stringify({
          subscribed: !!localSub,
          source: "database",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Prefer the stored customer mapping; fall back to email lookup
    let storedCustomerId: string | undefined;
    const { data: userPayment } = await supabaseClient
      .from("user_payment_config")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (userPayment?.stripe_customer_id) {
      storedCustomerId = userPayment.stripe_customer_id;
    }

    const customers = storedCustomerId
      ? { data: [{ id: storedCustomerId }] }
      : await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      // Also check local DB as fallback
      if (mentorId) {
        const { data: localSub } = await supabaseClient
          .from("subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .eq("mentor_id", mentorId)
          .eq("status", "active")
          .maybeSingle();

        return new Response(JSON.stringify({
          subscribed: !!localSub,
          source: "database",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 100,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    logStep("Stripe subscriptions check", { count: subscriptions.data.length });

    // Sync: if Stripe has no active subs, deactivate local MONTHLY subs only.
    // One-time purchases are lifetime access and must never be auto-cancelled.
    if (!hasActiveSub) {
      const { data: monthlySubs } = await supabaseClient
        .from("subscriptions")
        .select("id, mentors!inner(payment_type)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .eq("mentors.payment_type", "monthly");
      const staleIds = (monthlySubs ?? []).map((s) => s.id);
      if (staleIds.length > 0) {
        await supabaseClient
          .from("subscriptions")
          .update({ status: "cancelled" })
          .in("id", staleIds);
        logStep("Deactivated stale monthly subscriptions", { count: staleIds.length });
      }
    }

    // If checking for a specific mentor, also verify local DB record exists
    let mentorSubscribed = hasActiveSub;
    if (mentorId && hasActiveSub) {
      const { data: localSub } = await supabaseClient
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("mentor_id", mentorId)
        .eq("status", "active")
        .maybeSingle();
      mentorSubscribed = !!localSub;
    }

    // Stripe API "basil" versions moved current_period_end from the
    // subscription onto its items — read whichever is present.
    let subscriptionEnd: string | null = null;
    if (hasActiveSub) {
      const sub = subscriptions.data[0] as any;
      const periodEnd = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
      if (typeof periodEnd === "number") {
        subscriptionEnd = new Date(periodEnd * 1000).toISOString();
      }
    }

    return new Response(JSON.stringify({
      subscribed: mentorId ? mentorSubscribed : hasActiveSub,
      subscription_end: subscriptionEnd,
      active_count: subscriptions.data.length,
      source: "stripe",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
