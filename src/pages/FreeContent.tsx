import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Clock, Eye, Star, Search, TrendingUp, BookOpen, BarChart3, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";

const CATEGORIES = ["All", "Price Action", "ICT / SMC", "Order Flow", "Risk Management", "Psychology", "Crypto"];

const FEATURED_CREATORS = [
  { name: "ICT", channel: "The Inner Circle Trader" },
  { name: "TJR", channel: "TJR" },
  { name: "PB Trading", channel: "PB Trading" },
  { name: "Rayner Teo", channel: "Rayner Teo" },
  { name: "Trading Rush", channel: "Trading Rush" },
];

const VIDEOS = [
  // ICT / SMC
  { id: "C_0Jh7HwCUI", title: "Advanced ICT Liquidity Concepts", channel: "The Inner Circle Trader", views: "218K", duration: "1:14:02", category: "ICT / SMC" },
  { id: "3ZM2b-Sdg2A", title: "SMC Trading Strategy Explained Step by Step", channel: "Justin Bennett", views: "75K", duration: "18:44", category: "ICT / SMC" },
  { id: "mE6GruXMcFM", title: "8 ICT Liquidity Concepts Every Trader Must Know", channel: "Smart Money Strategy", views: "1.3M", duration: "58:20", category: "ICT / SMC" },
  { id: "BFfF_Lnk9T4", title: "Fair Value Gap Simplified — Smart Money Course", channel: "Smart Risk", views: "942K", duration: "14:33", category: "ICT / SMC" },
  { id: "xYJMy2mMGJ4", title: "ICT Order Blocks Explained in 10 Minutes", channel: "The Inner Circle Trader", views: "530K", duration: "10:22", category: "ICT / SMC" },
  { id: "Kv5y3GaXHcQ", title: "How To Trade Fair Value Gaps Like a PRO", channel: "TJR", views: "412K", duration: "22:15", category: "ICT / SMC" },
  { id: "WP1fVkRyMiU", title: "Smart Money Concepts Full Breakdown", channel: "TJR", views: "289K", duration: "35:40", category: "ICT / SMC" },
  { id: "QyKcbvMYKH0", title: "ICT Breaker Blocks & Mitigation — Complete Guide", channel: "PB Trading", views: "185K", duration: "28:33", category: "ICT / SMC" },
  { id: "pDf5ORJQ0zM", title: "Liquidity Sweeps — The Only Strategy You Need", channel: "PB Trading", views: "320K", duration: "19:47", category: "ICT / SMC" },
  { id: "6fGp2HKZOQA", title: "How ICT Trades the London Session", channel: "The Inner Circle Trader", views: "1.1M", duration: "1:02:30", category: "ICT / SMC" },

  // Price Action
  { id: "mEyuQVy3OHc", title: "The Ultimate Forex Trading Course (For Beginners)", channel: "Rayner Teo", views: "3.4M", duration: "45:22", category: "Price Action" },
  { id: "TxFITsJBQbI", title: "Best Supply and Demand Trading Strategy Explained", channel: "Trading Educators", views: "1.5M", duration: "34:50", category: "Price Action" },
  { id: "m4WOwgUMQuc", title: "The Best Candlestick Pattern Guide You'll Ever Find", channel: "Data Trader", views: "2.6M", duration: "22:59", category: "Price Action" },
  { id: "Ogj1tFEXDQ8", title: "Support & Resistance Strategy — All You Need to Know", channel: "Riley Coleman", views: "46K", duration: "27:01", category: "Price Action" },
  { id: "N5yVxOaKcXk", title: "Price Action Trading Was Hard Until I Learned This", channel: "TJR", views: "198K", duration: "16:42", category: "Price Action" },
  { id: "L3EazkCHn1I", title: "How to Read Candlestick Charts for Day Trading", channel: "PB Trading", views: "275K", duration: "24:18", category: "Price Action" },
  { id: "hRhJMo0TJaw", title: "The Only Price Action Video You Will Ever Need", channel: "Rayner Teo", views: "2.1M", duration: "38:15", category: "Price Action" },
  { id: "7srdUDjfWCY", title: "3 Simple Price Action Strategies for Beginners", channel: "Trading Rush", views: "1.8M", duration: "11:20", category: "Price Action" },
  { id: "PwFCg0lP-ks", title: "Market Structure Explained — Breaks, CHoCH & BOS", channel: "PB Trading", views: "156K", duration: "20:55", category: "Price Action" },

  // Order Flow
  { id: "_JRQn7_1Wyk", title: "How to Reveal Market Intent With Order Flow", channel: "Axia Futures", views: "3.5K", duration: "2:22", category: "Order Flow" },
  { id: "Nj2Gb-x7lIA", title: "Volume Profile — The Ultimate Day Trading Guide", channel: "Trader Dale", views: "75K", duration: "2:09:00", category: "Order Flow" },
  { id: "RdMPYEjvPvI", title: "Footprint Charts Mastery — The Ultimate Trading Tool", channel: "Wysetrade", views: "238K", duration: "22:32", category: "Order Flow" },
  { id: "J4oVhLFhMp8", title: "Order Flow Trading — How Institutions Move Price", channel: "Axia Futures", views: "92K", duration: "31:10", category: "Order Flow" },
  { id: "Grs3_dRqnNw", title: "Delta & Cumulative Volume Delta Explained", channel: "Trader Dale", views: "48K", duration: "15:44", category: "Order Flow" },

  // Risk Management
  { id: "7lWMAe8P4N0", title: "70%+ Win Rate Trading Strategy With Proof", channel: "Trading Rush", views: "152K", duration: "9:32", category: "Risk Management" },
  { id: "uzwx8pe0QdA", title: "4 Position Sizing Methods Behind Winning Trades", channel: "Unbiased Trading", views: "12K", duration: "12:11", category: "Risk Management" },
  { id: "vz4c5XRxzJE", title: "Risk Management: The #1 Skill Every Trader Needs", channel: "TJR", views: "134K", duration: "14:50", category: "Risk Management" },
  { id: "SEoMj5GNYEM", title: "How to Size Your Trades Properly", channel: "Rayner Teo", views: "890K", duration: "12:08", category: "Risk Management" },
  { id: "jGN8r8fKNiA", title: "Why 90% of Traders Lose Money — Risk Rules", channel: "Trading Rush", views: "2.4M", duration: "8:45", category: "Risk Management" },
  { id: "EYxMFHjQWQQ", title: "My Risk Management System (Copy This)", channel: "PB Trading", views: "98K", duration: "17:30", category: "Risk Management" },

  // Psychology
  { id: "492qcmMD70c", title: "Trading with a Gambling Mindset", channel: "Mark Douglas", views: "386", duration: "22:36", category: "Psychology" },
  { id: "0CO9DCNfMSA", title: "Why Most Traders Fail — Psychology, Risk & Consistency", channel: "Andrew Mitchem", views: "249", duration: "30:09", category: "Psychology" },
  { id: "cAVsjaErJjk", title: "Trading in the Zone — Full Audiobook Summary", channel: "Trading Psychology", views: "1.2M", duration: "42:18", category: "Psychology" },
  { id: "Rl5I1h1OZZY", title: "How to Stay Disciplined as a Trader", channel: "TJR", views: "76K", duration: "11:33", category: "Psychology" },
  { id: "wuYwvjdSX6w", title: "The Mindset That Made Me Profitable", channel: "PB Trading", views: "112K", duration: "15:20", category: "Psychology" },

  // Crypto
  { id: "q2cT_jMup_w", title: "Bitcoin Trading 101 — The Only Guide You Need", channel: "Coin Bureau", views: "148K", duration: "19:40", category: "Crypto" },
  { id: "hnS5sjqXXIc", title: "Crypto Trading for Beginners — Full Course", channel: "Crypto Educators", views: "2.3M", duration: "1:24:15", category: "Crypto" },
  { id: "BhgmwbVk96c", title: "How to 10x Your Bitcoin", channel: "Coin Bureau Trading", views: "15K", duration: "29:55", category: "Crypto" },
  { id: "bNMVWA2bpOQ", title: "Altcoin Trading Strategy That Actually Works", channel: "Coin Bureau", views: "320K", duration: "18:12", category: "Crypto" },
  { id: "Lhf_2gJJS1I", title: "How to Read Crypto Charts — Complete Beginner Guide", channel: "Crypto Educators", views: "1.8M", duration: "26:40", category: "Crypto" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

const FreeContent = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  

  const filtered = VIDEOS.filter((v) => {
    const matchCat = category === "All" || v.category === category;
    const matchSearch =
      !search ||
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.channel.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <PageTransition>
    <div className="min-h-screen bg-background">
      {/* Ambient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-[-100px] left-1/3 w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[130px]"
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-80px] right-1/4 w-[400px] h-[400px] bg-pink/[0.03] rounded-full blur-[100px]"
          animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
        {/* Hero */}
        <motion.div className="text-center mb-10" initial="hidden" animate="show">
          <motion.div
            variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-5"
          >
            <BookOpen className="h-3.5 w-3.5" /> Free Learning Resources
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-4">
            Learn Trading for{" "}
            <span className="bg-gradient-to-r from-primary via-pink-400 to-primary bg-clip-text text-transparent">Free</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
            Curated YouTube tutorials from top trading educators. Master the fundamentals before subscribing to a mentor.
          </motion.p>

          {/* Quick Stats */}
          <motion.div variants={fadeUp} custom={3} className="flex items-center justify-center gap-6 mt-6">
            {[
              { icon: Play, label: "Videos", value: `${VIDEOS.length}` },
              { icon: BarChart3, label: "Categories", value: `${CATEGORIES.length - 1}` },
              { icon: Zap, label: "100% Free", value: "$0" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                <s.icon className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">{s.value}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search videos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-muted border-border focus:border-primary/50 transition-all duration-300 focus:shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <motion.div key={cat} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant={category === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategory(cat)}
                  className={`whitespace-nowrap text-xs ${category === cat ? "shadow-lg shadow-primary/20" : ""}`}
                >
                  {cat}
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((video, i) => (
            <motion.div
              key={video.id}
              variants={fadeUp}
              custom={i}
              initial="hidden"
              animate="show"
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group rounded-2xl border border-border bg-card overflow-hidden shadow-lg shadow-black/10 hover:border-primary/30 hover:shadow-primary/10 transition-all duration-300 card-pink-hover"
            >
              {/* Thumbnail / Player */}
              <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="relative aspect-video bg-muted block">
                <img
                  src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                  alt={video.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-14 w-14 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-xl shadow-primary/30 group-hover:shadow-primary/50 transition-shadow">
                    <Play className="h-6 w-6 text-primary-foreground fill-current ml-1" />
                  </div>
                </div>
                <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {video.duration}
                </span>
              </a>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-heading text-sm font-semibold text-foreground leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                  {video.title}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{video.channel}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {video.views}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="rounded-md bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-medium">
                    {video.category}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-muted-foreground">No videos found. Try a different search or category.</p>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          className="text-center mt-14 rounded-2xl border border-border bg-card p-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-heading text-xl font-bold text-foreground mb-2">Ready for personalized mentorship?</h2>
          <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
            Get direct access to pro traders with custom content, strategies, and 1-on-1 guidance.
          </p>
          <motion.div whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.97 }}>
            <a href="/mentors">
              <Button className="h-11 px-6 font-semibold shadow-lg shadow-primary/20">
                <TrendingUp className="h-4 w-4 mr-2" /> Browse Mentors
              </Button>
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
    </PageTransition>
  );
};

export default FreeContent;
