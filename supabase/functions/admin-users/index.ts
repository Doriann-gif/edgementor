import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[ADMIN-USERS] ${step}${d}`);
};

// Only these profile columns may be written from the admin console.
const EDITABLE_PROFILE_COLS = new Set([
  "display_name", "country", "age", "trading_experience", "bio", "timezone",
  "trading_interests", "email_notifications", "marketing_emails",
  "notify_messages", "notify_new_subscriber", "notify_intro_request",
]);

// Roles an admin may grant/revoke through this console. `user` is the implicit
// default (absence of a row), so we only manage the two elevated roles.
const MANAGEABLE_ROLES = new Set(["admin", "moderator"]);

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    // ---- Authenticate the caller and require the admin role ---------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { error: "No authorization header" });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return json(401, { error: "Not authenticated" });
    const caller = userData.user;

    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: caller.id,
      _role: "admin",
    });
    if (roleError) throw roleError;
    if (!isAdmin) {
      logStep("Forbidden — caller is not admin", { callerId: caller.id });
      return json(403, { error: "Admin access required" });
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action as string;
    logStep("Action", { action, callerId: caller.id });

    switch (action) {
      // ---- List every user with merged auth + profile + role + subs ------
      case "list": {
        const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (listErr) throw listErr;

        const [{ data: profiles }, { data: roles }, { data: subs }, { data: mentors }] = await Promise.all([
          supabase.from("profiles").select("id, display_name, country, age, created_at"),
          supabase.from("user_roles").select("user_id, role"),
          supabase.from("subscriptions").select("user_id, status"),
          supabase.from("mentors").select("user_id, name, status"),
        ]);

        const pById = new Map((profiles ?? []).map((p) => [p.id, p]));
        const rolesById = new Map<string, string[]>();
        (roles ?? []).forEach((r) => rolesById.set(r.user_id, [...(rolesById.get(r.user_id) ?? []), r.role]));
        const subCount = new Map<string, { active: number; total: number }>();
        (subs ?? []).forEach((s) => {
          const c = subCount.get(s.user_id) ?? { active: 0, total: 0 };
          c.total += 1;
          if (s.status === "active") c.active += 1;
          subCount.set(s.user_id, c);
        });
        const mentorByUser = new Map((mentors ?? []).filter((m) => m.user_id).map((m) => [m.user_id, m]));

        const users = list.users.map((u) => {
          const p = pById.get(u.id);
          const c = subCount.get(u.id) ?? { active: 0, total: 0 };
          const mentor = mentorByUser.get(u.id);
          return {
            id: u.id,
            email: u.email ?? null,
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at ?? null,
            email_confirmed_at: u.email_confirmed_at ?? null,
            banned_until: (u as { banned_until?: string }).banned_until ?? null,
            providers: (u.identities ?? []).map((i) => i.provider),
            display_name: p?.display_name ?? null,
            country: p?.country ?? null,
            age: p?.age ?? null,
            roles: rolesById.get(u.id) ?? [],
            is_mentor: Boolean(mentor),
            mentor_name: mentor?.name ?? null,
            mentor_status: mentor?.status ?? null,
            active_subs: c.active,
            total_subs: c.total,
          };
        });

        return json(200, { users });
      }

      // ---- Full detail for one user --------------------------------------
      case "get": {
        const userId = body.user_id as string;
        if (!userId) return json(400, { error: "user_id required" });

        const { data: au, error: auErr } = await supabase.auth.admin.getUserById(userId);
        if (auErr) throw auErr;

        const [{ data: profile }, { data: roles }, { data: subscriptions }, { data: mentor }] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", userId),
          supabase
            .from("subscriptions")
            .select("*, mentors(name, monthly_price, avatar, payment_type)")
            .eq("user_id", userId)
            .order("started_at", { ascending: false }),
          supabase.from("mentors").select("id, name, status, available").eq("user_id", userId).maybeSingle(),
        ]);

        const u = au.user;
        return json(200, {
          detail: {
            id: u?.id,
            email: u?.email ?? null,
            phone: u?.phone ?? null,
            created_at: u?.created_at,
            last_sign_in_at: u?.last_sign_in_at ?? null,
            email_confirmed_at: u?.email_confirmed_at ?? null,
            banned_until: (u as { banned_until?: string })?.banned_until ?? null,
            providers: (u?.identities ?? []).map((i) => i.provider),
            profile: profile ?? null,
            roles: (roles ?? []).map((r) => r.role),
            mentor: mentor ?? null,
            subscriptions: subscriptions ?? [],
          },
        });
      }

      // ---- Edit whitelisted profile fields -------------------------------
      case "update_profile": {
        const userId = body.user_id as string;
        const updates = (body.updates ?? {}) as Record<string, unknown>;
        if (!userId) return json(400, { error: "user_id required" });
        const clean: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(updates)) if (EDITABLE_PROFILE_COLS.has(k)) clean[k] = v;
        if (Object.keys(clean).length === 0) return json(400, { error: "No editable fields provided" });
        const { error } = await supabase.from("profiles").update(clean).eq("id", userId);
        if (error) throw error;
        return json(200, { ok: true });
      }

      // ---- Grant a role --------------------------------------------------
      case "set_role": {
        const userId = body.user_id as string;
        const role = body.role as string;
        if (!userId || !MANAGEABLE_ROLES.has(role)) return json(400, { error: "Invalid user_id or role" });
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        // 23505 = already has the role; treat as success (idempotent).
        if (error && error.code !== "23505") throw error;
        return json(200, { ok: true });
      }

      // ---- Revoke a role -------------------------------------------------
      case "remove_role": {
        const userId = body.user_id as string;
        const role = body.role as string;
        if (!userId || !MANAGEABLE_ROLES.has(role)) return json(400, { error: "Invalid user_id or role" });
        if (role === "admin" && userId === caller.id) {
          return json(400, { error: "You can't remove your own admin role." });
        }
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
        if (error) throw error;
        return json(200, { ok: true });
      }

      // ---- Ban / unban login ---------------------------------------------
      case "ban": {
        const userId = body.user_id as string;
        const ban = Boolean(body.ban);
        if (!userId) return json(400, { error: "user_id required" });
        if (userId === caller.id) return json(400, { error: "You can't ban your own account." });
        const { error } = await supabase.auth.admin.updateUserById(userId, {
          ban_duration: ban ? "876000h" : "none", // ~100 years = indefinite
        });
        if (error) throw error;
        return json(200, { ok: true, banned: ban });
      }

      // ---- Send a password-reset email -----------------------------------
      case "send_password_reset": {
        const userId = body.user_id as string;
        if (!userId) return json(400, { error: "user_id required" });
        const { data: au, error: auErr } = await supabase.auth.admin.getUserById(userId);
        if (auErr) throw auErr;
        const email = au.user?.email;
        if (!email) return json(400, { error: "User has no email on file" });
        const site = Deno.env.get("SITE_URL") ?? "https://edgementor.net";
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${site}/reset-password`,
        });
        if (error) throw error;
        return json(200, { ok: true, email });
      }

      // ---- Permanently delete a user -------------------------------------
      case "delete_user": {
        const userId = body.user_id as string;
        if (!userId) return json(400, { error: "user_id required" });
        if (userId === caller.id) {
          return json(400, { error: "You can't delete your own account from here." });
        }

        // Best-effort: cancel any active Stripe subscriptions so a deleted
        // user's card stops being charged (mirrors delete-account).
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        const { data: au } = await supabase.auth.admin.getUserById(userId);
        const email = au?.user?.email;
        if (stripeKey && email) {
          try {
            const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
            const { data: upc } = await supabase
              .from("user_payment_config").select("stripe_customer_id").eq("user_id", userId).maybeSingle();
            const customerId = upc?.stripe_customer_id ??
              (await stripe.customers.list({ email, limit: 1 })).data[0]?.id;
            if (customerId) {
              const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 100 });
              for (const s of subs.data) await stripe.subscriptions.cancel(s.id);
              logStep("Cancelled active Stripe subscriptions", { count: subs.data.length });
            }
          } catch (stripeErr) {
            logStep("Stripe cleanup failed (continuing)", { message: String(stripeErr) });
          }
        }

        // Remove any mentor listing + content first (FKs cascade the rest).
        const { data: mentor } = await supabase.from("mentors").select("id").eq("user_id", userId).maybeSingle();
        if (mentor) {
          await supabase.from("mentor_content").delete().eq("mentor_id", mentor.id);
          await supabase.from("mentors").delete().eq("id", mentor.id);
        }

        // Deleting the auth user cascades profiles, subscriptions, roles, etc.
        const { error: delErr } = await supabase.auth.admin.deleteUser(userId);
        if (delErr) throw delErr;
        logStep("User deleted", { userId });
        return json(200, { ok: true });
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
