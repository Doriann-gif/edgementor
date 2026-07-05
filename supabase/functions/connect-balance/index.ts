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

    // Get mentor ID
    const { data: mentor, error: mentorError } = await supabase
      .from("mentors")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (mentorError || !mentor) throw new Error("Mentor not found");

    // Get payment config from separate table
    const { data: paymentConfig } = await supabase
      .from("mentor_payment_config")
      .select("stripe_connect_account_id, payouts_enabled, auto_payout")
      .eq("mentor_id", mentor.id)
      .maybeSingle();

    if (!paymentConfig?.stripe_connect_account_id) {
      return new Response(JSON.stringify({
        onboarded: false,
        available: 0,
        pending: 0,
        total_earned: 0,
        payouts_enabled: false,
        auto_payout: paymentConfig?.auto_payout ?? false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const connectId = paymentConfig.stripe_connect_account_id;

    // Check account status
    const account = await stripe.accounts.retrieve(connectId);
    const payoutsEnabled = account.payouts_enabled ?? false;
    logStep("Account status", { payoutsEnabled, chargesEnabled: account.charges_enabled });

    // Update payouts_enabled in DB if changed
    if (payoutsEnabled !== paymentConfig.payouts_enabled) {
      await supabase
        .from("mentor_payment_config")
        .update({ payouts_enabled: payoutsEnabled })
        .eq("mentor_id", mentor.id);
    }

    // Get balance for the connected account
    const balance = await stripe.balance.retrieve({ stripeAccount: connectId });
    const available = balance.available.reduce((sum, b) => sum + b.amount, 0) / 100;
    const pending = balance.pending.reduce((sum, b) => sum + b.amount, 0) / 100;
    logStep("Balance retrieved", { available, pending });

    // Get payouts for lifetime earned + history
    const payouts = await stripe.payouts.list({ limit: 100 }, { stripeAccount: connectId });
    const totalPaidOut = payouts.data
      .filter(p => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0) / 100;

    const payoutHistory = payouts.data.map(p => ({
      id: p.id,
      amount: p.amount / 100,
      status: p.status,
      created: p.created,
      arrival_date: p.arrival_date,
      description: p.description,
    }));

    // Real per-month revenue from balance transactions (incoming payments
    // and transfers only — excludes payouts and fees-only entries)
    const monthlyRevenue: Record<string, number> = {};
    try {
      const txns = await stripe.balanceTransactions.list(
        { limit: 100 },
        { stripeAccount: connectId }
      );
      for (const t of txns.data) {
        if (t.net > 0 && ["charge", "payment", "transfer"].includes(t.type)) {
          const d = new Date(t.created * 1000);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          monthlyRevenue[key] = (monthlyRevenue[key] || 0) + t.net / 100;
        }
      }
    } catch (txnError) {
      logStep("Balance transactions unavailable", { message: String(txnError) });
    }

    return new Response(JSON.stringify({
      onboarded: true,
      available,
      pending,
      total_earned: available + pending + totalPaidOut,
      payouts_enabled: payoutsEnabled,
      auto_payout: paymentConfig.auto_payout,
      payout_history: payoutHistory,
      monthly_revenue: monthlyRevenue,
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
