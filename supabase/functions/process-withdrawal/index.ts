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
  console.log(`[PROCESS-WITHDRAWAL] ${step}${d}`);
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

    const body = await req.json();
    const action = body.action; // "withdraw" or "toggle_auto_payout"

    // Get mentor
    const { data: mentor, error: mentorError } = await supabase
      .from("mentors")
      .select("id, stripe_connect_account_id, payouts_enabled, auto_payout")
      .eq("user_id", user.id)
      .single();
    if (mentorError || !mentor) throw new Error("Mentor not found");
    if (!mentor.stripe_connect_account_id) throw new Error("Stripe Connect account not set up");
    if (!mentor.payouts_enabled) throw new Error("Payouts not enabled on your account yet");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    if (action === "toggle_auto_payout") {
      const newValue = !mentor.auto_payout;

      // Update Stripe account payout schedule
      await stripe.accounts.update(mentor.stripe_connect_account_id, {
        settings: {
          payouts: {
            schedule: {
              interval: newValue ? "monthly" : "manual",
              ...(newValue ? { monthly_anchor: 1 } : {}),
            },
          },
        },
      });

      await supabase
        .from("mentors")
        .update({ auto_payout: newValue })
        .eq("id", mentor.id);

      logStep("Auto payout toggled", { newValue });

      return new Response(JSON.stringify({ 
        success: true, 
        auto_payout: newValue,
        message: newValue ? "Automatic monthly payouts enabled" : "Switched to manual withdrawals"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "withdraw") {
      // Get available balance
      const balance = await stripe.balance.retrieve({
        stripeAccount: mentor.stripe_connect_account_id,
      });
      const availableAmount = balance.available.reduce((sum, b) => sum + b.amount, 0);

      if (availableAmount <= 0) {
        throw new Error("No available balance to withdraw");
      }

      logStep("Creating payout", { amount: availableAmount });

      // Create a payout to the mentor's connected bank account
      const payout = await stripe.payouts.create(
        {
          amount: availableAmount,
          currency: "usd",
          description: "EdgeMentor earnings withdrawal",
        },
        { stripeAccount: mentor.stripe_connect_account_id }
      );

      logStep("Payout created", { payoutId: payout.id, amount: availableAmount / 100 });

      return new Response(JSON.stringify({
        success: true,
        amount: availableAmount / 100,
        payout_id: payout.id,
        message: `$${(availableAmount / 100).toFixed(2)} withdrawal initiated. Funds will arrive in 2-3 business days.`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Invalid action. Use 'withdraw' or 'toggle_auto_payout'.");
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
