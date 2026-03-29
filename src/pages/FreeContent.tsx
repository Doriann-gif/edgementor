import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Clock, Eye, Star, Search, TrendingUp, BookOpen, BarChart3, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";

const CATEGORIES = ["All", "Price Action", "ICT / SMC", "Order Flow", "Risk Management", "Psychology", "Crypto"];

const VIDEOS = [
  {
    id: "QgGMwQBYxjM",
    title: "ICT Mentorship Core Concepts — Full Breakdown",
    channel: "The Inner Circle Trader",
    views: "2.1M",
    duration: "1:42:30",
    category: "ICT / SMC",
  },
  {
    id: "eynxyoKgpNg",
    title: "Smart Money Concepts Explained Simply",
    channel: "The Trading Channel",
    views: "1.8M",
    duration: "28:15",
    category: "ICT / SMC",
  },
  {
    id: "Yk2iVfYx-JY",
    title: "Price Action Trading — The Complete Guide",
    channel: "Rayner Teo",
    views: "3.4M",
    duration: "45:22",
    category: "Price Action",
  },
  {
    id: "jRuFYjH-mUY",
    title: "How to Read Order Flow Like a Pro",
    channel: "Axia Futures",
    views: "890K",
    duration: "52:10",
    category: "Order Flow",
  },
  {
    id: "2m3j7kc7NJo",
    title: "Risk Management — The #1 Skill in Trading",
    channel: "Trading Rush",
    views: "2.6M",
    duration: "15:44",
    category: "Risk Management",
  },
  {
    id: "sClDN1XBYDQ",
    title: "Trading Psychology Masterclass",
    channel: "Mark Douglas",
    views: "4.2M",
    duration: "1:12:08",
    category: "Psychology",
  },
  {
    id: "GmOzih6I1zs",
    title: "Supply & Demand Zones — Complete Tutorial",
    channel: "The Moving Average",
    views: "1.5M",
    duration: "34:50",
    category: "Price Action",
  },
  {
    id: "Lhf_2gJJS1I",
    title: "Crypto Trading for Beginners 2024",
    channel: "Coin Bureau",
    views: "1.1M",
    duration: "22:33",
    category: "Crypto",
  },
  {
    id: "ScKHjyRHFMI",
    title: "Volume Profile — The Ultimate Guide",
    channel: "Trader Dale",
    views: "720K",
    duration: "41:05",
    category: "Order Flow",
  },
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
  const [playingId, setPlayingId] = useState<string | null>(null);

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
              <div className="relative aspect-video bg-muted">
                {playingId === video.id ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`}
                    title={video.title}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                ) : (
                  <>
                    <img
                      src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                      alt={video.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                    <motion.button
                      onClick={() => setPlayingId(video.id)}
                      className="absolute inset-0 flex items-center justify-center"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <div className="h-14 w-14 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-xl shadow-primary/30 group-hover:shadow-primary/50 transition-shadow">
                        <Play className="h-6 w-6 text-primary-foreground fill-current ml-1" />
                      </div>
                    </motion.button>
                    <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {video.duration}
                    </span>
                  </>
                )}
              </div>

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
