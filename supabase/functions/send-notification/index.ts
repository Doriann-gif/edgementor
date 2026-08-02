import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

// Sends transactional notification emails via Resend. Invoked by Postgres
// triggers (pg_net) on new subscriptions, mentor approvals, and payouts.
// Fire-and-forget from the DB's perspective: any failure here is logged but
// never blocks the originating insert.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-notify-secret",
};

const logStep = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SEND-NOTIFICATION] ${step}${d}`);
};

// User-controlled fields (display name, payout reference) are embedded in the
// email HTML below. Escape them so a crafted value can't inject markup/links
// for phishing inside our emails.
const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const SITE_URL = Deno.env.get("SITE_URL") || "https://edgementor.net";
const FROM = Deno.env.get("NOTIFY_FROM") || "EdgeMentor <notifications@edgementor.net>";

interface EmailContent {
  subject: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaPath: string;
}

const wrapHtml = (c: EmailContent) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#0b0b0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">⚡ EdgeMentor</span>
    </div>
    <div style="background:#15151c;border:1px solid #26262f;border-radius:16px;padding:28px;">
      <h1 style="margin:0 0 12px;font-size:19px;color:#ffffff;">${c.heading}</h1>
      <p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#a1a1b0;">${c.body}</p>
      <a href="${SITE_URL}${c.ctaPath}" style="display:inline-block;background:#10b981;color:#04120c;text-decoration:none;font-weight:600;font-size:14px;padding:11px 22px;border-radius:10px;">${c.ctaLabel}</a>
    </div>
    <p style="text-align:center;margin:20px 0 0;font-size:11px;color:#6b6b78;">
      You're receiving this because you have an EdgeMentor account.
      Manage email preferences in <a href="${SITE_URL}/settings?tab=notifications" style="color:#10b981;">your settings</a>.
    </p>
  </div>
</body></html>`;

const sendEmail = async (to: string, c: EmailContent) => {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) {
    logStep("RESEND_API_KEY not set — skipping send", { to, subject: c.subject });
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject: c.subject, html: wrapHtml(c) }),
  });
  if (!res.ok) {
    const txt = await res.text();
    logStep("Resend error", { status: res.status, txt });
  } else {
    logStep("Email sent", { to, subject: c.subject });
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Shared-secret auth: only our DB triggers (which set this header) may invoke.
  // Fail closed — if the secret isn't configured, reject rather than run open.
  const secret = Deno.env.get("NOTIFY_WEBHOOK_SECRET");
  if (!secret || req.headers.get("x-notify-secret") !== secret) {
    logStep(secret ? "Rejected: bad secret" : "Rejected: NOTIFY_WEBHOOK_SECRET not configured");
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // Per-type preference columns on `profiles`. Fixed whitelist — never
  // interpolated from request input — so the dynamic select is safe.
  type PrefKey = "notify_new_subscriber";

  // Resolve a user's email, honoring the master `email_notifications` switch and,
  // when given, the per-type preference. Returns null when we shouldn't email
  // them (opted out at either level, or no address on file). Missing/null pref
  // columns are treated as opted-in so existing rows keep working.
  const resolveRecipient = async (
    userId: string | null | undefined,
    prefKey?: PrefKey,
  ): Promise<string | null> => {
    if (!userId) return null;
    const columns = prefKey ? `email_notifications, ${prefKey}` : "email_notifications";
    const { data: prof } = await admin
      .from("profiles").select(columns).eq("id", userId).maybeSingle();
    const p = prof as Record<string, boolean | null> | null;
    if (p && p.email_notifications === false) {
      logStep("Recipient opted out (all email)", { userId });
      return null;
    }
    if (p && prefKey && p[prefKey] === false) {
      logStep("Recipient opted out (type)", { userId, prefKey });
      return null;
    }
    const { data: u, error } = await admin.auth.admin.getUserById(userId);
    if (error || !u?.user?.email) return null;
    return u.user.email;
  };

  const mentorUserId = async (mentorId: string): Promise<string | null> => {
    const { data } = await admin.from("mentors").select("user_id, name").eq("id", mentorId).maybeSingle();
    return data?.user_id ?? null;
  };

  try {
    const payload = await req.json();
    const type: string = payload.type;
    const record = payload.record ?? {};
    logStep("Invoked", { type });

    if (type === "new_subscription") {
      // Notify the mentor that they gained a subscriber.
      const uid = await mentorUserId(record.mentor_id);
      const to = await resolveRecipient(uid, "notify_new_subscriber");
      if (to) {
        await sendEmail(to, {
          subject: "You have a new subscriber 🎉",
          heading: "New subscriber on EdgeMentor 🎉",
          body: "A new student just subscribed to your mentorship. Head to your Mentor Hub to welcome them and share your content.",
          ctaLabel: "Open Mentor Hub",
          ctaPath: "/mentor-dashboard",
        });
      }
    } else if (type === "mentor_approved") {
      // Notify a newly approved mentor that their profile is live.
      // Transactional (account status) — gated only by the master email switch.
      const to = await resolveRecipient(record.user_id);
      if (to) {
        await sendEmail(to, {
          subject: "You're approved — welcome to EdgeMentor 🎉",
          heading: "You're an EdgeMentor mentor! 🎉",
          body: `Congratulations${record.name ? `, <strong>${esc(record.name)}</strong>` : ""} — your application has been approved and your profile is now <strong>live in the marketplace</strong>. Head to your Mentor Hub to add your content, connect payouts, and start welcoming students.`,
          ctaLabel: "Open Mentor Hub",
          ctaPath: "/mentor-dashboard",
        });
      }
    } else if (type === "payout_paid") {
      // Confirm to the mentor that a withdrawal was actually sent.
      // Transactional (money movement) — master switch only.
      const uid = await mentorUserId(record.mentor_id);
      const to = await resolveRecipient(uid);
      if (to) {
        const amount = Number(record.amount ?? 0).toFixed(2);
        const rail = record.method === "crypto" ? "crypto wallet"
          : record.method === "bank" ? "bank account"
          : record.method === "paypal" ? "PayPal account"
          : "payout method";
        await sendEmail(to, {
          subject: `Your $${amount} payout is on the way`,
          heading: "Payout sent 💸",
          body: `We've sent <strong>$${amount}</strong> to your ${rail}.${
            record.tx_reference ? ` Reference: <strong>${esc(record.tx_reference)}</strong>.` : ""
          } Bank transfers usually land in 1–3 business days; crypto is typically much faster.`,
          ctaLabel: "View earnings",
          ctaPath: "/mentor-dashboard",
        });
      }
    } else {
      logStep("Unknown type", { type });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (err) {
    logStep("Error", { message: err instanceof Error ? err.message : String(err) });
    // Return 200 so pg_net doesn't retry-storm; the error is logged.
    return new Response(JSON.stringify({ ok: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  }
});
