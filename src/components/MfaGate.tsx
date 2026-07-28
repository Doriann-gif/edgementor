import { ReactNode, useState } from "react";
import { useLocation } from "react-router-dom";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { ShieldCheck, Loader2, Zap } from "lucide-react";

// Paths that own their own auth flow and must not be blocked by the gate:
// - /auth handles the email/password login + its own MFA dialog.
// - /reset-password runs on a recovery session; forcing a challenge there
//   would trap a user who is legitimately resetting their password.
const EXEMPT_PATHS = ["/auth", "/reset-password"];

/**
 * App-wide second-factor enforcement. Supabase issues an aal1 session the
 * moment a user authenticates (password OR Google OAuth) and only promotes it
 * to aal2 after a TOTP challenge. The email/password screen challenges inline,
 * but OAuth returns and hard refreshes would otherwise land in the app at aal1.
 * This gate covers every remaining entry path: whenever a signed-in session
 * still owes a second factor, it replaces the app with a blocking challenge.
 */
const MfaGate = ({ children }: { children: ReactNode }) => {
  const { user, mfaRequired, assuranceChecked, refreshAssurance, signOut } = useAuth();
  const { pathname } = useLocation();
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const exempt = EXEMPT_PATHS.some((p) => pathname.startsWith(p));
  // Only intercept once we actually know a factor is outstanding — never block
  // on the exempt routes, and never before the first assurance check resolves.
  if (exempt || !user || !assuranceChecked || !mfaRequired) {
    return <>{children}</>;
  }

  const verify = async () => {
    if (code.length !== 6) return;
    setVerifying(true);
    try {
      const { data: factors, error: listErr } = await supabase.auth.mfa.listFactors();
      if (listErr) throw listErr;
      const totp = factors.totp?.[0];
      if (!totp) throw new Error("No 2FA device is registered on this account.");
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId: totp.id });
      if (chErr) throw chErr;
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: totp.id,
        challengeId: challenge.id,
        code,
      });
      if (vErr) throw vErr;
      await refreshAssurance();
      toast.success("Verified — welcome back 🔒");
    } catch (err: any) {
      toast.error(err.message || "That code didn't match. Try again.");
      setCode("");
    } finally {
      setVerifying(false);
    }
  };

  const cancel = async () => {
    // Bailing out must not leave a half-authenticated aal1 session lingering.
    await signOut();
    setCode("");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Zap className="h-6 w-6 text-primary" />
          <span className="font-heading font-bold text-xl text-foreground">EdgeMentor</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/20">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-heading text-xl font-bold text-foreground">Two-Factor Verification</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Enter the 6-digit code from your authenticator app to continue.
          </p>

          <div className="flex justify-center py-2">
            <InputOTP
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              value={code}
              onChange={setCode}
              onComplete={verify}
              disabled={verifying}
              autoFocus
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button className="w-full font-semibold mt-3" onClick={verify} disabled={verifying || code.length !== 6}>
            {verifying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
            Verify
          </Button>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground mt-4"
            onClick={cancel}
            disabled={verifying}
          >
            Cancel and sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default MfaGate;
