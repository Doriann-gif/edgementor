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
  console.log(`[CONNECT-BALANCE] ${step}${d}`);
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
    logStep("User authenticated", { userId: user.id });

    // Get mentor's Connect account
    const { data: mentor, error: mentorError } = await supabase
      .from("mentors")
      .select("id, stripe_connect_account_id, payouts_enabled, auto_payout")
      .eq("user_id", user.id)
      .single();
    if (mentorError || !mentor) throw new Error("Mentor not found");

    if (!mentor.stripe_connect_account_id) {
      return new Response(JSON.stringify({
        onboarded: false,
        available: 0,
        pending: 0,
        total_earned: 0,
        payouts_enabled: false,
        auto_payout: mentor.auto_payout,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check account status
    const account = await stripe.accounts.retrieve(mentor.stripe_connect_account_id);
    const payoutsEnabled = account.payouts_enabled ?? false;
    logStep("Account status", { payoutsEnabled, chargesEnabled: account.charges_enabled });

    // Update payouts_enabled in DB if changed
    if (payoutsEnabled !== mentor.payouts_enabled) {
      await supabase
        .from("mentors")
        .update({ payouts_enabled: payoutsEnabled })
        .eq("id", mentor.id);
    }

    // Get balance for the connected account
    const balance = await stripe.balance.retrieve({
      stripeAccount: mentor.stripe_connect_account_id,
    });

    const available = balance.available.reduce((sum, b) => sum + b.amount, 0) / 100;
    const pending = balance.pending.reduce((sum, b) => sum + b.amount, 0) / 100;
    logStep("Balance retrieved", { available, pending });

    // Get total payouts for lifetime earned
    const payouts = await stripe.payouts.list(
      { limit: 100 },
      { stripeAccount: mentor.stripe_connect_account_id }
    );
    const totalPaidOut = payouts.data
      .filter(p => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0) / 100;

    return new Response(JSON.stringify({
      onboarded: true,
      available,
      pending,
      total_earned: available + pending + totalPaidOut,
      payouts_enabled: payoutsEnabled,
      auto_payout: mentor.auto_payout,
    }), {
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
