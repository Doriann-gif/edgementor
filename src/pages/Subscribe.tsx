import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMentor } from "@/hooks/use-mentors";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft, Star, CheckCircle2, Shield, Zap, Tag,
} from "lucide-react";
import PageTransition from "@/components/PageTransition";

const Subscribe = () => {
  const { id } = useParams<{ id: string }>();
  const { data: mentor, isLoading } = useMentor(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [applyingCode, setApplyingCode] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;
    setApplyingCode(true);
    try {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("code", promoCode.trim().toUpperCase())
        .eq("active", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error("Invalid or expired promo code.");
        return;
      }
      if (data.max_uses && data.current_uses >= data.max_uses) {
        toast.error("This code has reached its maximum uses.");
        return;
      }
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast.error("This code has expired.");
        return;
      }
      setDiscount(data.discount_percent);
      setAppliedCode(data.code);
      toast.success(`${data.discount_percent}% discount applied!`);
    } catch {
      toast.error("Failed to apply code.");
    } finally {
      setApplyingCode(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Please sign in first.");
      navigate("/auth");
      return;
    }
    if (!mentor || !id) return;
    setSubscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          mentorId: id,
          promoCode: appliedCode || undefined,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout.");
      setSubscribing(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm">Loading...</p></div>;
  }

  if (!mentor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Mentor not found.</p>
          <Link to="/mentors"><Button variant="outline" size="sm">Back to listing</Button></Link>
        </div>
      </div>
    );
  }

  const isOneTime = (mentor as any).payment_type === "one_time";
  const originalPrice = mentor.monthly_price;
  const finalPrice = discount > 0 ? Math.round(originalPrice * (1 - discount / 100)) : originalPrice;

  return (
    <PageTransition>
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(hsl(160 84% 39% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(160 84% 39% / 0.3) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="relative max-w-lg mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link to={`/mentor/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to profile
        </Link>

        <div className="text-center mb-8">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {isOneTime ? "Purchase from" : "Subscribe to"} {mentor.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {isOneTime ? "Get lifetime access to mentorship resources." : "Get full access to mentorship, resources, and community."}
          </p>
        </div>

        {/* Mentor Summary */}
        <div className="rounded-2xl border border-border bg-card p-5 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-heading font-bold text-lg">
              {mentor.avatar}
            </div>
            <div className="flex-1">
              <h2 className="font-heading font-semibold text-foreground">{mentor.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 text-xs text-amber-400"><Star className="h-3 w-3 fill-current" /> {mentor.rating}</span>
                <span className="text-xs text-muted-foreground">{mentor.students} students</span>
                <span className="text-xs text-muted-foreground">{mentor.session} session</span>
              </div>
            </div>
          </div>
        </div>

        {/* What's included */}
        <div className="rounded-2xl border border-border bg-card p-5 mb-4">
          <h3 className="font-heading font-semibold text-foreground text-sm mb-3">What's included</h3>
          <div className="space-y-2">
            {mentor.highlights.map((h) => (
              <div key={h} className="flex items-center gap-2.5 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-foreground">{h}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Promo Code */}
        <div className="rounded-2xl border border-border bg-card p-5 mb-4">
          <h3 className="font-heading font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" /> Promo Code
          </h3>
          {appliedCode ? (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-foreground font-medium">{appliedCode}</span>
              <span className="text-primary font-semibold">−{discount}%</span>
              <button onClick={() => { setAppliedCode(null); setDiscount(0); setPromoCode(""); }} className="ml-auto text-xs text-muted-foreground hover:text-foreground">Remove</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Enter code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="bg-muted border-border uppercase text-sm"
              />
              <Button variant="outline" size="sm" onClick={applyPromoCode} disabled={applyingCode || !promoCode.trim()} className="text-xs shrink-0">
                {applyingCode ? "..." : "Apply"}
              </Button>
            </div>
          )}
        </div>

        {/* Pricing Summary */}
        <div className="rounded-2xl border border-primary/30 bg-card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">{isOneTime ? "One-time mentorship" : "Monthly mentorship"}</span>
            <span className={`text-sm ${discount > 0 ? "line-through text-muted-foreground" : "text-foreground font-semibold"}`}>${originalPrice}{isOneTime ? "" : "/mo"}</span>
          </div>
          {discount > 0 && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-primary font-medium">Discount ({discount}%)</span>
              <span className="text-sm text-primary font-semibold">−${originalPrice - finalPrice}{isOneTime ? "" : "/mo"}</span>
            </div>
          )}
          <div className="border-t border-border pt-3 flex items-center justify-between">
            <span className="font-heading font-semibold text-foreground">Total</span>
            <span className="font-heading text-2xl font-bold text-foreground">${finalPrice}{!isOneTime && <span className="text-sm text-muted-foreground font-normal">/mo</span>}</span>
          </div>
        </div>

        {/* Subscribe Button */}
        <Button variant="glow" className="w-full h-12 font-semibold text-sm" onClick={handleSubscribe} disabled={subscribing}>
          {subscribing ? "Processing..." : `Subscribe for $${finalPrice}/mo`}
        </Button>

        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Cancel anytime</span>
          <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Instant access</span>
        </div>
      </div>
    </div>
    </PageTransition>
  );
};

export default Subscribe;
