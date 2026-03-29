import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  TrendingUp, Star, Users, ArrowRight, Zap,
  Shield, BarChart3, ChevronRight, UserPlus,
  Sparkles, Play, Target, Award, Globe,
} from "lucide-react";
import { useFeaturedMentors, useMentors } from "@/hooks/use-mentors";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

const floatingOrb = {
  animate: { y: [0, -20, 0], scale: [1, 1.05, 1] },
  transition: { duration: 8, repeat: Infinity, ease: "easeInOut" as const },
};

const floatingOrbSlow = {
  animate: { y: [0, 15, 0], x: [0, -10, 0], scale: [1, 1.08, 1] },
  transition: { duration: 12, repeat: Infinity, ease: "easeInOut" as const },
};

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

const slideInLeft = {
  hidden: { opacity: 0, x: -40 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const Homepage = () => {
  const { data: featuredMentors = [] } = useFeaturedMentors();
  const { data: allMentors = [] } = useMentors();
  const { user, loading } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);



  useEffect(() => {
    if (loading) return;
    if (!user && !sessionStorage.getItem("welcomed")) {
      const timer = setTimeout(() => {
        setShowWelcome(true);
        sessionStorage.setItem("welcomed", "1");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Welcome Dialog */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="sm:max-w-sm text-center border-pink-500/20">
          <DialogHeader className="items-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-pink-400/20 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/10"
            >
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
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setShowWelcome(false)}>
              Browse first
            </Button>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Animated ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-[-200px] left-1/4 w-[700px] h-[700px] bg-primary/[0.04] rounded-full blur-[150px]"
          {...floatingOrb}
        />
        <motion.div
          className="absolute top-[30%] right-[-100px] w-[500px] h-[500px] bg-pink-400/[0.04] rounded-full blur-[130px]"
          {...floatingOrbSlow}
        />
        <motion.div
          className="absolute bottom-[-150px] left-[-100px] w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-[120px]"
          animate={{ y: [0, 20, 0], scale: [1, 1.03, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" as const }}
        />
        <motion.div
          className="absolute bottom-[20%] right-1/3 w-[400px] h-[400px] bg-pink-400/[0.035] rounded-full blur-[100px]"
          animate={{ y: [0, -15, 0], x: [0, 12, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" as const }}
        />
        {/* Extra pink corner glows */}
        <motion.div
          className="absolute top-[10%] right-[5%] w-[250px] h-[250px] bg-pink-500/[0.06] rounded-full blur-[80px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[10%] left-[5%] w-[200px] h-[200px] bg-pink-400/[0.05] rounded-full blur-[70px]"
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative">
        {/* Hero */}
        <motion.section className="py-24 sm:py-32 px-4 sm:px-6 relative" style={{ opacity: heroOpacity, scale: heroScale }}>
          {/* Central glow */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-r from-primary/[0.08] via-pink-400/[0.06] to-primary/[0.08] rounded-full blur-[120px] pointer-events-none"
            animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div
            className="max-w-4xl mx-auto text-center relative"
            initial="hidden"
            animate="show"
            variants={staggerContainer}
          >
            {/* Animated badge */}
            <motion.div variants={scaleIn}>
              <motion.div
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-xs font-medium text-primary mb-8 backdrop-blur-sm shadow-lg shadow-primary/5"
                animate={{ boxShadow: ["0 0 0 0 hsl(var(--primary) / 0)", "0 0 20px 4px hsl(var(--primary) / 0.1)", "0 0 0 0 hsl(var(--primary) / 0)"] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>The #1 Trading Mentorship Platform</span>
                <motion.span
                  className="h-2 w-2 rounded-full bg-primary"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
            </motion.div>

            {/* Main heading with letter animation */}
            <motion.h1
              variants={fadeUp}
              className="font-heading text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground tracking-tight leading-[1.05] mb-6"
            >
              <motion.span
                className="block"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                Learn from traders
              </motion.span>
              <motion.span
                className="block mt-1"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
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

            <motion.p
              variants={fadeUp}
              className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Connect with verified mentors, join active trading communities, and accelerate your edge with real strategies — not theory.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/mentors">
                <motion.div
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button size="lg" className="h-14 px-10 font-semibold text-base shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/35 transition-all">
                    Browse Mentors <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </motion.div>
              </Link>
              <Link to="/learn">
                <motion.div
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button variant="outline" size="lg" className="h-14 px-10 font-semibold text-base border-border/60 hover:border-pink-400/30 transition-colors">
                    <Play className="h-5 w-5 mr-2" /> Watch Free Content
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              className="flex flex-wrap items-center justify-center gap-6 mt-12 pt-8 border-t border-border/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              {[
                { icon: Shield, text: "100% Verified Mentors" },
                { icon: Target, text: "Proven Strategies" },
                { icon: Globe, text: "40+ Countries" },
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

        {/* Animated Stats Counter */}
        <section className="border-y border-border/50 bg-card/30 backdrop-blur-sm py-10 px-4 sm:px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-500/[0.03] to-transparent pointer-events-none" />
          <motion.div
            className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 relative"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {[
              { label: "Active Traders", value: allMentors.reduce((sum, m) => sum + m.students, 0), suffix: "+", icon: Users },
              { label: "Verified Mentors", value: allMentors.length, suffix: "", icon: Award },
              { label: "Avg. Rating", value: allMentors.length ? +(allMentors.reduce((sum, m) => sum + Number(m.rating), 0) / allMentors.length).toFixed(1) : 0, suffix: "", icon: Star },
              { label: "Countries", value: 40, suffix: "+", icon: Globe },
            ].map((stat) => (
              <motion.div key={stat.label} className="text-center group" variants={fadeUp}>
                <motion.div
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-3 group-hover:bg-primary/15 transition-colors"
                  whileHover={{ scale: 1.15, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <stat.icon className="h-5 w-5 text-primary" />
                </motion.div>
                <motion.div
                  className="font-heading text-3xl sm:text-4xl font-bold text-foreground"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                >
                  {stat.value}{stat.suffix}
                </motion.div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Featured Mentors — Enhanced */}
        <section className="py-20 sm:py-24 px-4 sm:px-6 relative">
          <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-pink-500/[0.03] rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-primary/[0.03] rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-6xl mx-auto relative">
            <motion.div
              className="flex items-end justify-between mb-10"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={slideInLeft}
            >
              <div>
                <motion.span
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary mb-3 rounded-full bg-primary/5 border border-primary/20 px-3 py-1"
                  animate={{ boxShadow: ["0 0 0 0 hsl(var(--primary) / 0)", "0 0 12px 2px hsl(var(--primary) / 0.08)", "0 0 0 0 hsl(var(--primary) / 0)"] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Star className="h-3 w-3 fill-current" /> Hand-picked
                </motion.span>
                <h2 className="font-heading text-2xl sm:text-4xl font-bold text-foreground tracking-tight">
                  Featured <span className="bg-gradient-to-r from-primary to-pink-400 bg-clip-text text-transparent">Mentors</span>
                </h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">Top-rated traders with proven track records and active communities.</p>
              </div>
              <Link to="/mentors" className="hidden sm:flex items-center gap-1 text-sm text-primary hover:underline font-medium">
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </motion.div>

            {featuredMentors.length === 0 ? (
              <motion.div
                className="text-center py-16 rounded-2xl border border-dashed border-border bg-card/30"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No mentors available yet. Check back soon!</p>
              </motion.div>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-5"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                variants={staggerContainer}
              >
                {featuredMentors.map((mentor, idx) => (
                  <motion.div key={mentor.id} variants={fadeUp} custom={idx}>
                    <Link to={`/mentor/${mentor.id}`}>
                      <motion.div
                        className="group relative rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 transition-all duration-300 hover:border-pink-400/30 overflow-hidden"
                        whileHover={{ y: -8, boxShadow: "0 25px 60px -12px hsl(var(--primary) / 0.15), 0 0 40px -8px rgba(236,72,153,0.08)" }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        {/* Corner pink accent */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-pink-400/[0.08] to-transparent rounded-bl-full pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-primary/[0.05] to-transparent rounded-tr-full pointer-events-none" />

                        {/* Rank badge */}
                        {idx < 3 && (
                          <motion.div
                            className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary"
                            initial={{ opacity: 0, scale: 0 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 + idx * 0.1, type: "spring" }}
                          >
                            #{idx + 1}
                          </motion.div>
                        )}

                        <div className="flex items-start gap-4 mb-5">
                          <motion.div
                            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 via-pink-400/10 to-primary/5 text-primary font-heading font-bold text-base shadow-inner"
                            whileHover={{ scale: 1.12, rotate: 8 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            {mentor.avatar}
                          </motion.div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-heading font-semibold text-foreground text-lg group-hover:text-primary transition-colors">{mentor.name}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                                <Star className="h-3 w-3 fill-current" /> {mentor.rating}
                              </span>
                              <span className="text-xs text-muted-foreground">{mentor.students} students</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-2">{mentor.bio}</p>

                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {mentor.instruments.map((inst) => (
                            <motion.span
                              key={inst}
                              className="rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
                              whileHover={{ scale: 1.08 }}
                            >
                              {inst}
                            </motion.span>
                          ))}
                          {mentor.concepts.slice(0, 2).map((c) => (
                            <motion.span
                              key={c}
                              className="rounded-lg bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground"
                              whileHover={{ scale: 1.08 }}
                            >
                              {c}
                            </motion.span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                          <div>
                            <span className="font-heading text-xl font-bold text-foreground">${mentor.monthly_price}</span>
                            <span className="text-xs text-muted-foreground">/mo</span>
                          </div>
                          <motion.span
                            className="flex items-center gap-1 text-sm text-primary font-medium"
                            whileHover={{ x: 4 }}
                          >
                            View Profile
                            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </motion.span>
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}

            <div className="sm:hidden mt-6 text-center">
              <Link to="/mentors" className="text-sm text-primary hover:underline font-medium">View all mentors →</Link>
            </div>
          </div>
        </section>

        {/* Why Us — Interactive cards */}
        <section className="py-20 sm:py-24 px-4 sm:px-6 bg-card/20 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-r from-primary/[0.04] via-pink-500/[0.04] to-primary/[0.04] rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-5xl mx-auto relative">
            <motion.div
              className="text-center mb-14"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.span
                variants={scaleIn}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary mb-4 rounded-full bg-primary/5 border border-primary/20 px-3 py-1"
              >
                <Zap className="h-3 w-3" /> Why choose us
              </motion.span>
              <motion.h2 variants={fadeUp} className="font-heading text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                Why <span className="bg-gradient-to-r from-primary to-pink-400 bg-clip-text text-transparent">EdgeMentor</span>?
              </motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground mt-3 max-w-lg mx-auto text-sm">
                We've built the platform we wished existed when we started trading.
              </motion.p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-3 gap-6"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {[
                {
                  icon: Shield,
                  title: "Verified Only",
                  desc: "Every mentor provides proof of profitability. No fake gurus, no unproven strategies.",
                  gradient: "from-primary/15 to-primary/5",
                  hoverGlow: "group-hover:shadow-primary/10",
                },
                {
                  icon: BarChart3,
                  title: "Real Strategies",
                  desc: "Learn proven methodologies — ICT, order flow, price action — from traders who use them daily.",
                  gradient: "from-pink-400/15 to-pink-400/5",
                  hoverGlow: "group-hover:shadow-pink-400/10",
                },
                {
                  icon: Users,
                  title: "Active Community",
                  desc: "Join thousands of traders sharing setups, analysis, and support every single day.",
                  gradient: "from-primary/15 to-pink-400/10",
                  hoverGlow: "group-hover:shadow-primary/10",
                },
              ].map((item, i) => (
                <motion.div key={item.title} variants={fadeUp} custom={i}>
                  <motion.div
                    className={`group relative rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-8 transition-all duration-300 hover:border-pink-400/20 overflow-hidden cursor-default ${item.hoverGlow}`}
                    whileHover={{ y: -8, boxShadow: "0 20px 50px -12px hsl(var(--primary) / 0.12)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {/* Pink corner accent */}
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-pink-400/[0.06] rounded-full blur-xl pointer-events-none group-hover:bg-pink-400/[0.12] transition-colors duration-500" />

                    <motion.div
                      className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-5`}
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

        {/* CTA — Dramatic */}
        <section className="py-24 sm:py-32 px-4 sm:px-6 relative">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-r from-primary/[0.06] via-pink-400/[0.06] to-primary/[0.06] rounded-full blur-[140px] pointer-events-none"
            animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div
            className="max-w-3xl mx-auto text-center relative"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={scaleIn}>
              <motion.div
                className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-pink-400/20 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/10"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <TrendingUp className="h-8 w-8 text-primary" />
              </motion.div>
            </motion.div>

            <motion.h2 variants={fadeUp} className="font-heading text-3xl sm:text-5xl font-bold text-foreground tracking-tight mb-5">
              Ready to{" "}
              <span className="bg-gradient-to-r from-primary via-pink-400 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_4s_ease_infinite]">
                level up
              </span>{" "}
              your trading?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground mb-10 max-w-lg mx-auto text-base">
              Join hundreds of traders already learning from the best. Find your mentor today.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/mentors">
                <motion.div whileHover={{ scale: 1.06, y: -3 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                  <Button size="lg" className="h-14 px-10 font-semibold text-base shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/35 transition-all">
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

        {/* Footer */}
        <footer className="border-t border-border/50 py-10 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <motion.div
              className="font-heading font-bold text-sm text-foreground flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <Zap className="h-4 w-4 text-primary" /> EdgeMentor
            </motion.div>
            <div className="flex items-center gap-6">
              <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
              <Link to="/learn" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Learn</Link>
              <Link to="/mentors" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Mentors</Link>
            </div>
            <p className="text-xs text-muted-foreground">© 2026 EdgeMentor. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Homepage;
