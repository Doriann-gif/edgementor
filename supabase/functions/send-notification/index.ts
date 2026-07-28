import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

// Sends transactional notification emails via Resend. Invoked by Postgres
// triggers (pg_net) on new subscriptions, messages, and intro requests.
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
  type PrefKey = "notify_messages" | "notify_new_subscriber" | "notify_intro_request";

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

    if (type === "new_message") {
      // Notify the message recipient (student or mentor).
      const to = await resolveRecipient(record.recipient_id, "notify_messages");
      if (to) {
        await sendEmail(to, {
          subject: `New message from ${record.sender_name || "your mentor"}`,
          heading: "You have a new message 💬",
          body: `<strong>${record.sender_name || "Someone"}</strong> sent you a message${record.subject ? `: "<em>${record.subject}</em>"` : ""}. Open EdgeMentor to read and reply.`,
          ctaLabel: "Read message",
          ctaPath: "/dashboard",
        });
      }
    } else if (type === "new_subscription") {
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
    } else if (type === "new_intro_request") {
      // Notify the mentor of a free-intro lead.
      const uid = await mentorUserId(record.mentor_id);
      const to = await resolveRecipient(uid, "notify_intro_request");
      if (to) {
        await sendEmail(to, {
          subject: "New intro call request",
          heading: "Someone wants a free intro call 📅",
          body: `<strong>${record.requester_name || "A prospective student"}</strong> requested a free intro call${record.requester_email ? ` (${record.requester_email})` : ""}. Reply from your Mentor Hub to schedule it.`,
          ctaLabel: "View request",
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
