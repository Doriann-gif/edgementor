import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[MENTOR-PAYOUTS] ${step}${d}`);
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

const MIN_WITHDRAWAL = 20; // USD — keeps manual fulfilment worth the effort.

// Per-rail required fields. Anything else submitted is dropped, so a mentor
// can't stuff arbitrary payload into the payout record the admin acts on.
const METHOD_FIELDS: Record<string, string[]> = {
  crypto: ["asset", "network", "wallet_address"],
  bank: ["account_holder", "iban", "swift", "bank_name", "country"],
  paypal: ["paypal_email"],
};

// Balance = sum of ledger entries (earnings positive, payouts negative) minus
// anything already reserved by a pending/processing request.
async function computeBalance(supabase: any, mentorId: string) {
  const [{ data: entries }, { data: openReqs }] = await Promise.all([
    supabase.from("mentor_ledger").select("amount").eq("mentor_id", mentorId),
    supabase.from("payout_requests").select("amount").eq("mentor_id", mentorId).in("status", ["pending", "processing"]),
  ]);
  const ledger = (entries ?? []).reduce((s: number, e: any) => s + Number(e.amount), 0);
  const reserved = (openReqs ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0);
  return { total: ledger, reserved, available: ledger - reserved };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { error: "No authorization header" });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return json(401, { error: "Not authenticated" });
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const action = body?.action as string;
    logStep("Action", { action, userId: user.id });

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });

    // ---- Admin actions -----------------------------------------------------
    if (action?.startsWith("admin_")) {
      if (!isAdmin) return json(403, { error: "Admin access required" });

      if (action === "admin_list") {
        const { data: requests, error } = await supabase
          .from("payout_requests")
          .select("*, mentors(name, avatar, country)")
          .order("requested_at", { ascending: false });
        if (error) throw error;
        return json(200, { requests: requests ?? [] });
      }

      // Mark a request paid/rejected. Paying writes the negative ledger entry
      // that actually debits the mentor's balance, so it must happen here
      // (service_role) rather than through a plain RLS update from the client.
      if (action === "admin_resolve") {
        const id = body.request_id as string;
        const status = body.status as string;
        if (!id || !["paid", "rejected", "processing"].includes(status)) {
          return json(400, { error: "request_id and a valid status are required" });
        }

        const { data: reqRow, error: reqErr } = await supabase
          .from("payout_requests").select("*").eq("id", id).maybeSingle();
        if (reqErr) throw reqErr;
        if (!reqRow) return json(404, { error: "Payout request not found" });
        if (reqRow.status === "paid") return json(400, { error: "This request is already paid." });

        if (status === "paid") {
          const { error: ledgerErr } = await supabase.from("mentor_ledger").insert({
            mentor_id: reqRow.mentor_id,
            entry_type: "payout",
            amount: -Math.abs(Number(reqRow.amount)),
            source: reqRow.method,
            payout_request_id: reqRow.id,
            note: body.tx_reference ? `Paid — ref ${body.tx_reference}` : "Paid by admin",
          });
          if (ledgerErr) throw ledgerErr;
        }

        const { error: updErr } = await supabase.from("payout_requests").update({
          status,
          admin_note: body.admin_note ?? reqRow.admin_note,
          tx_reference: body.tx_reference ?? reqRow.tx_reference,
          processed_at: status === "processing" ? null : new Date().toISOString(),
          processed_by: user.id,
        }).eq("id", id);
        if (updErr) throw updErr;

        logStep("Request resolved", { id, status });
        return json(200, { ok: true });
      }

      return json(400, { error: `Unknown admin action: ${action}` });
    }

    // ---- Mentor actions ----------------------------------------------------
    const { data: mentor } = await supabase
      .from("mentors").select("id, name").eq("user_id", user.id).maybeSingle();
    if (!mentor) return json(403, { error: "You are not a mentor" });

    switch (action) {
      // Everything the Income tab needs in one round-trip.
      case "get_state": {
        const [{ data: method }, balance, { data: requests }, { data: ledger }] = await Promise.all([
          supabase.from("mentor_payout_methods").select("*").eq("mentor_id", mentor.id).maybeSingle(),
          computeBalance(supabase, mentor.id),
          supabase.from("payout_requests").select("*").eq("mentor_id", mentor.id)
            .order("requested_at", { ascending: false }).limit(50),
          supabase.from("mentor_ledger").select("*").eq("mentor_id", mentor.id)
            .order("created_at", { ascending: false }).limit(100),
        ]);
        return json(200, {
          method: method ?? null,
          balance,
          requests: requests ?? [],
          ledger: ledger ?? [],
          min_withdrawal: MIN_WITHDRAWAL,
        });
      }

      // Choose/replace the payout rail.
      case "save_method": {
        const method = body.method as string;
        const details = (body.details ?? {}) as Record<string, unknown>;
        const required = METHOD_FIELDS[method];
        if (!required) return json(400, { error: "Choose crypto, bank, or paypal." });

        const clean: Record<string, unknown> = {};
        for (const key of required) {
          const value = typeof details[key] === "string" ? (details[key] as string).trim() : details[key];
          if (!value) return json(400, { error: `Missing required field: ${key.replace(/_/g, " ")}` });
          clean[key] = value;
        }

        const { error } = await supabase.from("mentor_payout_methods").upsert({
          mentor_id: mentor.id,
          method,
          details: clean,
          updated_at: new Date().toISOString(),
        }, { onConflict: "mentor_id" });
        if (error) throw error;

        logStep("Payout method saved", { mentorId: mentor.id, method });
        return json(200, { ok: true });
      }

      // Queue a withdrawal for the admin to fulfil.
      case "request_withdrawal": {
        const { data: method } = await supabase
          .from("mentor_payout_methods").select("*").eq("mentor_id", mentor.id).maybeSingle();
        if (!method) return json(400, { error: "Set up a payout method first." });

        const balance = await computeBalance(supabase, mentor.id);
        const requested = body.amount != null ? Number(body.amount) : balance.available;
        if (!Number.isFinite(requested) || requested <= 0) {
          return json(400, { error: "Enter a valid amount." });
        }
        if (requested < MIN_WITHDRAWAL) {
          return json(400, { error: `Minimum withdrawal is $${MIN_WITHDRAWAL}.` });
        }
        if (requested > balance.available) {
          return json(400, { error: `You can withdraw up to $${balance.available.toFixed(2)}.` });
        }

        const { error } = await supabase.from("payout_requests").insert({
          mentor_id: mentor.id,
          amount: requested,
          method: method.method,
          method_details: method.details,
        });
        if (error) throw error;

        logStep("Withdrawal requested", { mentorId: mentor.id, amount: requested });
        return json(200, {
          ok: true,
          message: `Withdrawal of $${requested.toFixed(2)} requested. You'll be paid to your ${method.method} details shortly.`,
        });
      }

      default:
        return json(400, { error: `Unknown action: ${action}` });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return json(500, { error: msg });
  }
});
