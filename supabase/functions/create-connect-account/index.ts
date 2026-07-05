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
  console.log(`[CREATE-CONNECT-ACCOUNT] ${step}${d}`);
};

// Countries where Stripe supports Connect payout accounts, keyed by the
// country names used in the application form. Mentors from other countries
// get a clear error instead of a US account that fails KYC.
const CONNECT_COUNTRY_CODES: Record<string, string> = {
  "United States": "US", "United Kingdom": "GB", "Australia": "AU", "Austria": "AT",
  "Belgium": "BE", "Bulgaria": "BG", "Canada": "CA", "Croatia": "HR", "Cyprus": "CY",
  "Czech Republic": "CZ", "Denmark": "DK", "Estonia": "EE", "Finland": "FI",
  "France": "FR", "Germany": "DE", "Greece": "GR", "Hong Kong": "HK", "Hungary": "HU",
  "Ireland": "IE", "Italy": "IT", "Japan": "JP", "Latvia": "LV", "Lithuania": "LT",
  "Luxembourg": "LU", "Malta": "MT", "Mexico": "MX", "Netherlands": "NL",
  "New Zealand": "NZ", "Norway": "NO", "Poland": "PL", "Portugal": "PT",
  "Romania": "RO", "Singapore": "SG", "Slovakia": "SK", "Slovenia": "SI",
  "Spain": "ES", "Sweden": "SE", "Switzerland": "CH", "Thailand": "TH",
  "United Arab Emirates": "AE", "Brazil": "BR", "Liechtenstein": "LI", "Gibraltar": "GI",
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
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Check if user is a mentor
    const { data: mentor, error: mentorError } = await supabase
      .from("mentors")
      .select("id, name, country")
      .eq("user_id", user.id)
      .single();
    if (mentorError || !mentor) throw new Error("You are not a mentor");
    logStep("Mentor found", { mentorId: mentor.id });

    // Get existing payment config
    const { data: paymentConfig } = await supabase
      .from("mentor_payment_config")
      .select("stripe_connect_account_id")
      .eq("mentor_id", mentor.id)
      .maybeSingle();

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "https://edgementor.lovable.app";

    let accountId = paymentConfig?.stripe_connect_account_id;

    // Create a new Custom Connect account if none exists
    if (!accountId) {
      const countryCode = mentor.country ? CONNECT_COUNTRY_CODES[mentor.country] : "US";
      if (!countryCode) {
        throw new Error(
          `Payouts aren't available in ${mentor.country} yet. Please contact support to discuss alternatives.`
        );
      }
      logStep("Creating new Custom Connect account", { country: countryCode });
      const account = await stripe.accounts.create({
        type: "custom",
        country: countryCode,
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        business_profile: {
          name: mentor.name,
          mcc: "8299",
          url: `${origin}/mentor/${mentor.id}`,
        },
      });
      accountId = account.id;
      logStep("Connect account created", { accountId });

      // Store in payment config table (upsert). If this fails we must NOT
      // proceed — otherwise every retry creates another orphaned account.
      const { error: upsertError } = await supabase
        .from("mentor_payment_config")
        .upsert({
          mentor_id: mentor.id,
          stripe_connect_account_id: accountId,
        }, { onConflict: "mentor_id" });
      if (upsertError) {
        logStep("Failed to persist Connect account ID", { message: upsertError.message });
        throw new Error(`Could not save payout account: ${upsertError.message}`);
      }
      logStep("Stored Connect account ID in payment config");
    }

    // Create an Account Link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/settings?tab=billing`,
      return_url: `${origin}/settings?tab=billing&connect=success`,
      type: "account_onboarding",
    });
    logStep("Account link created", { url: accountLink.url });

    return new Response(JSON.stringify({ url: accountLink.url, accountId }), {
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
