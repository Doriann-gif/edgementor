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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { mentorId, promoCode } = await req.json();
    if (!mentorId) throw new Error("mentorId is required");

    // Fetch mentor details (public columns only)
    const { data: mentor, error: mentorError } = await supabaseClient
      .from("mentors")
      .select("id, name, monthly_price, payment_type")
      .eq("id", mentorId)
      .single();
    if (mentorError || !mentor) throw new Error("Mentor not found");

    // Fetch Stripe Connect account from separate payment config table
    const { data: paymentConfig } = await supabaseClient
      .from("mentor_payment_config")
      .select("stripe_connect_account_id")
      .eq("mentor_id", mentorId)
      .maybeSingle();

    let discountPercent = 0;
    if (promoCode) {
      const { data: code } = await supabaseClient
        .from("discount_codes")
        .select("*")
        .eq("code", promoCode.toUpperCase())
        .eq("active", true)
        .maybeSingle();

      if (code) {
        const notExpired = !code.expires_at || new Date(code.expires_at) > new Date();
        const notMaxed = !code.max_uses || code.current_uses < code.max_uses;
        if (notExpired && notMaxed) {
          discountPercent = code.discount_percent;
        }
      }
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    const unitAmount = Math.round(mentor.monthly_price * 100 * (1 - discountPercent / 100));
    const isOneTime = mentor.payment_type === "one_time";

    const lineItem: any = {
      price_data: {
        currency: "usd",
        product_data: {
          name: `${mentor.name} — ${isOneTime ? "Mentorship Access" : "Monthly Mentorship"}`,
          description: isOneTime
            ? `One-time access to ${mentor.name}`
            : `Monthly subscription to ${mentor.name}`,
        },
        unit_amount: unitAmount,
        ...(isOneTime ? {} : { recurring: { interval: "month" } }),
      },
      quantity: 1,
    };

    const sessionParams: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [lineItem],
      mode: isOneTime ? "payment" : "subscription",
      success_url: `${req.headers.get("origin") || "https://edgementor.lovable.app"}/payment-success?mentor_id=${mentorId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin") || "https://edgementor.lovable.app"}/subscribe/${mentorId}`,
      metadata: {
        mentor_id: mentorId,
        user_id: user.id,
      },
    };

    const connectAccountId = paymentConfig?.stripe_connect_account_id;
    if (connectAccountId) {
      const applicationFeePercent = 20;
      if (isOneTime) {
        const feeAmount = Math.round(unitAmount * applicationFeePercent / 100);
        sessionParams.payment_intent_data = {
          application_fee_amount: feeAmount,
          transfer_data: { destination: connectAccountId },
        };
      } else {
        sessionParams.subscription_data = {
          transfer_data: { destination: connectAccountId },
          application_fee_percent: applicationFeePercent,
        };
      }
      console.log(`[CREATE-CHECKOUT] Splitting payments to Connect account ${connectAccountId}, platform fee: ${applicationFeePercent}%, mode: ${isOneTime ? "one_time" : "subscription"}`);
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[CREATE-CHECKOUT] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
