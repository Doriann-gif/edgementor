// Guards against stored-XSS via user-provided URLs. React escapes attribute
// *values* but does NOT block dangerous URL *schemes* — an <a href="javascript:…">
// built from a mentor's social link or track-record URL would execute on click.
// Every place we render a user-supplied URL as an href must run it through this.

/**
 * Returns a safe, normalized URL, or null if the input can't be trusted as a
 * link. Allows http/https/mailto and relative paths; scheme-less input (e.g.
 * "instagram.com/x") is treated as https. Anything else — javascript:, data:,
 * vbscript:, file:, etc. — returns null so the caller can drop the link.
 */
export const safeExternalUrl = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  let s = raw.trim();
  if (!s) return null;

  // Relative in-app links are safe as-is.
  if (s.startsWith("/") || s.startsWith("#")) return s;

  // Scheme-less user input (a bare domain) → assume https rather than reject it.
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) s = `https://${s}`;

  try {
    const u = new URL(s);
    if (u.protocol === "http:" || u.protocol === "https:" || u.protocol === "mailto:") {
      return u.href;
    }
    return null;
  } catch {
    return null;
  }
};
