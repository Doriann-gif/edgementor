import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

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

const CTASection = () => (
  <section className="py-32 sm:py-44 px-4 sm:px-6 relative">
    <motion.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-r from-primary/[0.06] via-pink-400/[0.06] to-primary/[0.06] rounded-full blur-[140px] pointer-events-none"
      animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    />

    <motion.div className="max-w-3xl mx-auto text-center relative" initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerContainer}>
      <motion.div variants={scaleIn}>
        <motion.div
          className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-pink-400/20 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/10"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <TrendingUp className="h-8 w-8 text-primary" />
        </motion.div>
      </motion.div>

      <motion.h2 variants={fadeUp} className="font-heading text-3xl sm:text-5xl font-bold text-foreground tracking-tight mb-6">
        Ready to{" "}
        <span className="bg-gradient-to-r from-primary via-pink-400 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_4s_ease_infinite]">
          level up
        </span>{" "}
        your trading?
      </motion.h2>
      <motion.p variants={fadeUp} className="text-muted-foreground mb-12 max-w-lg mx-auto text-base leading-relaxed">
        Join hundreds of traders already learning from the best. Find your mentor today.
      </motion.p>
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link to="/mentors">
          <motion.div whileHover={{ scale: 1.06, y: -3 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
            <Button variant="glow" size="lg" className="h-14 px-10 font-semibold text-base shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/35">
              Find a Mentor <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </motion.div>
        </Link>
        <Link to="/apply">
          <motion.div whileHover={{ scale: 1.06, y: -3 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
            <Button variant="outline" size="lg" className="h-14 px-10 font-semibold text-base border-border/60 hover:border-pink-400/30 transition-colors">
              Apply as Mentor
            </Button>
          </motion.div>
        </Link>
      </motion.div>
    </motion.div>
  </section>
);

export default CTASection;
