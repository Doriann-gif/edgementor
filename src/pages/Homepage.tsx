import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  TrendingUp, Star, Users, Play, ArrowRight, Zap,
  Shield, BarChart3, ChevronRight, UserPlus,
} from "lucide-react";
import { useFeaturedMentors, useMentors } from "@/hooks/use-mentors";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

const VIDEOS = [
  { title: "How I Read Order Flow in Real Time", mentor: "Marcus Chen", duration: "24:15", views: "12.4K", thumbnail: "OF" },
  { title: "ICT Liquidity Sweeps Explained", mentor: "Sarah Williams", duration: "18:32", views: "8.7K", thumbnail: "ICT" },
  { title: "Supply & Demand Zones That Actually Work", mentor: "David Okonkwo", duration: "31:08", views: "15.2K", thumbnail: "SD" },
  { title: "Institutional Order Flow: What Retail Misses", mentor: "Elena Petrova", duration: "42:20", views: "22.1K", thumbnail: "IO" },
];

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
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  return (
    <div className="min-h-screen bg-background">
      {/* Welcome Dialog for new visitors */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader className="items-center">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <UserPlus className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="font-heading text-xl">Welcome to EdgeMentor! 👋</DialogTitle>
            <DialogDescription className="text-sm">
              Join our community of traders. Create an account to save mentors, subscribe to mentorships, and access exclusive content.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Link to="/auth" className="w-full">
              <Button className="w-full font-semibold" onClick={() => setShowWelcome(false)}>
                <UserPlus className="h-4 w-4 mr-2" /> Create Account
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setShowWelcome(false)}>
              Browse first
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ambient background with glow orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-200px] left-1/4 w-[700px] h-[700px] bg-primary/[0.04] rounded-full blur-[150px]" />
        <div className="absolute top-[30%] right-[-100px] w-[500px] h-[500px] bg-pink-500/[0.03] rounded-full blur-[130px]" />
        <div className="absolute bottom-[-150px] left-[-100px] w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-1/3 w-[400px] h-[400px] bg-pink-400/[0.025] rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(160 84% 39% / 0.4) 1px, transparent 0)',
          backgroundSize: '48px 48px'
        }} />
      </div>

      <div className="relative">

        {/* Hero */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 relative">
          {/* Hero glow accent */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-r from-primary/[0.06] via-pink-500/[0.04] to-primary/[0.06] rounded-full blur-[100px] pointer-events-none" />

          <motion.div
            className="max-w-4xl mx-auto text-center relative"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6 backdrop-blur-sm"
            >
              <TrendingUp className="h-3.5 w-3.5" /> The #1 Trading Mentorship Platform
            </motion.div>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-[1.1] mb-5">
              Learn from traders who{" "}
              <span className="bg-gradient-to-r from-primary via-pink-400 to-primary bg-clip-text text-transparent">
                actually trade
              </span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              Connect with verified mentors, join active trading communities, and accelerate your edge with real strategies — not theory.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link to="/mentors">
                <Button size="lg" className="h-12 px-8 font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
                  Browse Mentors <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="h-12 px-8 font-semibold text-sm border-border/60 hover:border-pink-400/30 hover:shadow-lg hover:shadow-pink-400/5 transition-all">
                Watch Free Content
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Stats */}
        <section className="border-y border-border/50 bg-card/30 backdrop-blur-sm py-8 px-4 sm:px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-500/[0.02] to-transparent pointer-events-none" />
          <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 relative">
            {[
              { label: "Active Traders", value: `${allMentors.reduce((sum, m) => sum + m.students, 0)}+` },
              { label: "Verified Mentors", value: String(allMentors.length) },
              { label: "Avg. Rating", value: allMentors.length ? (allMentors.reduce((sum, m) => sum + Number(m.rating), 0) / allMentors.length).toFixed(1) : "—" },
              { label: "Countries", value: "40+" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
              >
                <div className="font-heading text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Featured Mentors */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 relative">
          {/* Subtle pink glow behind mentors */}
          <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-pink-500/[0.025] rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-6xl mx-auto relative">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Featured Mentors</h2>
                <p className="text-sm text-muted-foreground mt-1.5">Top-rated traders with proven track records.</p>
              </div>
              <Link to="/mentors" className="hidden sm:flex items-center gap-1 text-sm text-primary hover:underline">View all <ChevronRight className="h-4 w-4" /></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredMentors.map((mentor, i) => (
                <motion.div
                  key={mentor.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.45 }}
                >
                  <Link to={`/mentor/${mentor.id}`} className="group block rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_16px_48px_-12px_hsl(160_84%_39%/0.12)]">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-pink-400/10 text-primary font-heading font-bold text-sm">{mentor.avatar}</div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-heading font-semibold text-foreground">{mentor.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-amber-400"><Star className="h-3 w-3 fill-current" /> {mentor.rating}</span>
                          <span className="text-xs text-muted-foreground">{mentor.students} students</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">{mentor.bio}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {mentor.instruments.map((inst) => <span key={inst} className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{inst}</span>)}
                      {mentor.concepts.slice(0, 2).map((c) => <span key={c} className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">{c}</span>)}
                    </div>
                    <div className="flex items-center justify-between">
                      <div><span className="font-heading font-bold text-foreground">${mentor.monthly_price}</span><span className="text-xs text-muted-foreground">/mo</span></div>
                      <span className="text-xs text-primary font-medium group-hover:underline">View Profile →</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            <div className="sm:hidden mt-4 text-center"><Link to="/mentors" className="text-sm text-primary hover:underline">View all mentors →</Link></div>
          </div>
        </section>

        {/* Videos */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 relative">
          <div className="absolute bottom-0 left-1/3 w-[500px] h-[400px] bg-pink-500/[0.02] rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-6xl mx-auto relative">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-400/20 bg-pink-400/5 px-3 py-1 text-xs font-medium text-pink-400 mb-3"><Play className="h-3.5 w-3.5" /> Free Content</div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Trading Videos</h2>
              <p className="text-sm text-muted-foreground mt-1.5">Free educational content from our verified mentors.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {VIDEOS.map((video, i) => (
                <motion.div
                  key={video.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="group rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-pink-400/20 hover:shadow-[0_16px_48px_-12px_rgba(236,72,153,0.08)] cursor-pointer"
                >
                  <div className="aspect-video bg-gradient-to-br from-secondary to-secondary/60 flex items-center justify-center relative">
                    <span className="font-heading font-bold text-2xl text-muted-foreground/20">{video.thumbnail}</span>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-pink-400 flex items-center justify-center shadow-lg shadow-primary/30"><Play className="h-5 w-5 text-primary-foreground fill-current ml-0.5" /></div>
                    </div>
                    <span className="absolute bottom-2 right-2 bg-background/80 text-foreground text-[10px] font-medium px-1.5 py-0.5 rounded backdrop-blur-sm">{video.duration}</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading font-semibold text-sm text-foreground leading-snug line-clamp-2 mb-2">{video.title}</h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{video.mentor}</span><span>{video.views} views</span></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Us */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-card/20 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-primary/[0.03] via-pink-500/[0.03] to-primary/[0.03] rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-4xl mx-auto text-center relative">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-10">Why EdgeMentor?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: Shield, title: "Verified Only", desc: "Every mentor provides proof of profitability. No fake gurus, no unproven strategies.", accent: "from-primary/15 to-primary/5" },
                { icon: BarChart3, title: "Real Strategies", desc: "Learn proven methodologies — ICT, order flow, price action — from traders who use them daily.", accent: "from-pink-400/15 to-pink-400/5" },
                { icon: Users, title: "Active Community", desc: "Join thousands of traders sharing setups, analysis, and support every single day.", accent: "from-primary/15 to-pink-400/10" },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.45 }}
                  className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 transition-all duration-300 hover:shadow-lg hover:border-border/80"
                >
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${item.accent} flex items-center justify-center mx-auto mb-4`}>
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 sm:py-24 px-4 sm:px-6 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-r from-primary/[0.05] via-pink-400/[0.04] to-primary/[0.05] rounded-full blur-[120px] pointer-events-none" />

          <motion.div
            className="max-w-3xl mx-auto text-center relative"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4">
              Ready to level up your trading?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">Join hundreds of traders already learning from the best. Find your mentor today.</p>
            <div className="flex items-center justify-center gap-3">
              <Link to="/mentors">
                <Button size="lg" className="h-12 px-8 font-semibold text-sm shadow-lg shadow-primary/20">
                  Find a Mentor <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link to="/apply">
                <Button variant="outline" size="lg" className="h-12 px-8 font-semibold text-sm border-border/60 hover:border-pink-400/30 transition-colors">
                  Apply as Mentor
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 py-8 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="font-heading font-bold text-sm text-foreground flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> EdgeMentor</div>
            <p className="text-xs text-muted-foreground">© 2026 EdgeMentor. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Homepage;
