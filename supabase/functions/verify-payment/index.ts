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
  console.log(`[VERIFY-PAYMENT] ${step}${d}`);
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
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    const { sessionId } = await req.json();
    if (!sessionId || typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
      throw new Error("A valid Stripe checkout sessionId is required");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Session retrieved", { id: session.id, payment_status: session.payment_status });

    // The session must belong to this user and carry a mentor reference
    if (session.metadata?.user_id !== user.id) {
      throw new Error("This checkout session belongs to a different user");
    }
    const mentorId = session.metadata?.mentor_id;
    if (!mentorId) throw new Error("Checkout session has no mentor reference");

    // Only a genuinely paid session activates access
    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ activated: false, reason: "not_paid" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Remember the canonical Stripe customer for this user (prevents
    // duplicate customers from future email-based lookups)
    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
    if (customerId) {
      await supabase
        .from("user_payment_config")
        .upsert({ user_id: user.id, stripe_customer_id: customerId }, { onConflict: "user_id" });
    }

    // Activate (idempotent — safe to call multiple times for the same session)
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("mentor_id", mentorId)
      .maybeSingle();

    let firstActivation = false;
    if (!existing) {
      const { error: insertError } = await supabase
        .from("subscriptions")
        .insert({ user_id: user.id, mentor_id: mentorId, status: "active" });
      if (insertError) {
        // 23505 = the webhook won the race and already inserted this exact
        // (user, mentor) row. The user is paid and active — treat as success
        // rather than erroring out a customer who genuinely paid.
        if ((insertError as any).code === "23505") {
          logStep("Insert race — already activated by webhook", { mentorId });
          return new Response(JSON.stringify({ activated: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
        throw insertError;
      }
      firstActivation = true;
      logStep("Subscription created", { mentorId });
    } else if (existing.status !== "active") {
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({ status: "active", started_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (updateError) throw updateError;
      firstActivation = true;
      logStep("Subscription reactivated", { mentorId });
    } else {
      logStep("Subscription already active", { mentorId });
    }

    // Record promo redemption once per activation. Atomic increment + insert
    // via RPC so concurrent redemptions of the same code can't lose a count.
    const promoCode = session.metadata?.promo_code;
    if (promoCode && firstActivation) {
      const { error: redeemError } = await supabase.rpc("redeem_discount_code", {
        _code: promoCode,
        _user_id: user.id,
      });
      if (redeemError) logStep("Promo redemption failed", { promoCode, message: redeemError.message });
      else logStep("Promo redemption recorded", { promoCode });
    }

    return new Response(JSON.stringify({ activated: true }), {
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
