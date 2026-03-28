import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TrendingUp, Search, Star, Clock, SlidersHorizontal, X, Crown, ArrowUpDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useMentors } from "@/hooks/use-mentors";
import TierBadge from "@/components/TierBadge";
import type { Mentor, MentorTier } from "@/types/mentor";

const ALL_INSTRUMENTS = ["Futures", "Forex", "Crypto", "Options"];
const ALL_CONCEPTS = ["ICT", "Order Flow", "Price Action", "Patterns"];

type SortOption = "featured" | "newest" | "top_rated" | "most_students" | "trending";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "top_rated", label: "Top Rated" },
  { value: "most_students", label: "Most Students" },
  { value: "trending", label: "Trending" },
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

const MentorCard = ({ mentor }: { mentor: Mentor }) => {
  const tier = mentor.tier || "verified";
  const isElite = tier === "elite";

  return (
    <div className={`group relative rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg ${
      isElite
        ? "border-slate-600/50 bg-gradient-to-br from-slate-900 via-card to-slate-900/80 hover:border-slate-400/40 hover:shadow-slate-400/10"
        : "border-border bg-card hover:border-primary/30 hover:shadow-primary/5"
    }`}>
      {isElite && (
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-slate-400/50 to-transparent" />
      )}
      {isElite && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 border border-slate-600/50 px-2.5 py-0.5 text-[10px] font-semibold text-slate-200 shadow-[0_0_12px_rgba(203,213,225,0.15)]">
            <Crown className="h-3 w-3 drop-shadow-[0_0_6px_rgba(203,213,225,0.5)]" /> FEATURED
          </span>
        </div>
      )}
      <div className="flex items-start gap-4 mb-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-heading font-bold text-sm ${
          isElite ? "bg-slate-700/50 text-slate-200" : "bg-primary/10 text-primary"
        }`}>
          {mentor.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-semibold text-foreground truncate">{mentor.name}</h3>
            <TierBadge tier={tier} size="sm" showLabel={false} />
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> {mentor.experience}
            </span>
            <span className="flex items-center gap-1 text-xs text-amber-400">
              <Star className="h-3 w-3 fill-current" /> {mentor.rating}
            </span>
            <TierBadge tier={tier} size="sm" />
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="font-heading font-bold text-foreground">${mentor.monthly_price}</span>
          <span className="text-xs text-muted-foreground block">/month</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">{mentor.bio}</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {mentor.instruments.map((i) => (
          <span key={i} className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${isElite ? "bg-slate-700/50 text-slate-300" : "bg-primary/10 text-primary"}`}>{i}</span>
        ))}
        {mentor.concepts.map((c) => (
          <span key={c} className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">{c}</span>
        ))}
        <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{mentor.session}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{mentor.students} students</span>
        <Link to={`/mentor/${mentor.id}`}>
          <Button size="sm" className={`h-8 text-xs font-semibold ${isElite ? "bg-slate-200 text-slate-900 hover:bg-white" : ""}`}>View Profile</Button>
        </Link>
      </div>
    </div>
  );
};

const FeaturedMentorsRow = ({ mentors }: { mentors: Mentor[] }) => {
  const eliteMentors = mentors.filter((m) => (m.tier || "verified") === "elite");
  if (eliteMentors.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2.5 mb-4">
        <Crown className="h-5 w-5 text-slate-200 drop-shadow-[0_0_6px_rgba(203,213,225,0.5)]" />
        <h2 className="font-heading text-lg font-bold text-foreground">Featured Mentors</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
        {eliteMentors.map((mentor) => (
          <Link key={mentor.id} to={`/mentor/${mentor.id}`} className="min-w-[280px] max-w-[320px] shrink-0">
            <div className="relative rounded-2xl border border-slate-600/50 bg-gradient-to-br from-slate-900 via-card to-slate-900/80 p-5 transition-all hover:border-slate-400/40 hover:shadow-lg hover:shadow-slate-400/10">
              <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-slate-400/50 to-transparent" />
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-700/50 text-slate-200 font-heading font-bold text-sm">
                  {mentor.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-heading font-semibold text-foreground text-sm truncate">{mentor.name}</h3>
                    <Crown className="h-3.5 w-3.5 text-slate-200 drop-shadow-[0_0_6px_rgba(203,213,225,0.5)] shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-amber-400"><Star className="h-3 w-3 fill-current" /> {mentor.rating}</span>
                    <span className="text-xs text-muted-foreground">{mentor.students} students</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{mentor.bio}</p>
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-foreground text-sm">${mentor.monthly_price}<span className="text-xs text-muted-foreground font-normal">/mo</span></span>
                <TierBadge tier="elite" size="sm" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
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
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(hsl(160 84% 39% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(160 84% 39% / 0.3) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-3">
              <TrendingUp className="h-3.5 w-3.5" /> Verified Mentors
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Find Your Mentor</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{mentors.length} verified traders ready to accelerate your edge.</p>
          </div>
          <Link to="/apply">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex text-xs">Become a Mentor</Button>
          </Link>
        </div>

        {/* Featured Mentors Row */}
        {!isLoading && <FeaturedMentorsRow mentors={mentors} />}

        {/* Search + Filters + Sort */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search mentors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="relative gap-2 shrink-0">
                <SlidersHorizontal className="h-4 w-4" /> Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 space-y-5" align="end">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-semibold text-sm text-foreground">Filters</h4>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <X className="h-3 w-3" /> Clear all
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground">Max Price: ${priceRange[0]}/mo</label>
                <Slider value={priceRange} onValueChange={(v) => setPriceRange(v as [number])} min={10} max={500} step={10} />
                <div className="flex justify-between text-[10px] text-muted-foreground"><span>$10</span><span>$500</span></div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Concepts</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_CONCEPTS.map((c) => (
                    <button key={c} onClick={() => setActiveConcepts(toggleItem(activeConcepts, c))}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${activeConcepts.includes(c) ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground hover:text-foreground"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Indexes</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_INSTRUMENTS.map((inst) => (
                    <button key={inst} onClick={() => setActiveInstruments(toggleItem(activeInstruments, inst))}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${activeInstruments.includes(inst) ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground hover:text-foreground"}`}>
                      {inst}
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 mb-6">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground mr-1">Sort:</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                sortBy === opt.value
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-16 text-muted-foreground"><p className="text-sm">Loading mentors...</p></div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-sm">No mentors match your filters.</p>
              <button onClick={clearFilters} className="text-primary text-sm mt-2 hover:underline">Clear filters</button>
            </div>
          ) : (
            sorted.map((mentor) => <MentorCard key={mentor.id} mentor={mentor} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorListingPage;
