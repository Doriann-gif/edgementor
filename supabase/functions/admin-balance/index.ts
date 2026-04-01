import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Not authorized");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === "payout") {
      const balance = await stripe.balance.retrieve();
      const available = balance.available.reduce((sum, b) => sum + b.amount, 0);
      if (available <= 0) throw new Error("No available balance to withdraw");

      const currency = balance.available[0]?.currency || "usd";
      const payout = await stripe.payouts.create({
        amount: available,
        currency,
        description: "EdgeMentor platform withdrawal",
      });

      return new Response(JSON.stringify({
        success: true,
        amount: available / 100,
        currency,
        payout_id: payout.id,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Default: return balance info
    const balance = await stripe.balance.retrieve();
    const available = balance.available.map(b => ({ amount: b.amount / 100, currency: b.currency }));
    const pending = balance.pending.map(b => ({ amount: b.amount / 100, currency: b.currency }));
    const totalAvailable = balance.available.reduce((sum, b) => sum + b.amount, 0) / 100;
    const totalPending = balance.pending.reduce((sum, b) => sum + b.amount, 0) / 100;

    // Recent payouts
    const payouts = await stripe.payouts.list({ limit: 10 });
    const payoutHistory = payouts.data.map(p => ({
      id: p.id,
      amount: p.amount / 100,
      currency: p.currency,
      status: p.status,
      created: p.created,
      arrival_date: p.arrival_date,
    }));

    return new Response(JSON.stringify({
      available: totalAvailable,
      pending: totalPending,
      breakdown: { available, pending },
      payout_history: payoutHistory,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[ADMIN-BALANCE] ERROR:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
