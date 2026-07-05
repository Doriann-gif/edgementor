import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

// Stripe calls this endpoint directly — auth is the webhook signature,
// not a user JWT (config.toml sets verify_jwt = false for this function).

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${d}`);
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

async function activateSubscription(
  userId: string,
  mentorId: string,
  promoCode: string | null | undefined,
  customerId: string | null | undefined
) {
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id, status")
    .eq("user_id", userId)
    .eq("mentor_id", mentorId)
    .maybeSingle();

  let firstActivation = false;
  if (!existing) {
    const { error } = await supabase
      .from("subscriptions")
      .insert({ user_id: userId, mentor_id: mentorId, status: "active" });
    if (error) throw error;
    firstActivation = true;
  } else if (existing.status !== "active") {
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "active", started_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw error;
    firstActivation = true;
  }
  logStep("Subscription activated", { userId, mentorId, firstActivation });

  // Remember the canonical Stripe customer for this user
  if (customerId) {
    await supabase
      .from("user_payment_config")
      .upsert({ user_id: userId, stripe_customer_id: customerId }, { onConflict: "user_id" });
  }

  // Record promo redemption once
  if (promoCode && firstActivation) {
    const { data: code } = await supabase
      .from("discount_codes")
      .select("id, current_uses")
      .eq("code", promoCode)
      .maybeSingle();
    if (code) {
      await supabase
        .from("discount_codes")
        .update({ current_uses: code.current_uses + 1 })
        .eq("id", code.id);
      await supabase
        .from("code_redemptions")
        .insert({ code_id: code.id, user_id: userId });
      logStep("Promo redemption recorded", { promoCode });
    }
  }
}

async function cancelSubscription(userId: string, mentorId: string) {
  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("user_id", userId)
    .eq("mentor_id", mentorId)
    .eq("status", "active");
  if (error) throw error;
  logStep("Subscription cancelled", { userId, mentorId });
}

serve(async (req) => {
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const signature = req.headers.get("stripe-signature");
    if (!signature) return new Response("Missing signature", { status: 400 });

    const body = await req.text();
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      logStep("Signature verification failed", { message: String(err) });
      return new Response("Invalid signature", { status: 400 });
    }

    logStep("Event received", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const mentorId = session.metadata?.mentor_id;
        if (userId && mentorId && session.payment_status === "paid") {
          await activateSubscription(
            userId,
            mentorId,
            session.metadata?.promo_code,
            typeof session.customer === "string" ? session.customer : session.customer?.id
          );
        } else {
          logStep("Session skipped", {
            hasUser: !!userId,
            hasMentor: !!mentorId,
            payment_status: session.payment_status,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        const mentorId = sub.metadata?.mentor_id;
        if (userId && mentorId) {
          await cancelSubscription(userId, mentorId);
        } else {
          logStep("Subscription deleted without metadata — skipping", { id: sub.id });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        const mentorId = sub.metadata?.mentor_id;
        if (!userId || !mentorId) break;
        // Revoke on terminal states; reactivate if payment recovers
        if (["canceled", "unpaid", "incomplete_expired"].includes(sub.status)) {
          await cancelSubscription(userId, mentorId);
        } else if (sub.status === "active") {
          await activateSubscription(userId, mentorId, null,
            typeof sub.customer === "string" ? sub.customer : sub.customer?.id);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        // One-time purchases carry metadata via payment_intent_data
        const piId = typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;
        if (piId && charge.refunded) {
          const pi = await stripe.paymentIntents.retrieve(piId);
          const userId = pi.metadata?.user_id;
          const mentorId = pi.metadata?.mentor_id;
          if (userId && mentorId) {
            await cancelSubscription(userId, mentorId);
          }
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
