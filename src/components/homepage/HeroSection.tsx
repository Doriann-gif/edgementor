import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield, Target, Globe, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const HeroSection = () => {
  const reduced = useReducedMotion();
  return (
  <motion.section className="py-32 sm:py-44 px-4 sm:px-6 relative">
    <motion.div
      className="max-w-4xl mx-auto text-center relative"
      initial="hidden"
      animate="show"
      variants={staggerContainer}
    >
      <motion.div variants={scaleIn}>
        <motion.div
          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-5 py-2 text-xs font-medium text-primary mb-8 shadow-lg shadow-primary/5"
          animate={reduced ? undefined : { boxShadow: ["0 0 0 0 hsl(var(--primary) / 0)", "0 0 15px 3px hsl(var(--primary) / 0.08)", "0 0 0 0 hsl(var(--primary) / 0)"] }}
          transition={reduced ? undefined : { duration: 4, repeat: Infinity, repeatDelay: 1 }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Verified traders · Reviewed track records</span>
          <motion.span
            className="h-2 w-2 rounded-full bg-primary"
            animate={reduced ? undefined : { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={reduced ? undefined : { duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>

      <motion.h1
        variants={fadeUp}
        className="font-heading text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground tracking-tight leading-[1.08] mb-8"
      >
        <motion.span className="block" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
          Learn from traders
        </motion.span>
        <motion.span className="block mt-1" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}>
          who{" "}
          <span className="relative">
            <span className="bg-gradient-to-r from-primary via-pink-400 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_4s_ease_infinite]">
              actually trade
            </span>
            <motion.span
              className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-pink-400/60 to-primary/60 rounded-full"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
            />
          </span>
        </motion.span>
      </motion.h1>

      <motion.p variants={fadeUp} className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-14 leading-relaxed">
        Get mentorship from verified futures, forex, crypto &amp; options traders — each with a reviewed track record. Real strategies, not theory, whether you're just starting out or scaling up.
      </motion.p>

      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link to="/mentors">
          <motion.div whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
            <Button variant="glow" size="lg" className="h-14 px-10 font-semibold text-base shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/35">
              Browse Mentors <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </motion.div>
        </Link>
        <Link to="/learn">
          <motion.div whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
            <Button variant="outline" size="lg" className="h-14 px-10 font-semibold text-base border-border/60 hover:border-pink-400/30 transition-colors">
              <Play className="h-5 w-5 mr-2" /> Watch Free Content
            </Button>
          </motion.div>
        </Link>
      </motion.div>

      <motion.div
        className="flex flex-wrap items-center justify-center gap-8 mt-16 pt-10 border-t border-border/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        {[
          { icon: Shield, text: "Identity-Verified Mentors" },
          { icon: Target, text: "Track Records Reviewed" },
          { icon: Globe, text: "Cancel Anytime" },
        ].map((item, i) => (
          <motion.div
            key={item.text}
            className="flex items-center gap-2 text-xs text-muted-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 + i * 0.15 }}
          >
            <item.icon className="h-3.5 w-3.5 text-primary/70" />
            {item.text}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  </motion.section>
  );
};

export default HeroSection;
