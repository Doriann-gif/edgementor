import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Clock, Users, MapPin, TrendingUp, CheckCircle2, MessageSquare } from "lucide-react";

interface Review {
  name: string;
  rating: number;
  date: string;
  text: string;
}

interface Mentor {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  fullBio: string;
  experience: string;
  instruments: string[];
  concepts: string[];
  session: string;
  monthlyPrice: number;
  rating: number;
  students: number;
  reviews: Review[];
  highlights: string[];
}

const MENTORS: Record<string, Mentor> = {
  "1": {
    id: "1", name: "Marcus Chen", avatar: "MC",
    bio: "Former prop trader turned educator.",
    fullBio: "After spending 8 years at a Chicago prop firm trading ES and NQ futures, I transitioned to full-time mentoring. My approach is rooted in order flow analysis and VWAP-based execution — no indicators, no guessing. I teach traders to read the tape and understand institutional positioning in real time. Every session is recorded, every trade is journaled, and every student gets direct feedback.",
    experience: "10+ years", instruments: ["Futures"], concepts: ["Order Flow", "VWAP"],
    session: "New York", monthlyPrice: 299, rating: 4.9, students: 142,
    highlights: ["Live trading room daily", "1-on-1 weekly calls", "Private Discord community", "Trade journal reviews"],
    reviews: [
      { name: "Alex T.", rating: 5, date: "2 weeks ago", text: "Marcus completely changed how I read the market. His order flow approach is methodical and repeatable. Best investment I've made in my trading career." },
      { name: "Jordan K.", rating: 5, date: "1 month ago", text: "The live trading sessions are incredible. Seeing Marcus execute in real time while explaining his thought process is invaluable." },
      { name: "Priya S.", rating: 4, date: "2 months ago", text: "Great content and community. The weekly 1-on-1s are worth the price alone. Only wish there were more Asian session coverage." },
    ],
  },
  "2": {
    id: "2", name: "Sarah Williams", avatar: "SW",
    bio: "ICT methodology expert.",
    fullBio: "I've been studying and trading ICT concepts since 2016 and have built a structured curriculum that takes traders from understanding basic market structure to executing precision entries using order blocks, fair value gaps, and liquidity sweeps. My focus is on GBP/USD and EUR/USD during London session, where institutional activity creates the cleanest setups.",
    experience: "8-10 years", instruments: ["Forex", "Futures"], concepts: ["ICT", "Price Action"],
    session: "London", monthlyPrice: 199, rating: 4.8, students: 98,
    highlights: ["Structured 12-week curriculum", "Daily markup reviews", "Backtesting workshops", "Community trade ideas"],
    reviews: [
      { name: "Mike R.", rating: 5, date: "1 week ago", text: "Sarah breaks down ICT concepts better than anyone. Her curriculum is structured perfectly for progressive learning." },
      { name: "Lisa D.", rating: 5, date: "3 weeks ago", text: "The daily markups are a game changer. Being able to see her analysis before London open gives me so much confidence." },
      { name: "Tom W.", rating: 4, date: "1 month ago", text: "Solid mentorship. The backtesting workshops really forced me to put in the screen time needed to internalize the concepts." },
    ],
  },
  "3": {
    id: "3", name: "David Okonkwo", avatar: "DO",
    bio: "Crypto native since 2017.",
    fullBio: "I entered crypto in 2017 and survived every cycle since. My edge comes from combining traditional supply and demand analysis with on-chain data and market structure. I focus primarily on BTC and ETH spot and perpetuals, trading the Asian session where crypto volatility peaks. My students learn to identify accumulation and distribution zones before the crowd.",
    experience: "5-8 years", instruments: ["Crypto", "Equities"], concepts: ["Supply & Demand", "Price Action"],
    session: "Asian", monthlyPrice: 149, rating: 4.7, students: 67,
    highlights: ["On-chain analysis integration", "Spot & perpetuals strategies", "Weekly market outlook", "Risk management framework"],
    reviews: [
      { name: "Nina C.", rating: 5, date: "2 weeks ago", text: "David's on-chain analysis combined with S&D is unique. Nobody else teaches this combination for crypto." },
      { name: "Sam B.", rating: 4, date: "1 month ago", text: "Great risk management framework. Lost a lot less during the last pullback thanks to David's position sizing rules." },
    ],
  },
  "4": {
    id: "4", name: "Elena Petrova", avatar: "EP",
    bio: "Institutional background with Goldman Sachs.",
    fullBio: "After 12 years on the institutional side — first at Goldman Sachs, then at a multi-strategy hedge fund — I now teach retail traders how to think and execute like professionals. My methodology combines order flow reading with ICT concepts and VWAP-based intraday strategies. I focus on ES, NQ, and major forex pairs during the London-NY overlap, where liquidity is deepest.",
    experience: "10+ years", instruments: ["Futures", "Forex", "Equities"], concepts: ["Order Flow", "VWAP", "ICT"],
    session: "London", monthlyPrice: 449, rating: 5.0, students: 210,
    highlights: ["Institutional-grade analysis", "Portfolio-level thinking", "Multi-asset strategies", "Monthly performance reviews"],
    reviews: [
      { name: "Chris H.", rating: 5, date: "1 week ago", text: "Elena's institutional perspective is unmatched. She explains WHY the market moves, not just where it might go." },
      { name: "Amanda L.", rating: 5, date: "2 weeks ago", text: "The monthly performance reviews keep me accountable. Elena doesn't let you get lazy with your process." },
      { name: "Raj P.", rating: 5, date: "1 month ago", text: "Worth every penny. The quality of analysis and mentorship is on a completely different level." },
    ],
  },
  "5": {
    id: "5", name: "James Park", avatar: "JP",
    bio: "Full-time equities swing trader.",
    fullBio: "I trade US equities exclusively, focusing on swing trades lasting 3-10 days. My approach is pure price action — no indicators, no algorithms. I look for clean chart patterns at key supply and demand levels with volume confirmation. Simple, repeatable, profitable. My mentorship is designed for traders who want a systematic approach without the complexity.",
    experience: "5-8 years", instruments: ["Equities"], concepts: ["Price Action", "Supply & Demand"],
    session: "New York", monthlyPrice: 129, rating: 4.6, students: 54,
    highlights: ["Swing trade watchlists", "Weekend prep sessions", "Pattern recognition drills", "Trade plan templates"],
    reviews: [
      { name: "Derek M.", rating: 5, date: "3 weeks ago", text: "James keeps it simple and that's exactly what I needed. His weekend prep sessions set me up for the whole week." },
      { name: "Katie F.", rating: 4, date: "2 months ago", text: "Great for swing traders. The watchlists and trade plan templates save me hours of work each week." },
    ],
  },
  "6": {
    id: "6", name: "Amina Hassan", avatar: "AH",
    bio: "Multi-asset trader covering forex and crypto.",
    fullBio: "I trade the intersection of forex and crypto markets, using ICT concepts as my primary framework supplemented by on-chain analysis for crypto and COT data for forex. Trading the Asian session gives me an edge on moves that European and US traders often miss. My mentorship focuses on building confluence — stacking multiple factors to find the highest-probability setups across any market.",
    experience: "3-5 years", instruments: ["Forex", "Crypto"], concepts: ["ICT", "Price Action", "Supply & Demand"],
    session: "Asian", monthlyPrice: 179, rating: 4.8, students: 83,
    highlights: ["Multi-asset confluence setups", "Asian session specialization", "COT data analysis", "Bi-weekly group coaching"],
    reviews: [
      { name: "Leo W.", rating: 5, date: "1 week ago", text: "Amina's confluence approach is brilliant. Combining ICT with on-chain data gives setups I can't find anywhere else." },
      { name: "Suki T.", rating: 5, date: "1 month ago", text: "Finally a mentor who trades the Asian session! The group coaching calls are always packed with value." },
      { name: "Brian N.", rating: 4, date: "2 months ago", text: "Good mentorship overall. The multi-asset approach takes time to learn but it's worth the effort." },
    ],
  },
};

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} className={`h-3.5 w-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
    ))}
  </div>
);

const MentorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const mentor = id ? MENTORS[id] : null;

  if (!mentor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Mentor not found.</p>
          <Link to="/"><Button variant="outline" size="sm">Back to listing</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(hsl(160 84% 39% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(160 84% 39% / 0.3) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> All Mentors
        </Link>

        {/* Profile Header */}
        <div className="rounded-2xl border border-border bg-card p-6 mb-4">
          <div className="flex items-start gap-4 mb-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-heading font-bold text-lg">
              {mentor.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-heading text-xl font-bold text-foreground">{mentor.name}</h1>
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{mentor.experience}</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{mentor.students} students</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{mentor.session} session</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <StarRating rating={Math.round(mentor.rating)} />
                <span className="text-xs text-muted-foreground">{mentor.rating}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {mentor.instruments.map((i) => (
              <span key={i} className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{i}</span>
            ))}
            {mentor.concepts.map((c) => (
              <span key={c} className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">{c}</span>
            ))}
          </div>

          {/* Bio */}
          <p className="text-sm text-muted-foreground leading-relaxed">{mentor.fullBio}</p>
        </div>

        {/* What's Included */}
        <div className="rounded-2xl border border-border bg-card p-6 mb-4">
          <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> What's Included
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mentor.highlights.map((h) => (
              <div key={h} className="flex items-center gap-2.5 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-foreground">{h}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="rounded-2xl border border-border bg-card p-6 mb-4">
          <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> Reviews ({mentor.reviews.length})
          </h2>
          <div className="space-y-5">
            {mentor.reviews.map((review, idx) => (
              <div key={idx} className={idx < mentor.reviews.length - 1 ? "pb-5 border-b border-border" : ""}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                      {review.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <span className="text-sm font-medium text-foreground">{review.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{review.date}</span>
                </div>
                <StarRating rating={review.rating} />
                <p className="text-sm text-muted-foreground leading-relaxed mt-2">{review.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sticky Subscribe Bar */}
        <div className="sticky bottom-4 rounded-2xl border border-border bg-card/95 backdrop-blur-sm p-4 flex items-center justify-between shadow-xl shadow-black/30">
          <div>
            <span className="font-heading text-2xl font-bold text-foreground">${mentor.monthlyPrice}</span>
            <span className="text-sm text-muted-foreground">/month</span>
          </div>
          <Button className="h-11 px-6 font-semibold">
            Subscribe Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MentorProfile;
