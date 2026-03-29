import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import confetti from "canvas-confetti";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const mentorId = searchParams.get("mentor_id");
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activating, setActivating] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const activateSubscription = async () => {
      if (!user || !mentorId) return;
      try {
        const { data: existing } = await supabase
          .from("subscriptions").select("id")
          .eq("user_id", user.id).eq("mentor_id", mentorId).eq("status", "active").maybeSingle();
        if (!existing) {
          const { error } = await supabase.from("subscriptions").insert({ user_id: user.id, mentor_id: mentorId });
          if (error) throw error;
        }
        setDone(true);
        toast.success("Subscription activated! 🎉");
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.5 } });
      } catch (err: any) {
        toast.error(err.message || "Failed to activate subscription");
      } finally {
        setActivating(false);
      }
    };
    activateSubscription();
  }, [user, mentorId]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          {activating ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground">Activating your subscription...</p>
            </motion.div>
          ) : done ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} className="space-y-6">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Payment Successful!</h1>
              <p className="text-muted-foreground text-sm">Your mentorship subscription is now active. Access your exclusive content below.</p>
              <div className="flex flex-col gap-3">
                <Button onClick={() => navigate(`/mentorship/${mentorId}`)} className="w-full">
                  Go to Mentorship <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Link to="/dashboard">
                  <Button variant="outline" className="w-full">Back to Dashboard</Button>
                </Link>
              </div>
            </motion.div>
          ) : (
            <p className="text-destructive">Something went wrong. Please contact support.</p>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default PaymentSuccess;
