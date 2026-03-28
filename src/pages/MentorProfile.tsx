import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Clock, Users, MapPin, TrendingUp, CheckCircle2, MessageSquare, Heart, Crown } from "lucide-react";
import { useMentor, useMentorReviews } from "@/hooks/use-mentors";
import { useSavedMentors, useToggleSaveMentor } from "@/hooks/use-student";
import { useIsSubscribed } from "@/hooks/use-mentor-content";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import TierBadge from "@/components/TierBadge";

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} className={`h-3.5 w-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
    ))}
  </div>
);

const MentorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { data: mentor, isLoading } = useMentor(id);
  const { data: reviews = [] } = useMentorReviews(id);
  const { user } = useAuth();
  const { data: savedMentorIds } = useSavedMentors();
  const { data: isSubscribed } = useIsSubscribed(id);
  const toggleSave = useToggleSaveMentor();
  const isSaved = id ? savedMentorIds?.has(id) ?? false : false;

  const handleSave = () => {
    if (!user) { toast.error("Sign in to save mentors"); return; }
    if (!id) return;
    toggleSave.mutate({ mentorId: id, isSaved });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Mentor not found.</p>
          <Link to="/mentors"><Button variant="outline" size="sm">Back to listing</Button></Link>
        </div>
      </div>
    );
  }

  const tier = (mentor as any).tier || "verified";
  const isElite = tier === "elite";

  return (
    <div className={`min-h-screen ${isElite ? "bg-slate-950" : "bg-background"}`}>
      {isElite ? (
        <div className="fixed inset-0 opacity-[0.06]" style={{
          backgroundImage: 'linear-gradient(hsl(220 20% 40% / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(220 20% 40% / 0.4) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      ) : (
        <div className="fixed inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(hsl(160 84% 39% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(160 84% 39% / 0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      )}

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Link to="/mentors" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> All Mentors
        </Link>

        {/* Main Card */}
        <div className={`relative rounded-2xl border p-6 mb-4 ${
          isElite
            ? "border-slate-600/50 bg-gradient-to-br from-slate-900 via-slate-800/50 to-slate-900"
            : "border-border bg-card"
        }`}>
          {isElite && (
            <>
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-slate-400/60 to-transparent" />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 border border-slate-500/40 px-3 py-1 text-xs font-semibold text-slate-200 shadow-[0_0_16px_rgba(203,213,225,0.2)]">
                  <Crown className="h-3.5 w-3.5 drop-shadow-[0_0_8px_rgba(203,213,225,0.6)]" /> ELITE MENTOR
                </span>
              </div>
            </>
          )}

          <div className="flex items-start gap-4 mb-5 mt-1">
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl font-heading font-bold text-lg ${
              isElite ? "bg-slate-700/50 text-slate-200" : "bg-primary/10 text-primary"
            }`}>
              {mentor.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-heading text-xl font-bold text-foreground">{mentor.name}</h1>
                <TierBadge tier={tier} size="md" showLabel={false} />
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <TierBadge tier={tier} size="sm" />
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
          <div className="flex flex-wrap gap-1.5 mb-5">
            {mentor.instruments.map((i) => (
              <span key={i} className={`rounded-md px-2.5 py-1 text-xs font-medium ${isElite ? "bg-slate-700/50 text-slate-300" : "bg-primary/10 text-primary"}`}>{i}</span>
            ))}
            {mentor.concepts.map((c) => (
              <span key={c} className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">{c}</span>
            ))}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{mentor.full_bio}</p>
        </div>

        <div className={`rounded-2xl border p-6 mb-4 ${isElite ? "border-slate-600/50 bg-slate-900/80" : "border-border bg-card"}`}>
          <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className={`h-4 w-4 ${isElite ? "text-slate-300" : "text-primary"}`} /> What's Included
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mentor.highlights.map((h) => (
              <div key={h} className="flex items-center gap-2.5 text-sm">
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${isElite ? "text-slate-300" : "text-primary"}`} />
                <span className="text-foreground">{h}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-2xl border p-6 mb-4 ${isElite ? "border-slate-600/50 bg-slate-900/80" : "border-border bg-card"}`}>
          <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <MessageSquare className={`h-4 w-4 ${isElite ? "text-slate-300" : "text-primary"}`} /> Reviews ({reviews.length})
          </h2>
          <div className="space-y-5">
            {reviews.map((review, idx) => (
              <div key={review.id} className={idx < reviews.length - 1 ? "pb-5 border-b border-border" : ""}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                      {review.reviewer_name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <span className="text-sm font-medium text-foreground">{review.reviewer_name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{review.review_date}</span>
                </div>
                <StarRating rating={review.rating} />
                <p className="text-sm text-muted-foreground leading-relaxed mt-2">{review.review_text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={`sticky bottom-4 rounded-2xl border backdrop-blur-sm p-4 flex items-center justify-between shadow-xl ${
          isElite
            ? "border-slate-600/50 bg-slate-900/95 shadow-slate-900/50"
            : "border-border bg-card/95 shadow-black/30"
        }`}>
          <div>
            <span className="font-heading text-2xl font-bold text-foreground">${mentor.monthly_price}</span>
            <span className="text-sm text-muted-foreground">/month</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-11 w-11" onClick={handleSave} disabled={toggleSave.isPending}>
              <Heart className={`h-5 w-5 ${isSaved ? "fill-pink-400 text-pink-400" : ""}`} />
            </Button>
            {isSubscribed ? (
              <Link to={`/mentorship/${mentor.id}`}>
                <Button className={`h-11 px-6 font-semibold ${isElite ? "bg-slate-200 text-slate-900 hover:bg-white" : ""}`}>
                  <Crown className="h-4 w-4 mr-2" /> Access Mentorship
                </Button>
              </Link>
            ) : (
              <Link to={`/subscribe/${mentor.id}`}>
                <Button className={`h-11 px-6 font-semibold ${isElite ? "bg-slate-200 text-slate-900 hover:bg-white" : ""}`}>Subscribe Now</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorProfile;
