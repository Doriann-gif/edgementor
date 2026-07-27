import { useEffect, useState } from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, Smartphone, Loader2, Copy, Check } from "lucide-react";

type Factor = { id: string; status: string; factor_type: string; friendly_name?: string | null };

/** TOTP two-factor auth enrollment & management. Uses Supabase's native MFA. */
const TwoFactorSettings = () => {
  const [loading, setLoading] = useState(true);
  const [verifiedFactor, setVerifiedFactor] = useState<Factor | null>(null);

  // Enrollment flow state
  const [enrolling, setEnrolling] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error) {
      const verified = (data.totp?.[0] as Factor | undefined) ?? null;
      setVerifiedFactor(verified);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const startEnroll = async () => {
    setEnrolling(true);
    try {
      // Clear any half-finished (unverified) factors so they don't pile up
      const { data: list } = await supabase.auth.mfa.listFactors();
      const stale = (list?.all ?? []).filter((f) => f.factor_type === "totp" && f.status === "unverified");
      for (const f of stale) await supabase.auth.mfa.unenroll({ factorId: f.id });

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Authenticator (${new Date().toISOString().slice(0, 10)})`,
      });
      if (error) throw error;
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
    } catch (err: any) {
      toast.error(err.message || "Couldn't start 2FA setup.");
      setEnrolling(false);
    }
  };

  const cancelEnroll = async () => {
    if (factorId) {
      try {
        await supabase.auth.mfa.unenroll({ factorId });
      } catch {
        /* best-effort cleanup */
      }
    }
    setEnrolling(false);
    setFactorId(null);
    setQrCode(null);
    setSecret(null);
    setCode("");
  };

  const confirmEnroll = async () => {
    if (!factorId || code.length !== 6) return;
    setVerifying(true);
    try {
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
      if (chErr) throw chErr;
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });
      if (vErr) throw vErr;
      toast.success("Two-factor authentication is on 🔒");
      setEnrolling(false);
      setFactorId(null);
      setQrCode(null);
      setSecret(null);
      setCode("");
      await refresh();
    } catch (err: any) {
      toast.error(err.message || "That code didn't match. Try again.");
      setCode("");
    } finally {
      setVerifying(false);
    }
  };

  const disable = async () => {
    if (!verifiedFactor) return;
    setDisabling(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: verifiedFactor.id });
      if (error) throw error;
      toast.success("Two-factor authentication disabled.");
      await refresh();
    } catch (err: any) {
      toast.error(err.message || "Couldn't disable 2FA — try signing in again with your code first.");
    } finally {
      setDisabling(false);
    }
  };

  const copySecret = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Smartphone className="h-4 w-4 text-primary" />
        <h3 className="font-heading font-semibold text-foreground">Two-Factor Authentication</h3>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking status…
        </div>
      ) : verifiedFactor ? (
        // ── 2FA is ON ──
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">2FA is enabled</p>
              <p className="text-muted-foreground mt-0.5">
                Your account is protected with an authenticator app. You'll be asked for a code each time you sign in.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="text-sm" onClick={disable} disabled={disabling}>
            {disabling ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />}
            Disable 2FA
          </Button>
        </div>
      ) : !enrolling ? (
        // ── 2FA is OFF (idle) ──
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
            <ShieldAlert className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security. After entering your password, you'll also enter a 6-digit code from an
              authenticator app (Google Authenticator, Authy, 1Password…).
            </p>
          </div>
          <Button size="sm" className="text-sm font-semibold" onClick={startEnroll}>
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Enable 2FA
          </Button>
        </div>
      ) : (
        // ── Enrollment in progress ──
        <div className="space-y-5">
          {qrCode ? (
            <>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Open your authenticator app and scan this QR code.</li>
                <li>Enter the 6-digit code it shows to confirm.</li>
              </ol>

              <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                <img
                  src={qrCode}
                  alt="2FA QR code"
                  className="h-44 w-44 rounded-lg bg-white p-2 shrink-0"
                />
                <div className="space-y-3 w-full">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Can't scan? Enter this key manually:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-muted rounded-md px-2.5 py-2 break-all font-mono text-foreground">
                        {secret}
                      </code>
                      <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={copySecret} type="button">
                        {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Verification code</p>
                    <InputOTP
                      maxLength={6}
                      pattern={REGEXP_ONLY_DIGITS}
                      value={code}
                      onChange={setCode}
                      onComplete={confirmEnroll}
                      disabled={verifying}
                    >
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot key={i} index={i} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="text-sm font-semibold" onClick={confirmEnroll} disabled={verifying || code.length !== 6}>
                  {verifying ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />}
                  Verify & turn on
                </Button>
                <Button variant="ghost" size="sm" className="text-sm" onClick={cancelEnroll} disabled={verifying}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Generating your secure key…
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TwoFactorSettings;
