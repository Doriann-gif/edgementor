import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Clock, Users, MapPin, TrendingUp, CheckCircle2, MessageSquare, Heart, Crown, ChevronRight } from "lucide-react";
import { useMentor, useMentorReviews } from "@/hooks/use-mentors";
import { useSavedMentors, useToggleSaveMentor } from "@/hooks/use-student";
import { useIsSubscribed } from "@/hooks/use-mentor-content";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import TierBadge from "@/components/TierBadge";
import { motion } from "framer-motion";

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} className={`h-3.5 w-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
    ))}
  </div>
);

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

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
        <motion.p
          className="text-muted-foreground text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          Loading...
        </motion.p>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <p className="text-muted-foreground mb-4">Mentor not found.</p>
          <Link to="/mentors"><Button variant="outline" size="sm">Back to listing</Button></Link>
        </motion.div>
      </div>
    );
  }

  const tier = (mentor as any).tier || "verified";
  const isElite = tier === "elite";

  return (
    <div className={`min-h-screen ${isElite ? "bg-slate-950" : "bg-background"}`}>
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {isElite ? (
          <>
            <div className="absolute inset-0 opacity-[0.06]" style={{
              backgroundImage: 'linear-gradient(hsl(220 20% 40% / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(220 20% 40% / 0.4) 1px, transparent 1px)',
              backgroundSize: '60px 60px'
            }} />
            <motion.div
              className="absolute top-[-100px] left-1/3 w-[500px] h-[500px] bg-slate-400/[0.03] rounded-full blur-[120px]"
              animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        ) : (
          <>
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(160 84% 39% / 0.3) 1px, transparent 0)',
              backgroundSize: '48px 48px'
            }} />
            <motion.div
              className="absolute top-[-100px] right-1/4 w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[130px]"
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-[-100px] left-1/4 w-[400px] h-[400px] bg-pink-400/[0.025] rounded-full blur-[100px]"
              animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        )}
      </div>

      <motion.div
        className="relative max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10"
        initial="hidden"
        animate="show"
        variants={stagger}
      >
        <motion.div variants={fadeUp}>
          <Link to="/mentors" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> All Mentors
          </Link>
        </motion.div>

        {/* Main Card */}
        <motion.div
          variants={fadeUp}
          className={`relative rounded-2xl border p-6 mb-4 ${
            isElite
              ? "border-slate-600/50 bg-gradient-to-br from-slate-900 via-slate-800/50 to-slate-900"
              : "border-border bg-card"
          }`}
        >
          {isElite && (
            <>
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-slate-400/60 to-transparent" />
              <motion.div
                className="absolute -top-3 left-1/2 -translate-x-1/2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 border border-slate-500/40 px-3 py-1 text-xs font-semibold text-slate-200 shadow-[0_0_16px_rgba(203,213,225,0.2)]">
                  <Crown className="h-3.5 w-3.5 drop-shadow-[0_0_8px_rgba(203,213,225,0.6)]" /> ELITE MENTOR
                </span>
              </motion.div>
            </>
          )}

          <div className="flex items-start gap-4 mb-5 mt-1">
            <motion.div
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl font-heading font-bold text-lg ${
                isElite ? "bg-slate-700/50 text-slate-200" : "bg-gradient-to-br from-primary/15 to-pink-400/10 text-primary"
              }`}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {mentor.avatar}
            </motion.div>
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
            {mentor.instruments.map((i, idx) => (
              <motion.span
                key={i}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${isElite ? "bg-slate-700/50 text-slate-300" : "bg-primary/10 text-primary"}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + idx * 0.05 }}
              >
                {i}
              </motion.span>
            ))}
            {mentor.concepts.map((c, idx) => (
              <motion.span
                key={c}
                className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + idx * 0.05 }}
              >
                {c}
              </motion.span>
            ))}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{mentor.full_bio}</p>
        </motion.div>

        {/* What's Included */}
        <motion.div
          variants={fadeUp}
          className={`rounded-2xl border p-6 mb-4 ${isElite ? "border-slate-600/50 bg-slate-900/80" : "border-border bg-card"}`}
        >
          <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className={`h-4 w-4 ${isElite ? "text-slate-300" : "text-primary"}`} /> What's Included
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mentor.highlights.map((h, i) => (
              <motion.div
                key={h}
                className="flex items-center gap-2.5 text-sm"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.06, duration: 0.35 }}
              >
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${isElite ? "text-slate-300" : "text-primary"}`} />
                <span className="text-foreground">{h}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Reviews */}
        <motion.div
          variants={fadeUp}
          className={`rounded-2xl border p-6 mb-4 ${isElite ? "border-slate-600/50 bg-slate-900/80" : "border-border bg-card"}`}
        >
          <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <MessageSquare className={`h-4 w-4 ${isElite ? "text-slate-300" : "text-primary"}`} /> Reviews ({reviews.length})
          </h2>
          <div className="space-y-5">
            {reviews.map((review, idx) => (
              <motion.div
                key={review.id}
                className={idx < reviews.length - 1 ? "pb-5 border-b border-border" : ""}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.06, duration: 0.35 }}
              >
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
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Sticky Subscribe Bar */}
        <motion.div
          className={`sticky bottom-4 rounded-2xl border backdrop-blur-sm p-4 flex items-center justify-between shadow-xl ${
            isElite
              ? "border-slate-600/50 bg-slate-900/95 shadow-slate-900/50"
              : "border-border bg-card/95 shadow-black/30"
          }`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5, type: "spring", stiffness: 200 }}
        >
          <div>
            <span className="font-heading text-2xl font-bold text-foreground">${mentor.monthly_price}</span>
            <span className="text-sm text-muted-foreground">/month</span>
          </div>
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button variant="outline" size="icon" className="h-11 w-11" onClick={handleSave} disabled={toggleSave.isPending}>
                <Heart className={`h-5 w-5 transition-colors ${isSaved ? "fill-pink-400 text-pink-400" : ""}`} />
              </Button>
            </motion.div>
            {isSubscribed ? (
              <Link to={`/mentorship/${mentor.id}`}>
                <motion.div whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                  <Button className={`h-11 px-6 font-semibold ${isElite ? "bg-slate-200 text-slate-900 hover:bg-white" : "shadow-lg shadow-primary/20"}`}>
                    <Crown className="h-4 w-4 mr-2" /> Access Mentorship
                  </Button>
                </motion.div>
              </Link>
            ) : (
              <Link to={`/subscribe/${mentor.id}`}>
                <motion.div whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                  <Button className={`h-11 px-6 font-semibold ${isElite ? "bg-slate-200 text-slate-900 hover:bg-white" : "shadow-lg shadow-primary/20"}`}>
                    Subscribe Now <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </motion.div>
              </Link>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MentorProfile;
