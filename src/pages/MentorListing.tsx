import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  TrendingUp, Search, Star, Clock, SlidersHorizontal, X, Crown,
  ArrowUpDown, Users, ChevronRight, Sparkles, Zap, Target,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useMentors } from "@/hooks/use-mentors";
import TierBadge from "@/components/TierBadge";
import PageTransition from "@/components/PageTransition";
import type { Mentor, MentorTier } from "@/types/mentor";

const ALL_INSTRUMENTS = ["Futures", "Forex", "Crypto", "Options"];
const ALL_CONCEPTS = ["ICT", "Order Flow", "Price Action", "Patterns"];

type SortOption = "featured" | "newest" | "top_rated" | "most_students" | "trending";

const SORT_OPTIONS: { value: SortOption; label: string; icon: typeof Sparkles }[] = [
  { value: "featured", label: "Featured", icon: Sparkles },
  { value: "newest", label: "Newest", icon: Zap },
  { value: "top_rated", label: "Top Rated", icon: Star },
  { value: "most_students", label: "Most Students", icon: Users },
  { value: "trending", label: "Trending", icon: TrendingUp },
];

const TIER_ORDER: Record<MentorTier, number> = { elite: 0, pro: 1, verified: 2 };

const sortMentors = (mentors: Mentor[], sort: SortOption): Mentor[] => {
  const sorted = [...mentors];
  switch (sort) {
    case "featured":
      return sorted.sort((a, b) => (TIER_ORDER[a.tier || "verified"] ?? 2) - (TIER_ORDER[b.tier || "verified"] ?? 2) || b.rating - a.rating);
    case "newest":
      return sorted.sort((a, b) => b.id.localeCompare(a.id));
    case "top_rated":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "most_students":
      return sorted.sort((a, b) => b.students - a.students);
    case "trending":
      return sorted.sort((a, b) => (b.students * b.rating) - (a.students * a.rating));
    default:
      return sorted;
  }
};

const MentorCard = ({ mentor, index }: { mentor: Mentor; index: number }) => {
  const tier = mentor.tier || "verified";
  const isElite = tier === "elite";

  return (
    <Link to={`/mentor/${mentor.id}`} className="block group">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
        whileHover={{ y: -6, transition: { duration: 0.25, ease: "easeOut" } }}
        className={`relative rounded-2xl border p-5 transition-colors duration-300 card-pink-hover ${
          isElite
            ? "border-slate-600/50 bg-gradient-to-br from-slate-900 via-card to-slate-800/60 hover:border-slate-400/50 hover:shadow-[0_20px_60px_-15px_rgba(148,163,184,0.15)]"
            : "border-border bg-card/80 backdrop-blur-sm hover:border-primary/40 hover:shadow-[0_20px_60px_-15px_hsl(160_84%_39%/0.12)]"
        }`}
      >
        {/* Elite glow line */}
        {isElite && (
          <>
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-slate-400/60 to-transparent" />
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-500/40 px-3 py-1 text-[10px] font-bold text-slate-100 tracking-wider uppercase shadow-lg shadow-slate-900/50">
                <Crown className="h-3 w-3 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" /> Elite
              </span>
            </div>
          </>
        )}

        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl font-heading font-bold text-base transition-transform duration-300 group-hover:scale-105 ${
            isElite
              ? "bg-gradient-to-br from-slate-600 to-slate-800 text-slate-100 shadow-lg shadow-slate-900/50"
              : "bg-gradient-to-br from-primary/20 to-primary/5 text-primary"
          }`}>
            {mentor.avatar}
            {isElite && <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-amber-400 border-2 border-card shadow-[0_0_8px_rgba(251,191,36,0.4)]" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-heading font-bold text-foreground truncate text-base">{mentor.name}</h3>
              <TierBadge tier={tier} size="sm" showLabel={false} />
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {mentor.experience}
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-amber-400">
                <Star className="h-3 w-3 fill-amber-400" /> {mentor.rating}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" /> {mentor.students}
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">{mentor.bio}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {mentor.instruments.slice(0, 3).map((i) => (
            <span key={i} className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
              isElite ? "bg-slate-700/60 text-slate-200" : "bg-primary/10 text-primary"
            }`}>{i}</span>
          ))}
          {mentor.concepts.slice(0, 2).map((c) => (
            <span key={c} className="rounded-lg bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground tracking-wide">{c}</span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div>
            <span className="font-heading font-bold text-xl text-foreground">${mentor.monthly_price}</span>
            <span className="text-xs text-muted-foreground ml-0.5">/mo</span>
          </div>
          <div className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all duration-300 ${
            isElite
              ? "bg-slate-200 text-slate-900 group-hover:bg-white group-hover:shadow-lg"
              : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
          }`}>
            View Profile <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

const FeaturedMentorsRow = ({ mentors }: { mentors: Mentor[] }) => {
  const eliteMentors = mentors.filter((m) => (m.tier || "verified") === "elite");
  if (eliteMentors.length === 0) return null;

  return (
    <motion.div
      className="mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/10">
          <Crown className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">Elite Mentors</h2>
          <p className="text-xs text-muted-foreground">Hand-picked top performers</p>
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin snap-x snap-mandatory">
        {eliteMentors.map((mentor) => (
          <Link key={mentor.id} to={`/mentor/${mentor.id}`} className="min-w-[300px] max-w-[340px] shrink-0 snap-start group">
            <div className="relative rounded-2xl border border-slate-600/40 bg-gradient-to-br from-slate-900 via-card to-slate-800/70 p-5 transition-all duration-500 hover:border-slate-400/50 hover:shadow-[0_20px_60px_-15px_rgba(148,163,184,0.15)] hover:-translate-y-1">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-slate-400/50 to-transparent" />
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/[0.03] rounded-bl-[80px]" />

              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-slate-100 font-heading font-bold text-sm shadow-lg">
                  {mentor.avatar}
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-amber-400 border-2 border-card" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="font-heading font-bold text-foreground text-sm truncate">{mentor.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-400"><Star className="h-3 w-3 fill-amber-400" /> {mentor.rating}</span>
                    <span className="text-xs text-muted-foreground">{mentor.students} students</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">{mentor.bio}</p>

              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-foreground">
                  ${mentor.monthly_price}<span className="text-xs text-muted-foreground font-normal">/mo</span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">
                  Explore <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
};

const MentorListingPage = () => {
  const [search, setSearch] = useState("");
  const [activeInstruments, setActiveInstruments] = useState<string[]>([]);
  const [activeConcepts, setActiveConcepts] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number]>([500]);
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const { data: mentors = [], isLoading } = useMentors();

  const toggleItem = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

  const filtered = mentors.filter((m) => {
    const matchesSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.bio.toLowerCase().includes(search.toLowerCase());
    const matchesInstrument = activeInstruments.length === 0 || activeInstruments.some((i) => m.instruments.includes(i));
    const matchesConcept = activeConcepts.length === 0 || activeConcepts.some((c) => m.concepts.includes(c));
    const matchesPrice = m.monthly_price <= priceRange[0];
    return matchesSearch && matchesInstrument && matchesConcept && matchesPrice;
  });

  const sorted = sortMentors(filtered, sortBy);
  const activeFilterCount = activeInstruments.length + activeConcepts.length + (priceRange[0] < 500 ? 1 : 0);

  const clearFilters = () => {
    setActiveInstruments([]);
    setActiveConcepts([]);
    setPriceRange([500]);
    setSearch("");
  };

  return (
    <PageTransition>
    <Helmet>
      <title>Browse Trading Mentors — EdgeMentor</title>
      <meta name="description" content="Explore verified trading mentors specializing in futures, forex, crypto & options. Filter by instrument, concept, and price to find your perfect mentor." />
      <link rel="canonical" href="https://edgementor.lovable.app/mentors" />
      <meta property="og:title" content="Browse Trading Mentors — EdgeMentor" />
      <meta property="og:description" content="Explore verified trading mentors specializing in futures, forex, crypto & options." />
      <meta property="og:url" content="https://edgementor.lovable.app/mentors" />
      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Trading Mentors",
        "description": "Browse and connect with elite trading mentors.",
        "url": "https://edgementor.lovable.app/mentors",
        "isPartOf": { "@type": "WebSite", "name": "EdgeMentor", "url": "https://edgementor.lovable.app" }
      })}</script>
    </Helmet>
    <div className="min-h-screen bg-background border-pink-100 text-pink-50">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-pink/[0.025] rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary mb-6 backdrop-blur-sm"
          >
            <Target className="h-3.5 w-3.5" /> {mentors.length} Verified Mentors Available
          </motion.div>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-5">
            Find Your <span className="text-primary">Edge</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
            Connect with elite traders who've been where you want to go. Real strategies, real results.
          </p>

          {/* Quick stats */}
          <div className="flex items-center justify-center gap-10 mt-10">
            {[
              { value: `${mentors.length}`, label: "Mentors" },
              { value: "4.8", label: "Avg Rating" },
              { value: "1.2K+", label: "Students" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
              >
                <div className="font-heading font-bold text-xl text-foreground">{stat.value}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="sticky top-2 z-20 rounded-2xl border border-border bg-card/90 backdrop-blur-xl p-4 mb-12 shadow-lg shadow-background/50"
        >
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, strategy, or instrument..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50 h-11 text-sm rounded-xl"
              />
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative gap-2 h-11 px-4 rounded-xl border-border/50">
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                  <AnimatePresence>
                    {activeFilterCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-lg shadow-primary/30"
                      >
                        {activeFilterCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 sm:w-96 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="font-heading flex items-center justify-between">
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                      <button onClick={clearFilters} className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
                        <X className="h-3 w-3" /> Clear all ({activeFilterCount})
                      </button>
                    )}
                  </SheetTitle>
                </SheetHeader>
                <div className="space-y-8 mt-6">
                  {/* Price Range */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Max Price: <span className="text-foreground">${priceRange[0]}/mo</span>
                    </label>
                    <Slider value={priceRange} onValueChange={(v) => setPriceRange(v as [number])} min={10} max={500} step={10} />
                    <div className="flex justify-between text-[10px] text-muted-foreground"><span>$10</span><span>$500</span></div>
                  </div>

                  {/* Concepts */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Concepts</label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_CONCEPTS.map((c) => (
                        <motion.button
                          key={c}
                          onClick={() => setActiveConcepts(toggleItem(activeConcepts, c))}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${activeConcepts.includes(c)
                            ? "border-primary/50 bg-primary/15 text-primary shadow-sm shadow-primary/10"
                            : "border-border bg-secondary text-muted-foreground hover:text-foreground hover:border-border"}`}
                        >
                          {c}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Instruments */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Instruments</label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_INSTRUMENTS.map((inst) => (
                        <motion.button
                          key={inst}
                          onClick={() => setActiveInstruments(toggleItem(activeInstruments, inst))}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${activeInstruments.includes(inst)
                            ? "border-primary/50 bg-primary/15 text-primary shadow-sm shadow-primary/10"
                            : "border-border bg-secondary text-muted-foreground hover:text-foreground hover:border-border"}`}
                        >
                          {inst}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Active Filters Summary */}
                  <AnimatePresence>
                    {activeFilterCount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-xl border border-primary/20 bg-primary/5 p-3"
                      >
                        <p className="text-xs text-muted-foreground mb-2">Active filters:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {activeInstruments.map((i) => (
                            <motion.span
                              key={i}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5"
                            >
                              {i}
                              <button onClick={() => setActiveInstruments(toggleItem(activeInstruments, i))}>
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </motion.span>
                          ))}
                          {activeConcepts.map((c) => (
                            <motion.span
                              key={c}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5"
                            >
                              {c}
                              <button onClick={() => setActiveConcepts(toggleItem(activeConcepts, c))}>
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </motion.span>
                          ))}
                          {priceRange[0] < 500 && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5"
                            >
                              ≤${priceRange[0]}/mo
                              <button onClick={() => setPriceRange([500])}>
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </motion.span>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </SheetContent>
            </Sheet>

            <Link to="/apply" className="hidden lg:block">
              <Button variant="outline" className="h-11 px-4 rounded-xl border-border/50 text-xs font-semibold gap-1.5">
                <Zap className="h-3.5 w-3.5" /> Become a Mentor
              </Button>
            </Link>
          </div>

          {/* Sort pills */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {SORT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                      sortBy === opt.value
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Icon className="h-3 w-3" /> {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
              {sorted.length} result{sorted.length !== 1 ? "s" : ""}
            </div>
          </div>
        </motion.div>

        {/* Featured Mentors Row */}
        {!isLoading && <FeaturedMentorsRow mentors={mentors} />}

        {/* Mentor Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="relative rounded-2xl border border-border bg-card/50 p-5 overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-muted-foreground/5 to-transparent" />
                <div className="flex gap-4 mb-4">
                  <div className="h-14 w-14 rounded-xl bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4 w-36 bg-muted rounded-md animate-pulse" />
                    <div className="flex gap-3">
                      <div className="h-3 w-20 bg-muted rounded-md animate-pulse" />
                      <div className="h-3 w-14 bg-muted rounded-md animate-pulse" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 w-full bg-muted rounded-md animate-pulse" />
                  <div className="h-3 w-4/5 bg-muted rounded-md animate-pulse" />
                </div>
                <div className="flex gap-2 mb-5">
                  <div className="h-6 w-16 bg-muted rounded-lg animate-pulse" />
                  <div className="h-6 w-16 bg-muted rounded-lg animate-pulse" />
                  <div className="h-6 w-20 bg-muted rounded-lg animate-pulse" />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="h-6 w-20 bg-muted rounded-md animate-pulse" />
                  <div className="h-8 w-28 bg-muted rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mx-auto mb-4">
              <Search className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <h3 className="font-heading font-bold text-foreground mb-2">No mentors found</h3>
            <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters or search terms.</p>
            <Button variant="outline" size="sm" onClick={clearFilters} className="text-xs font-semibold">
              <X className="h-3.5 w-3.5 mr-1.5" /> Clear all filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            {sorted.map((mentor, i) => (
              <MentorCard key={mentor.id} mentor={mentor} index={i} />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        {!isLoading && sorted.length > 0 && (
          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex flex-col items-center gap-4 rounded-2xl border border-border bg-card/50 backdrop-blur-sm px-8 py-8">
              <h3 className="font-heading font-bold text-foreground text-lg">Are you a profitable trader?</h3>
              <p className="text-sm text-muted-foreground max-w-sm">Share your knowledge, build your community, and earn recurring revenue.</p>
              <Link to="/apply">
                <Button className="font-bold text-sm gap-2">
                  <Zap className="h-4 w-4" /> Apply to Be a Mentor
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
    </PageTransition>
  );
};

export default MentorListingPage;
