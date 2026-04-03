import { Shield, BarChart3, Users, Zap } from "lucide-react";
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

const WhyUsSection = () => (
  <section className="py-28 sm:py-36 px-4 sm:px-6 bg-card/10 relative overflow-hidden">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-r from-primary/[0.04] via-pink-500/[0.04] to-primary/[0.04] rounded-full blur-[120px] pointer-events-none" />

    <div className="max-w-5xl mx-auto relative">
      <motion.div className="text-center mb-16" initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerContainer}>
        <motion.span variants={scaleIn} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary mb-4 rounded-full bg-primary/5 border border-primary/20 px-3 py-1">
          <Zap className="h-3 w-3" /> Why choose us
        </motion.span>
        <motion.h2 variants={fadeUp} className="font-heading text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
          Why <span className="bg-gradient-to-r from-primary to-pink-400 bg-clip-text text-transparent">EdgeMentor</span>?
        </motion.h2>
        <motion.p variants={fadeUp} className="text-muted-foreground mt-3 max-w-lg mx-auto text-sm">
          We've built the platform we wished existed when we started trading.
        </motion.p>
      </motion.div>

      <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-8" initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer}>
        {[
          { icon: Shield, title: "Verified Only", desc: "Every mentor provides proof of profitability. No fake gurus, no unproven strategies.", gradient: "from-primary/15 to-primary/5", hoverGlow: "group-hover:shadow-primary/10" },
          { icon: BarChart3, title: "Real Strategies", desc: "Learn proven methodologies — ICT, order flow, price action — from traders who use them daily.", gradient: "from-pink-400/15 to-pink-400/5", hoverGlow: "group-hover:shadow-pink-400/10" },
          { icon: Users, title: "Active Community", desc: "Join thousands of traders sharing setups, analysis, and support every single day.", gradient: "from-primary/15 to-pink-400/10", hoverGlow: "group-hover:shadow-primary/10" },
        ].map((item, i) => (
          <motion.div key={item.title} variants={fadeUp} custom={i}>
            <motion.div
              className={`group relative rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-10 transition-all duration-300 hover:border-pink-400/20 overflow-hidden ${item.hoverGlow}`}
              whileHover={{ y: -8, boxShadow: "0 20px 50px -12px hsl(var(--primary) / 0.12)" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-pink-400/[0.06] rounded-full blur-xl pointer-events-none group-hover:bg-pink-400/[0.12] transition-colors duration-500" />
              <motion.div
                className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-6`}
                whileHover={{ scale: 1.2, rotate: -10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <item.icon className="h-6 w-6 text-primary" />
              </motion.div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default WhyUsSection;
