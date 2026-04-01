import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Clock, Eye, Star, Search, TrendingUp, BookOpen, BarChart3, Zap, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  { id: "FmrkqxEmWxM", title: "The Best Entry Strategies in SMC & ICT", channel: "Smart Risk", views: "62K", duration: "13:46", category: "ICT / SMC" },
  { id: "SHJHpedYh6A", title: "Beginners Guide to Start Day Trading (5 Hours)", channel: "TJR", views: "3.1M", duration: "5:15:05", category: "ICT / SMC" },
  { id: "aobHuNcI1QM", title: "How to Start Day Trading as a Beginner (9 Hours)", channel: "TJR", views: "2.8M", duration: "9:03:38", category: "ICT / SMC" },
  { id: "BVy-c3iXTEQ", title: "Every ICT Concept Explained in 38 Minutes", channel: "PB Trading", views: "44K", duration: "38:05", category: "ICT / SMC" },
  { id: "mVS4OSyj0Zg", title: "The PB Trading Lore (Intro to ICT for Dummies)", channel: "PB Trading", views: "165K", duration: "14:49", category: "ICT / SMC" },
  { id: "8m5k84KFSXw", title: "How I'd Make $100K ICT Trading Starting Over", channel: "PB Trading", views: "88K", duration: "12:23", category: "ICT / SMC" },

  // Price Action
  { id: "mEyuQVy3OHc", title: "The Ultimate Forex Trading Course (For Beginners)", channel: "Rayner Teo", views: "3.4M", duration: "45:22", category: "Price Action" },
  { id: "TxFITsJBQbI", title: "Best Supply and Demand Trading Strategy Explained", channel: "Trading Educators", views: "1.5M", duration: "34:50", category: "Price Action" },
  { id: "m4WOwgUMQuc", title: "The Best Candlestick Pattern Guide You'll Ever Find", channel: "Data Trader", views: "2.6M", duration: "22:59", category: "Price Action" },
  { id: "Ogj1tFEXDQ8", title: "Support & Resistance Strategy — All You Need to Know", channel: "Riley Coleman", views: "46K", duration: "27:01", category: "Price Action" },
  { id: "sWTnFS10tdQ", title: "The Ultimate Chart Patterns Trading Course", channel: "Rayner Teo", views: "922K", duration: "1:16:42", category: "Price Action" },
  { id: "RTJ4PRxM9Is", title: "Candlestick Patterns: Top 3 Beginners Mistakes", channel: "Rayner Teo", views: "36K", duration: "8:39", category: "Price Action" },
  { id: "p5CKu0FNbyg", title: "My Day Trading Strategy Explained (Step by Step)", channel: "TJR", views: "252K", duration: "39:27", category: "Price Action" },
  { id: "aJL__4IDzC4", title: "This Stupid Simple Strategy Works Everyday (Proven)", channel: "PB Trading", views: "151K", duration: "30:38", category: "Price Action" },
  { id: "n0ylmte1Fc0", title: "Work in Silence: PB Theory", channel: "PB Trading", views: "38K", duration: "16:19", category: "Price Action" },

  // Order Flow
  { id: "_JRQn7_1Wyk", title: "How to Reveal Market Intent With Order Flow", channel: "Axia Futures", views: "3.5K", duration: "2:22", category: "Order Flow" },
  { id: "Nj2Gb-x7lIA", title: "Volume Profile — The Ultimate Day Trading Guide", channel: "Trader Dale", views: "75K", duration: "2:09:00", category: "Order Flow" },
  { id: "RdMPYEjvPvI", title: "Footprint Charts Mastery — The Ultimate Trading Tool", channel: "Wysetrade", views: "238K", duration: "22:32", category: "Order Flow" },
  { id: "gXJIRsV76x4", title: "How to Trade the Delta Flip Order Flow Strategy", channel: "Axia Futures", views: "18K", duration: "8:42", category: "Order Flow" },
  { id: "vVMJa7dyYWE", title: "The ONLY Volume Profile Guide You'll Ever Need", channel: "Trader Dale", views: "401K", duration: "38:34", category: "Order Flow" },
  { id: "ExX17Jp-uyo", title: "Volume Profile Setup for Post-Trend Wins", channel: "Trader Dale", views: "94K", duration: "6:35", category: "Order Flow" },

  // Risk Management
  { id: "7lWMAe8P4N0", title: "70%+ Win Rate Trading Strategy With Proof", channel: "Trading Rush", views: "152K", duration: "9:32", category: "Risk Management" },
  { id: "uzwx8pe0QdA", title: "4 Position Sizing Methods Behind Winning Trades", channel: "Unbiased Trading", views: "12K", duration: "12:11", category: "Risk Management" },
  { id: "q5UiDAk1740", title: "Risk Management and Position Sizing", channel: "Rayner Teo", views: "186K", duration: "9:48", category: "Risk Management" },
  { id: "HWhTbBFUO3Y", title: "Testing 87% Win Rate Strategy 100 Times", channel: "Trading Rush", views: "70K", duration: "12:31", category: "Risk Management" },
  { id: "IpSlHWMGgY4", title: "How I Increased Win Rate in Trading (With Proof)", channel: "Trading Rush", views: "25K", duration: "7:44", category: "Risk Management" },
  { id: "UNT_fytJB3Y", title: "How I Would Start Day Trading With $0", channel: "TJR", views: "114K", duration: "17:16", category: "Risk Management" },

  // Psychology
  { id: "492qcmMD70c", title: "Trading with a Gambling Mindset", channel: "Mark Douglas", views: "386", duration: "22:36", category: "Psychology" },
  { id: "0CO9DCNfMSA", title: "Why Most Traders Fail — Psychology, Risk & Consistency", channel: "Andrew Mitchem", views: "249", duration: "30:09", category: "Psychology" },
  { id: "tMRtojrPggY", title: "Trading in the Zone — Full Audiobook", channel: "Mark Douglas", views: "746K", duration: "7:08:34", category: "Psychology" },
  { id: "VdLKK1EQ92A", title: "Why New Traders Keep Failing (TJR Interview)", channel: "TJR", views: "538K", duration: "1:09:30", category: "Psychology" },
  { id: "KxBRLErkel0", title: "The Strategy That Made Me $291K This Month", channel: "TJR", views: "234K", duration: "35:52", category: "Psychology" },
  { id: "qV2ibdbbdE4", title: "Live Day Trading Making $18,206 (Revenge Traded)", channel: "PB Trading", views: "93K", duration: "18:52", category: "Psychology" },

  // Crypto
  { id: "q2cT_jMup_w", title: "Bitcoin Trading 101 — The Only Guide You Need", channel: "Coin Bureau", views: "148K", duration: "19:40", category: "Crypto" },
  { id: "hnS5sjqXXIc", title: "Crypto Trading for Beginners — Full Course", channel: "Crypto Educators", views: "2.3M", duration: "1:24:15", category: "Crypto" },
  { id: "BhgmwbVk96c", title: "How to 10x Your Bitcoin", channel: "Coin Bureau Trading", views: "15K", duration: "29:55", category: "Crypto" },
  { id: "_qVWp3C0D2g", title: "The Ultimate 2026 Crypto Portfolio Strategy", channel: "Coin Bureau", views: "78K", duration: "20:12", category: "Crypto" },
  { id: "cUhbXiQOzRQ", title: "The Next Altcoin Season Will Be the Biggest Ever", channel: "Coin Bureau Trading", views: "14K", duration: "30:29", category: "Crypto" },
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
  const [sortBy, setSortBy] = useState("default");

  const parseViews = (v: string) => {
    const num = parseFloat(v);
    if (v.endsWith("M")) return num * 1_000_000;
    if (v.endsWith("K")) return num * 1_000;
    return num;
  };

  const parseDuration = (d: string) => {
    const parts = d.split(":").map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return parts[0] * 60 + parts[1];
  };

  const filtered = VIDEOS.filter((v) => {
    const matchCat = category === "All" || v.category === category;
    const matchSearch =
      !search ||
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.channel.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "views") return parseViews(b.views) - parseViews(a.views);
    if (sortBy === "duration") return parseDuration(b.duration) - parseDuration(a.duration);
    if (sortBy === "shortest") return parseDuration(a.duration) - parseDuration(b.duration);
    return 0;
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

          {/* Featured Creators */}
          <motion.div variants={fadeUp} custom={4} className="flex flex-wrap items-center justify-center gap-2 mt-5">
            <span className="text-xs text-muted-foreground mr-1">
              <Star className="h-3 w-3 inline mr-1" />Featured:
            </span>
            {FEATURED_CREATORS.map((c) => (
              <button
                key={c.name}
                onClick={() => { setSearch(c.channel); setCategory("All"); }}
                className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-primary/10 transition-colors"
              >
                {c.name}
              </button>
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
          <div className="flex gap-2 items-center">
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
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] h-9 text-xs bg-muted border-border shrink-0">
                <ArrowUpDown className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="views">Most Views</SelectItem>
                <SelectItem value="duration">Longest</SelectItem>
                <SelectItem value="shortest">Shortest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((video, i) => (
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

        {sorted.length === 0 && (
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
