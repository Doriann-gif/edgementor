import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, Search, Star, Clock, DollarSign, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { TrendingUp, Search, Star, Clock, DollarSign, Filter } from "lucide-react";
import { Link } from "react-router-dom";

interface Mentor {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  experience: string;
  instruments: string[];
  concepts: string[];
  session: string;
  monthlyPrice: number;
  rating: number;
  students: number;
}

const MENTORS: Mentor[] = [
  {
    id: "1",
    name: "Marcus Chen",
    avatar: "MC",
    bio: "Former prop trader turned educator. Specializing in futures order flow with a focus on ES and NQ scalping during NY session.",
    experience: "10+ years",
    instruments: ["Futures"],
    concepts: ["Order Flow", "VWAP"],
    session: "New York",
    monthlyPrice: 299,
    rating: 4.9,
    students: 142,
  },
  {
    id: "2",
    name: "Sarah Williams",
    avatar: "SW",
    bio: "ICT methodology expert with deep knowledge of liquidity concepts. Teaching smart money concepts across forex pairs.",
    experience: "8-10 years",
    instruments: ["Forex", "Futures"],
    concepts: ["ICT", "Price Action"],
    session: "London",
    monthlyPrice: 199,
    rating: 4.8,
    students: 98,
  },
  {
    id: "3",
    name: "David Okonkwo",
    avatar: "DO",
    bio: "Crypto native since 2017. Supply and demand trader focusing on BTC and ETH with proven 6-figure returns.",
    experience: "5-8 years",
    instruments: ["Crypto", "Equities"],
    concepts: ["Supply & Demand", "Price Action"],
    session: "Asian",
    monthlyPrice: 149,
    rating: 4.7,
    students: 67,
  },
  {
    id: "4",
    name: "Elena Petrova",
    avatar: "EP",
    bio: "Institutional background with Goldman Sachs. Now teaching retail traders how to read order flow like a professional.",
    experience: "10+ years",
    instruments: ["Futures", "Forex", "Equities"],
    concepts: ["Order Flow", "VWAP", "ICT"],
    session: "London",
    monthlyPrice: 449,
    rating: 5.0,
    students: 210,
  },
  {
    id: "5",
    name: "James Park",
    avatar: "JP",
    bio: "Full-time equities swing trader. Price action purist with a systematic approach to finding high-probability setups.",
    experience: "5-8 years",
    instruments: ["Equities"],
    concepts: ["Price Action", "Supply & Demand"],
    session: "New York",
    monthlyPrice: 129,
    rating: 4.6,
    students: 54,
  },
  {
    id: "6",
    name: "Amina Hassan",
    avatar: "AH",
    bio: "Multi-asset trader covering forex and crypto. Combining ICT concepts with on-chain analysis for confluence-based entries.",
    experience: "3-5 years",
    instruments: ["Forex", "Crypto"],
    concepts: ["ICT", "Price Action", "Supply & Demand"],
    session: "Asian",
    monthlyPrice: 179,
    rating: 4.8,
    students: 83,
  },
];

const ALL_INSTRUMENTS = ["Futures", "Forex", "Crypto", "Equities"];
const ALL_CONCEPTS = ["ICT", "Order Flow", "Supply & Demand", "Price Action", "VWAP"];

const MentorCard = ({ mentor }: { mentor: Mentor }) => (
  <div className="group rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
    {/* Header */}
    <div className="flex items-start gap-4 mb-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-heading font-bold text-sm">
        {mentor.avatar}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-heading font-semibold text-foreground truncate">{mentor.name}</h3>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> {mentor.experience}
          </span>
          <span className="flex items-center gap-1 text-xs text-amber-400">
            <Star className="h-3 w-3 fill-current" /> {mentor.rating}
          </span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <span className="font-heading font-bold text-foreground">${mentor.monthlyPrice}</span>
        <span className="text-xs text-muted-foreground block">/month</span>
      </div>
    </div>

    {/* Bio */}
    <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">{mentor.bio}</p>

    {/* Tags */}
    <div className="flex flex-wrap gap-1.5 mb-4">
      {mentor.instruments.map((i) => (
        <span key={i} className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
          {i}
        </span>
      ))}
      {mentor.concepts.map((c) => (
        <span key={c} className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
          {c}
        </span>
      ))}
      <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        {mentor.session}
      </span>
    </div>

    {/* Footer */}
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{mentor.students} students</span>
      <Button size="sm" className="h-8 text-xs font-semibold">
        View Profile
      </Button>
    </div>
  </div>
);

const MentorListingPage = () => {
  const [search, setSearch] = useState("");
  const [activeInstrument, setActiveInstrument] = useState<string | null>(null);
  const [activeConcept, setActiveConcept] = useState<string | null>(null);

  const filtered = MENTORS.filter((m) => {
    const matchesSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.bio.toLowerCase().includes(search.toLowerCase());
    const matchesInstrument = !activeInstrument || m.instruments.includes(activeInstrument);
    const matchesConcept = !activeConcept || m.concepts.includes(activeConcept);
    return matchesSearch && matchesInstrument && matchesConcept;
  });

  const clearFilters = () => {
    setActiveInstrument(null);
    setActiveConcept(null);
    setSearch("");
  };

  const hasFilters = !!activeInstrument || !!activeConcept || !!search;

  return (
    <div className="min-h-screen bg-background">
      {/* Grid bg */}
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(hsl(160 84% 39% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(160 84% 39% / 0.3) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-3">
              <TrendingUp className="h-3.5 w-3.5" />
              Verified Mentors
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Find Your Mentor
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {MENTORS.length} verified traders ready to accelerate your edge.
            </p>
          </div>
          <Link to="/apply">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex text-xs">
              Become a Mentor
            </Button>
          </Link>
        </div>

        {/* Search & Filters */}
        <div className="space-y-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search mentors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Filter className="h-3 w-3" /> Instruments
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_INSTRUMENTS.map((inst) => (
                <button
                  key={inst}
                  onClick={() => setActiveInstrument(activeInstrument === inst ? null : inst)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    activeInstrument === inst
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {inst}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Filter className="h-3 w-3" /> Concepts
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_CONCEPTS.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveConcept(activeConcept === c ? null : c)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    activeConcept === c
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-primary hover:underline">
              Clear all filters
            </button>
          )}
        </div>

        {/* Results */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-sm">No mentors match your filters.</p>
              <button onClick={clearFilters} className="text-primary text-sm mt-2 hover:underline">
                Clear filters
              </button>
            </div>
          ) : (
            filtered.map((mentor) => <MentorCard key={mentor.id} mentor={mentor} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorListingPage;
