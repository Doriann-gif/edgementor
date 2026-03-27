import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Star,
  Clock,
  Users,
  Play,
  MessageCircle,
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
  ChevronRight,
} from "lucide-react";

const FEATURED_MENTORS = [
  {
    id: "4",
    name: "Elena Petrova",
    avatar: "EP",
    bio: "Institutional background with Goldman Sachs. Teaching retail traders how to read order flow like a professional.",
    experience: "10+ years",
    instruments: ["Futures", "Forex", "Equities"],
    concepts: ["Order Flow", "VWAP", "ICT"],
    monthlyPrice: 449,
    rating: 5.0,
    students: 210,
  },
  {
    id: "1",
    name: "Marcus Chen",
    avatar: "MC",
    bio: "Former prop trader turned educator. Specializing in futures order flow with a focus on ES and NQ scalping.",
    experience: "10+ years",
    instruments: ["Futures"],
    concepts: ["Order Flow", "VWAP"],
    monthlyPrice: 299,
    rating: 4.9,
    students: 142,
  },
  {
    id: "2",
    name: "Sarah Williams",
    avatar: "SW",
    bio: "ICT methodology expert with deep knowledge of liquidity concepts across forex pairs.",
    experience: "8-10 years",
    instruments: ["Forex", "Futures"],
    concepts: ["ICT", "Price Action"],
    monthlyPrice: 199,
    rating: 4.8,
    students: 98,
  },
];

const DISCORD_GROUPS = [
  {
    name: "Order Flow Trading",
    members: 2340,
    description: "Tape reading, delta analysis, and footprint charts. Share setups in real-time during NY session.",
    tags: ["Futures", "Order Flow"],
    active: true,
  },
  {
    name: "ICT Concepts Lab",
    members: 4120,
    description: "Study group for smart money concepts. Daily markup reviews and backtesting challenges.",
    tags: ["Forex", "ICT"],
    active: true,
  },
  {
    name: "Crypto Swing Traders",
    members: 1870,
    description: "On-chain analysis meets technical analysis. BTC & ETH focused with altcoin screening channels.",
    tags: ["Crypto", "Supply & Demand"],
    active: false,
  },
  {
    name: "Price Action Purists",
    members: 3050,
    description: "No indicators, no noise. Clean charts and high-probability setups across all markets.",
    tags: ["Equities", "Price Action"],
    active: true,
  },
];

const VIDEOS = [
  {
    title: "How I Read Order Flow in Real Time",
    mentor: "Marcus Chen",
    duration: "24:15",
    views: "12.4K",
    thumbnail: "OF",
  },
  {
    title: "ICT Liquidity Sweeps Explained",
    mentor: "Sarah Williams",
    duration: "18:32",
    views: "8.7K",
    thumbnail: "ICT",
  },
  {
    title: "Supply & Demand Zones That Actually Work",
    mentor: "David Okonkwo",
    duration: "31:08",
    views: "15.2K",
    thumbnail: "SD",
  },
  {
    title: "Institutional Order Flow: What Retail Misses",
    mentor: "Elena Petrova",
    duration: "42:20",
    views: "22.1K",
    thumbnail: "IO",
  },
];

const STATS = [
  { label: "Active Traders", value: "654+" },
  { label: "Verified Mentors", value: "6" },
  { label: "Avg. Rating", value: "4.8" },
  { label: "Countries", value: "40+" },
];

const Homepage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Grid bg */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(160 84% 39% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(160 84% 39% / 0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative">
        {/* Nav */}
        <nav className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link to="/" className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              EdgeMentor
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/mentors">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                  Mentors
                </Button>
              </Link>
              <Link to="/apply">
                <Button variant="outline" size="sm" className="text-xs">
                  Become a Mentor
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="py-20 sm:py-28 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6">
              <TrendingUp className="h-3.5 w-3.5" />
              The #1 Trading Mentorship Platform
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-[1.1] mb-5">
              Learn from traders who{" "}
              <span className="text-primary">actually trade</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              Connect with verified mentors, join active trading communities, and accelerate your edge
              with real strategies — not theory.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link to="/mentors">
                <Button size="lg" className="h-12 px-8 font-semibold text-sm">
                  Browse Mentors <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="h-12 px-8 font-semibold text-sm">
                Watch Free Content
              </Button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-border/50 bg-card/30 py-8 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-heading text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Mentors */}
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  Featured Mentors
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Top-rated traders with proven track records.
                </p>
              </div>
              <Link to="/mentors" className="hidden sm:flex items-center gap-1 text-sm text-primary hover:underline">
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {FEATURED_MENTORS.map((mentor) => (
                <Link
                  key={mentor.id}
                  to={`/mentor/${mentor.id}`}
                  className="group rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-heading font-bold text-sm">
                      {mentor.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading font-semibold text-foreground">{mentor.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-amber-400">
                          <Star className="h-3 w-3 fill-current" /> {mentor.rating}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {mentor.students} students
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                    {mentor.bio}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {mentor.instruments.map((i) => (
                      <span key={i} className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        {i}
                      </span>
                    ))}
                    {mentor.concepts.slice(0, 2).map((c) => (
                      <span key={c} className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                        {c}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-heading font-bold text-foreground">${mentor.monthlyPrice}</span>
                      <span className="text-xs text-muted-foreground">/mo</span>
                    </div>
                    <span className="text-xs text-primary font-medium group-hover:underline">
                      View Profile →
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="sm:hidden mt-4 text-center">
              <Link to="/mentors" className="text-sm text-primary hover:underline">
                View all mentors →
              </Link>
            </div>
          </div>
        </section>

        {/* Discord Communities */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-card/20">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-3">
                <MessageCircle className="h-3.5 w-3.5" />
                Community
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Discord Trading Groups
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                Join active communities of traders sharing setups, analysis, and ideas daily.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DISCORD_GROUPS.map((group) => (
                <div
                  key={group.name}
                  className="rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-foreground text-sm">{group.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {group.members.toLocaleString()} members
                          </span>
                          {group.active && (
                            <span className="flex items-center gap-1 text-xs text-primary">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                              Active now
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{group.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {group.tags.map((tag) => (
                        <span key={tag} className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-[11px]">
                      Join
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Videos */}
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-3">
                <Play className="h-3.5 w-3.5" />
                Free Content
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Trading Videos
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                Free educational content from our verified mentors.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {VIDEOS.map((video) => (
                <div
                  key={video.title}
                  className="group rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
                >
                  <div className="aspect-video bg-secondary flex items-center justify-center relative">
                    <span className="font-heading font-bold text-2xl text-muted-foreground/30">
                      {video.thumbnail}
                    </span>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="h-12 w-12 rounded-full bg-primary/90 flex items-center justify-center">
                        <Play className="h-5 w-5 text-primary-foreground fill-current ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-2 right-2 bg-background/80 text-foreground text-[10px] font-medium px-1.5 py-0.5 rounded">
                      {video.duration}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading font-semibold text-sm text-foreground leading-snug line-clamp-2 mb-2">
                      {video.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{video.mentor}</span>
                      <span>{video.views} views</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Us */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-card/20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-10">
              Why EdgeMentor?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  icon: Shield,
                  title: "Verified Only",
                  desc: "Every mentor provides proof of profitability. No fake gurus, no unproven strategies.",
                },
                {
                  icon: BarChart3,
                  title: "Real Strategies",
                  desc: "Learn proven methodologies — ICT, order flow, price action — from traders who use them daily.",
                },
                {
                  icon: Users,
                  title: "Active Community",
                  desc: "Join Discord groups with thousands of traders sharing setups, analysis, and support.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-border bg-card p-6">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 sm:py-24 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-4">
              Ready to level up your trading?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join hundreds of traders already learning from the best. Find your mentor today.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link to="/mentors">
                <Button size="lg" className="h-12 px-8 font-semibold text-sm">
                  Find a Mentor <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link to="/apply">
                <Button variant="outline" size="lg" className="h-12 px-8 font-semibold text-sm">
                  Apply as Mentor
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 py-8 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> EdgeMentor
            </div>
            <p className="text-xs text-muted-foreground">
              © 2026 EdgeMentor. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Homepage;
