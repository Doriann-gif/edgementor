import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { useFeaturedMentors, useMentors } from "@/hooks/use-mentors";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import HeroSection from "@/components/homepage/HeroSection";
import StatsSection from "@/components/homepage/StatsSection";
import FeaturedMentors from "@/components/homepage/FeaturedMentors";
import WhyUsSection from "@/components/homepage/WhyUsSection";
import CTASection from "@/components/homepage/CTASection";

const floatingOrb = {
  animate: { y: [0, -20, 0], scale: [1, 1.05, 1] },
  transition: { duration: 8, repeat: Infinity, ease: "easeInOut" as const },
};
const floatingOrbSlow = {
  animate: { y: [0, 15, 0], x: [0, -10, 0], scale: [1, 1.08, 1] },
  transition: { duration: 12, repeat: Infinity, ease: "easeInOut" as const },
};

const Homepage = () => {
  const { data: featuredMentors = [] } = useFeaturedMentors();
  const { data: allMentors = [] } = useMentors();
  const { user, loading } = useAuth();
  const reduced = useReducedMotion();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user && !localStorage.getItem("edgementor_welcomed")) {
      const timer = setTimeout(() => { setShowWelcome(true); localStorage.setItem("edgementor_welcomed", "1"); }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      <Helmet>
        <title>EdgeMentor — Find Your Trading Mentor</title>
        <meta name="description" content="Connect with elite trading mentors in futures, forex, crypto & options. Get personalized 1-on-1 mentorship to accelerate your trading journey." />
        <link rel="canonical" href="https://edgementor.lovable.app/" />
        <meta property="og:title" content="EdgeMentor — Find Your Trading Mentor" />
        <meta property="og:description" content="Connect with elite trading mentors in futures, forex, crypto & options. Personalized 1-on-1 mentorship." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://edgementor.lovable.app/" />
        <meta property="og:image" content="https://edgementor.lovable.app/og-image.jpg" />
        <meta property="og:site_name" content="EdgeMentor" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="EdgeMentor — Find Your Trading Mentor" />
        <meta name="twitter:description" content="Connect with elite trading mentors. Personalized 1-on-1 mentorship in futures, forex, crypto & options." />
        <meta name="twitter:image" content="https://edgementor.lovable.app/og-image.jpg" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org", "@type": "WebSite", "name": "EdgeMentor",
          "url": "https://edgementor.lovable.app",
          "description": "Connect with elite trading mentors in futures, forex, crypto & options.",
          "potentialAction": { "@type": "SearchAction", "target": "https://edgementor.lovable.app/mentors?q={search_term_string}", "query-input": "required name=search_term_string" }
        })}</script>
      </Helmet>

      {!reduced && (
        <div className="pointer-events-none absolute -top-20 -right-20 w-[500px] h-[500px] z-0" aria-hidden>
          <motion.div className="w-full h-full rounded-full blur-[100px]" style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.32), hsl(var(--pink) / 0.15), transparent 70%)" }} animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
        </div>
      )}

      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="sm:max-w-sm text-center border-pink-500/20">
          <DialogHeader className="items-center">
            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }} className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-pink-400/20 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/10">
              <UserPlus className="h-8 w-8 text-primary" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <DialogTitle className="font-heading text-xl">Welcome to EdgeMentor! 👋</DialogTitle>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <DialogDescription className="text-sm leading-relaxed">
                Join our community of traders. Create an account to save mentors, subscribe to mentorships, and access exclusive content.
              </DialogDescription>
            </motion.div>
          </DialogHeader>
          <motion.div className="flex flex-col gap-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Link to="/auth" className="w-full">
              <Button className="w-full font-semibold shadow-lg shadow-primary/20" onClick={() => setShowWelcome(false)}>
                <UserPlus className="h-4 w-4 mr-2" /> Create Account
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setShowWelcome(false)}>Browse first</Button>
          </motion.div>
        </DialogContent>
      </Dialog>

      {!reduced && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div className="absolute top-[-200px] left-1/4 w-[700px] h-[700px] bg-primary/[0.04] rounded-full blur-[150px]" {...floatingOrb} />
          <motion.div className="absolute top-[30%] right-[-100px] w-[500px] h-[500px] bg-pink-400/[0.04] rounded-full blur-[130px]" {...floatingOrbSlow} />
          <motion.div className="absolute bottom-[-150px] left-[-100px] w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-[120px]" animate={{ y: [0, 20, 0], scale: [1, 1.03, 1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" as const }} />
          <motion.div className="absolute bottom-[20%] right-1/3 w-[400px] h-[400px] bg-pink-400/[0.035] rounded-full blur-[100px]" animate={{ y: [0, -15, 0], x: [0, 12, 0] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" as const }} />
          <motion.div className="absolute top-[10%] right-[5%] w-[250px] h-[250px] bg-pink-500/[0.06] rounded-full blur-[80px]" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
          <motion.div className="absolute bottom-[10%] left-[5%] w-[200px] h-[200px] bg-pink-400/[0.05] rounded-full blur-[70px]" animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />
        </div>
      )}

      <div className="relative">
        <HeroSection />
        <StatsSection allMentors={allMentors} />
        <FeaturedMentors mentors={featuredMentors} />
        <WhyUsSection />
        <CTASection />
      </div>
    </div>
  );
};

export default Homepage;
