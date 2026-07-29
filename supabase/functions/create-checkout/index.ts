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

    // Business-rule rejections return 200 with an { error } field so the real
    // message reaches the client (supabase.functions.invoke collapses non-2xx
    // responses into a generic "non-2xx status code" error, hiding the text).
    const reject = (message: string, extra: Record<string, unknown> = {}) =>
      new Response(JSON.stringify({ error: message, ...extra }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    const { mentorId, promoCode } = await req.json();
    if (!mentorId) throw new Error("mentorId is required");

    // Fetch mentor details (public columns only)
    const { data: mentor, error: mentorError } = await supabaseClient
      .from("mentors")
      .select("id, name, monthly_price, payment_type, available, status")
      .eq("id", mentorId)
      .single();
    if (mentorError || !mentor) throw new Error("Mentor not found");

    // Never charge for a mentor who isn't live or has paused new students.
    if (mentor.status !== "approved") return reject("This mentor is not available.");
    if (mentor.available === false) {
      return reject("This mentor has paused new signups and isn't accepting subscriptions right now.");
    }

    // Block double-charging: if the user already holds active access, send
    // them to the content instead of creating a second Stripe subscription.
    const { data: activeSub } = await supabaseClient
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("mentor_id", mentorId)
      .eq("status", "active")
      .maybeSingle();
    if (activeSub) {
      return new Response(JSON.stringify({ alreadySubscribed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Payments are collected 100% by the platform. The mentor's 80% share is
    // credited to their internal ledger by the webhook and withdrawn via their
    // chosen rail (crypto / bank / PayPal), so no Stripe Connect account is
    // required for a mentor to start selling.
    let discountPercent = 0;
    let appliedPromoCode: string | null = null;
    if (promoCode && typeof promoCode === "string") {
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
          appliedPromoCode = code.code;
        }
      }
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Prefer the stored customer mapping; fall back to email lookup for
    // customers created before the mapping existed.
    let customerId: string | undefined;
    const { data: userPayment } = await supabaseClient
      .from("user_payment_config")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (userPayment?.stripe_customer_id) {
      customerId = userPayment.stripe_customer_id;
    } else {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      customerId = customers.data.length > 0 ? customers.data[0].id : undefined;
    }

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

    // Attach the same metadata to the session AND the underlying
    // subscription / payment intent so webhook events (cancellation,
    // refund) can be mapped back to the user + mentor.
    const flowMetadata: Record<string, string> = {
      mentor_id: mentorId,
      user_id: user.id,
      ...(appliedPromoCode ? { promo_code: appliedPromoCode } : {}),
    };

    const sessionParams: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [lineItem],
      mode: isOneTime ? "payment" : "subscription",
      success_url: `${req.headers.get("origin") || "https://edgementor.net"}/payment-success?mentor_id=${mentorId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin") || "https://edgementor.net"}/subscribe/${mentorId}`,
      metadata: flowMetadata,
      ...(isOneTime
        ? { payment_intent_data: { metadata: flowMetadata } }
        : { subscription_data: { metadata: flowMetadata } }),
    };

    console.log(`[CREATE-CHECKOUT] Platform-collect checkout, mode: ${isOneTime ? "one_time" : "subscription"}, amount: ${unitAmount}`);

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
