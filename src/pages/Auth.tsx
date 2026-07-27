import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { signInWithGoogle } from "@/integrations/auth/google";
import { toast } from "sonner";
import { Zap, ArrowLeft, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import PageTransition from "@/components/PageTransition";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaVerifying, setMfaVerifying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (showSuccess) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
    }
  }, [showSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        setShowSuccess(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // If the account has 2FA enabled, the session is only aal1 until a
        // TOTP code is verified — gate entry behind the second factor.
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
          setMfaStep(true);
          return;
        }
        toast.success("Welcome back!");
        navigate(redirectTo);
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const verifyMfa = async () => {
    if (mfaCode.length !== 6) return;
    setMfaVerifying(true);
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
        code: mfaCode,
      });
      if (vErr) throw vErr;
      toast.success("Welcome back!");
      navigate(redirectTo);
    } catch (err: any) {
      toast.error(err.message || "That code didn't match. Try again.");
      setMfaCode("");
    } finally {
      setMfaVerifying(false);
    }
  };

  // Abandoning the 2FA step must not leave a half-authenticated (aal1) session.
  const cancelMfa = async () => {
    await supabase.auth.signOut();
    setMfaStep(false);
    setMfaCode("");
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(error.message || "Google sign-in failed.");
      }
      // On success the browser redirects to Google and back with a session.
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <PageTransition>
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm relative">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-6 w-6 text-primary" />
            <span className="font-heading font-bold text-xl text-foreground">EdgeMentor</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSignUp ? "Sign up to get started." : "Sign in to your account."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xl shadow-black/20">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm">Display Name</Label>
              <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" className="bg-muted border-border" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="bg-muted border-border" required />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm">Password</Label>
              {!isSignUp && (
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={async () => {
                    if (!email) {
                      toast.error("Please enter your email first.");
                      return;
                    }
                    try {
                      const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${window.location.origin}/reset-password`,
                      });
                      if (error) throw error;
                      toast.success("Password reset email sent! Check your inbox.");
                    } catch (err: any) {
                      toast.error(err.message || "Failed to send reset email.");
                    }
                  }}
                >
                  Forgot password?
                </button>
              )}
            </div>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-muted border-border" required minLength={isSignUp ? 8 : 6} />
            {isSignUp && <p className="text-[11px] text-muted-foreground">At least 8 characters.</p>}
          </div>
          <Button type="submit" variant="glow" className="w-full h-11 font-semibold" disabled={loading}>
            {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 font-semibold gap-2"
            disabled={googleLoading}
            onClick={handleGoogleSignIn}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-primary hover:underline">
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </form>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={(open) => {
        setShowSuccess(open);
        if (!open) navigate(redirectTo);
      }}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader className="items-center">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="font-heading text-xl">Account Created! 🎉</DialogTitle>
            <DialogDescription className="text-sm">
              Welcome to EdgeMentor! Your account has been created successfully. Start exploring mentors and level up your trading.
            </DialogDescription>
          </DialogHeader>
          <Button className="w-full font-semibold" onClick={() => { setShowSuccess(false); navigate(redirectTo); }}>
            Get Started
          </Button>
        </DialogContent>
      </Dialog>

      {/* Two-factor challenge */}
      <Dialog open={mfaStep} onOpenChange={(open) => { if (!open) void cancelMfa(); }}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader className="items-center">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="font-heading text-xl">Two-Factor Verification</DialogTitle>
            <DialogDescription className="text-sm">
              Enter the 6-digit code from your authenticator app to finish signing in.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-2">
            <InputOTP
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              value={mfaCode}
              onChange={setMfaCode}
              onComplete={verifyMfa}
              disabled={mfaVerifying}
              autoFocus
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button className="w-full font-semibold" onClick={verifyMfa} disabled={mfaVerifying || mfaCode.length !== 6}>
            {mfaVerifying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
            Verify
          </Button>
          <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={cancelMfa}>
            Cancel and sign out
          </button>
        </DialogContent>
      </Dialog>
    </div>
    </PageTransition>
  );
};

export default Auth;
