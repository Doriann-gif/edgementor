// Pricing display helpers — keep monthly vs one-time wording consistent
// everywhere (a one-time mentor must never show "/mo").

type PricingLike = { payment_type?: string | null };

export const isOneTime = (m: PricingLike | undefined | null) => m?.payment_type === "one_time";

/** Suffix after the price, e.g. "/mo" for monthly, "" for one-time. */
export const priceSuffix = (m: PricingLike | undefined | null) => (isOneTime(m) ? "" : "/mo");

/** Short label for the plan type. */
export const planLabel = (m: PricingLike | undefined | null) => (isOneTime(m) ? "One-time" : "Monthly");

/** e.g. "$49/mo" or "$199 one-time". */
export const formatPrice = (m: (PricingLike & { monthly_price?: number }) | undefined | null) =>
  isOneTime(m) ? `$${m?.monthly_price ?? 0} one-time` : `$${m?.monthly_price ?? 0}/mo`;

/** CTA verb: "Subscribe" for monthly, "Get access" for one-time. */
export const subscribeVerb = (m: PricingLike | undefined | null) => (isOneTime(m) ? "Get Access" : "Subscribe");
