import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TrendingUp, Search, Star, Clock, SlidersHorizontal, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useMentors } from "@/hooks/use-mentors";
import type { Mentor } from "@/types/mentor";

const ALL_INSTRUMENTS = ["Futures", "Forex", "Crypto", "Options"];
const ALL_CONCEPTS = ["ICT", "Order Flow", "Price Action", "Patterns"];

const MentorCard = ({ mentor }: { mentor: Mentor }) => (
  <div className="group rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
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
        <span className="font-heading font-bold text-foreground">${mentor.monthly_price}</span>
        <span className="text-xs text-muted-foreground block">/month</span>
      </div>
    </div>
    <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">{mentor.bio}</p>
    <div className="flex flex-wrap gap-1.5 mb-4">
      {mentor.instruments.map((i) => (
        <span key={i} className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{i}</span>
      ))}
      {mentor.concepts.map((c) => (
        <span key={c} className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">{c}</span>
      ))}
      <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{mentor.session}</span>
    </div>
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{mentor.students} students</span>
      <Link to={`/mentor/${mentor.id}`}>
        <Button size="sm" className="h-8 text-xs font-semibold">View Profile</Button>
      </Link>
    </div>
  </div>
);

const MentorListingPage = () => {
  const [search, setSearch] = useState("");
  const [activeInstruments, setActiveInstruments] = useState<string[]>([]);
  const [activeConcepts, setActiveConcepts] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number]>([500]);
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

        <div className="flex items-center gap-3 mb-8">
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

              {/* Price slider */}
              <div className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground">Max Price: ${priceRange[0]}/mo</label>
                <Slider value={priceRange} onValueChange={(v) => setPriceRange(v as [number])} min={10} max={500} step={10} />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>$10</span><span>$500</span>
                </div>
              </div>

              {/* Concepts */}
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

              {/* Instruments */}
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

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-16 text-muted-foreground"><p className="text-sm">Loading mentors...</p></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-sm">No mentors match your filters.</p>
              <button onClick={clearFilters} className="text-primary text-sm mt-2 hover:underline">Clear filters</button>
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
