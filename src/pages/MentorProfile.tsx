import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Star, Clock, Users, MapPin, Globe, TrendingUp,
  CheckCircle2, MessageSquare, Heart, Crown, ChevronRight,
  Sparkles, Shield, Award, Send, ImageIcon, ExternalLink,
} from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useMentor, useMentorReviews, useFeaturedMentors } from "@/hooks/use-mentors";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSavedMentors, useToggleSaveMentor } from "@/hooks/use-student";
import { useIsSubscribed } from "@/hooks/use-mentor-content";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import TierBadge from "@/components/TierBadge";
import PageTransition from "@/components/PageTransition";
import { motion } from "framer-motion";

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <div key={s}>
        <Star className={`h-4 w-4 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
      </div>
    ))}
  </div>
);

const InteractiveStarRating = ({ rating, onChange }: { rating: number; onChange: (r: number) => void }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <button key={s} type="button" onClick={() => onChange(s)} className="p-0.5 hover:scale-125 transition-transform">
        <Star className={`h-6 w-6 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30 hover:text-amber-400/50"}`} />
      </button>
    ))}
  </div>
);

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

/** Determine social platform from URL */
const getSocialPlatform = (url: string) => {
  const lower = url.toLowerCase();
  if (lower.includes("tiktok")) return { label: "TikTok", icon: "tiktok" };
  if (lower.includes("instagram")) return { label: "Instagram", icon: "instagram" };
  if (lower.includes("youtube")) return { label: "YouTube", icon: "youtube" };
  if (lower.includes("twitter") || lower.includes("x.com")) return { label: "X / Twitter", icon: "twitter" };
  if (lower.includes("discord")) return { label: "Discord", icon: "discord" };
  if (lower.includes("telegram")) return { label: "Telegram", icon: "telegram" };
  return { label: "Social", icon: "link" };
};

const SocialButton = ({ url, isElite }: { url: string; isElite: boolean }) => {
  const platform = getSocialPlatform(url);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
        isElite
          ? "border-slate-500/40 bg-slate-800/60 text-slate-200 hover:bg-slate-700/60 hover:border-slate-400/50"
          : "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50 hover:shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
      }`}
    >
      <ExternalLink className="h-4 w-4" />
      {platform.label}
    </a>
  );
};

const MentorNotFound = () => {
  const { data: suggested = [] } = useFeaturedMentors();
  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div className="max-w-md w-full text-center space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <motion.div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto" animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <Search className="h-8 w-8 text-muted-foreground/40" />
          </motion.div>
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground mb-2">Mentor not found</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">This mentor profile doesn't exist or may have been removed. Browse our top-rated mentors instead.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/mentors"><Button variant="glow" size="sm" className="font-semibold"><Users className="h-4 w-4 mr-1.5" /> Browse All Mentors</Button></Link>
            <Link to="/"><Button variant="outline" size="sm">Back to Home</Button></Link>
          </div>
          {suggested.length > 0 && (
            <div className="pt-4 border-t border-border/50">
              <p className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wider">Suggested Mentors</p>
              <div className="space-y-3">
                {suggested.slice(0, 3).map((m) => (
                  <Link key={m.id} to={`/mentor/${m.id}`}>
                    <motion.div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/30 transition-colors text-left" whileHover={{ y: -2 }}>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-heading font-bold text-sm">{m.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <span className="font-heading font-semibold text-sm text-foreground block truncate">{m.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-0.5 text-xs text-amber-500"><Star className="h-3 w-3 fill-current" /> {m.rating}</span>
                          <span className="text-xs text-muted-foreground">{m.students} students</span>
                          <span className="text-xs text-muted-foreground">${m.monthly_price}/mo</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
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
  const reduced = useReducedMotion();
  const queryClient = useQueryClient();

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [showAllImages, setShowAllImages] = useState(false);

  const hasReviewed = reviews.some((r: any) => r.user_id === user?.id);

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error("Not authenticated");
      if (!reviewText.trim()) throw new Error("Please write a review");
      const profile = await supabase.from("profiles").select("display_name").eq("id", user.id).single();
      const displayName = profile.data?.display_name || user.email?.split("@")[0] || "Student";
      const { error } = await supabase.from("mentor_reviews").insert({
        mentor_id: id,
        user_id: user.id,
        rating: reviewRating,
        reviewer_name: displayName,
        review_date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        review_text: reviewText.trim(),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentor-reviews", id] });
      queryClient.invalidateQueries({ queryKey: ["mentor", id] });
      setReviewText("");
      setReviewRating(5);
      toast.success("Review submitted! Thank you.");
    },
    onError: (err: any) => toast.error(err.message || "Failed to submit review"),
  });

  const { data: showcaseImages = [] } = useQuery({
    queryKey: ["mentor-showcase-images", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentor_showcase_images")
        .select("*")
        .eq("mentor_id", id!)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const handleSave = () => {
    if (!user) { toast.error("Sign in to save mentors"); return; }
    if (!id) return;
    toggleSave.mutate({ mentorId: id, isSaved });
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-5">
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6">
              <div className="flex items-start gap-5">
                <div className="h-20 w-20 shrink-0 rounded-2xl bg-muted animate-pulse" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 w-48 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                  <div className="flex gap-4">
                    <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[1,2,3,4,5].map(i => <div key={i} className="h-7 rounded-lg bg-muted animate-pulse" style={{ width: `${60 + i * 12}px` }} />)}
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-muted animate-pulse" />
                <div className="h-3 w-full rounded bg-muted animate-pulse" />
                <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[1,2,3].map(i => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4 flex flex-col items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-muted animate-pulse" />
                  <div className="h-5 w-10 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-14 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!mentor) return <MentorNotFound />;

  const tier = (mentor as any).tier || "verified";
  const isElite = tier === "elite";
  const socialLink = (mentor as any).social_link;

  return (
    <PageTransition>
    <div className={`min-h-screen ${isElite ? "bg-slate-950" : "bg-background"}`}>
      <Helmet>
        <title>{`${mentor.name} — Trading Mentor | EdgeMentor`}</title>
        <meta name="description" content={`Learn from ${mentor.name}. ${mentor.bio} ${mentor.instruments?.join(", ")} mentor with ${mentor.students} students.`} />
        <link rel="canonical" href={`https://edgementor.lovable.app/mentor/${id}`} />
        <meta property="og:title" content={`${mentor.name} — Trading Mentor | EdgeMentor`} />
        <meta property="og:description" content={mentor.bio} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={`https://edgementor.lovable.app/mentor/${id}`} />
        {mentor.avatar && <meta property="og:image" content={mentor.avatar} />}
        <meta property="og:site_name" content="EdgeMentor" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${mentor.name} — Trading Mentor`} />
        <meta name="twitter:description" content={mentor.bio} />
        {mentor.avatar && <meta name="twitter:image" content={mentor.avatar} />}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          "name": mentor.name,
          "description": mentor.bio,
          "image": mentor.avatar,
          "jobTitle": "Trading Mentor",
          ...(mentor.country ? { "nationality": mentor.country } : {}),
          "url": `https://edgementor.lovable.app/mentor/${id}`,
          "memberOf": { "@type": "Organization", "name": "EdgeMentor", "url": "https://edgementor.lovable.app" },
          ...(reviews.length > 0 ? {
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": mentor.rating,
              "reviewCount": reviews.length,
              "bestRating": 5
            }
          } : {})
        })}</script>
      </Helmet>

      {/* Subtle ambient background */}
      {!reduced && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {isElite ? (
            <motion.div
              className="absolute top-[-100px] left-1/3 w-[500px] h-[500px] bg-slate-400/[0.03] rounded-full blur-[120px]"
              animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
          ) : (
            <motion.div
              className="absolute top-[-80px] right-1/4 w-[500px] h-[500px] bg-primary/[0.03] rounded-full blur-[130px]"
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>
      )}

      <motion.div
        className="relative max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10"
        initial="hidden"
        animate="show"
        variants={stagger}
      >
        {/* Back link */}
        <motion.div variants={fadeUp}>
          <Link to="/mentors" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6 group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="group-hover:underline">All Mentors</span>
          </Link>
        </motion.div>

        {/* ===== HERO CARD ===== */}
        <motion.div
          variants={scaleIn}
          className={`relative rounded-2xl border overflow-hidden mb-6 ${
            isElite
              ? "border-slate-600/50 bg-gradient-to-br from-slate-900 via-slate-800/50 to-slate-900"
              : "border-border bg-card"
          }`}
        >
          {/* Banner */}
          <div
            className="h-28 sm:h-36 w-full relative"
            style={{ background: `linear-gradient(135deg, ${(mentor as any).banner_color || "#6d28d9"}, ${(mentor as any).banner_color || "#6d28d9"}dd)` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            {isElite && (
              <motion.div
                className="absolute top-4 right-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 backdrop-blur-sm border border-slate-500/40 px-3 py-1 text-xs font-semibold text-slate-200 shadow-lg">
                  <Crown className="h-3.5 w-3.5" /> ELITE
                </span>
              </motion.div>
            )}
          </div>

          {/* Content */}
          <div className="px-6 sm:px-8 pb-6 sm:pb-8">
            {/* Avatar — overlapping the banner */}
            <div className="flex items-end gap-5 -mt-10 mb-5">
              <motion.div
                className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl font-heading font-bold text-xl shadow-xl ring-4 ${
                  isElite
                    ? "bg-slate-700 text-slate-200 ring-slate-900"
                    : "bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-card"
                }`}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {mentor.avatar}
              </motion.div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-heading text-2xl font-bold text-foreground">{mentor.name}</h1>
                  <TierBadge tier={tier} size="md" showLabel={false} />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <TierBadge tier={tier} size="sm" />
                </div>
              </div>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground mb-5">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary/60" />{mentor.experience}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary/60" />{mentor.students} students
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary/60" />{mentor.session} session
              </span>
              {mentor.country && (
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-primary/60" />{mentor.country}
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-5">
              <StarRating rating={Math.round(mentor.rating)} />
              <span className="text-sm font-bold text-foreground">{mentor.rating}</span>
              <span className="text-xs text-muted-foreground">({reviews.length} {reviews.length === 1 ? "review" : "reviews"})</span>
            </div>

            {/* Social link button */}
            {socialLink && (
              <div className="mb-5">
                <SocialButton url={socialLink} isElite={isElite} />
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {mentor.instruments.map((i, idx) => (
                <motion.span
                  key={i}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${isElite ? "bg-slate-700/50 text-slate-300 border border-slate-600/30" : "bg-primary/10 text-primary border border-primary/10"}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + idx * 0.04 }}
                >
                  {i}
                </motion.span>
              ))}
              {mentor.concepts.map((c, idx) => (
                <motion.span
                  key={c}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${isElite ? "bg-slate-800/50 text-slate-400 border border-slate-700/30" : "bg-secondary text-secondary-foreground border border-border"}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 + idx * 0.04 }}
                >
                  {c}
                </motion.span>
              ))}
            </div>

            {/* Bio */}
            <div className={`text-sm leading-relaxed ${isElite ? "text-slate-400" : "text-muted-foreground"}`}>
              {mentor.full_bio}
            </div>
          </div>
        </motion.div>

        {/* ===== STATS ===== */}
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Students", value: mentor.students, icon: Users },
            { label: "Rating", value: mentor.rating, icon: Star },
            { label: "Experience", value: mentor.experience, icon: Award },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className={`rounded-2xl border p-5 text-center ${isElite ? "border-slate-600/50 bg-slate-900/80" : "border-border bg-card"}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl mx-auto mb-2.5 ${
                i === 0 ? "text-primary bg-primary/10" :
                i === 1 ? "text-amber-400 bg-amber-400/10" :
                "text-pink-400 bg-pink-400/10"
              }`}>
                <stat.icon className="h-4.5 w-4.5" />
              </div>
              <p className="font-heading text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ===== WHAT'S INCLUDED ===== */}
        <motion.div
          variants={fadeUp}
          className={`rounded-2xl border p-6 sm:p-8 mb-6 ${isElite ? "border-slate-600/50 bg-slate-900/80" : "border-border bg-card"}`}
        >
          <h2 className="font-heading text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
            <CheckCircle2 className={`h-5 w-5 ${isElite ? "text-slate-300" : "text-primary"}`} />
            What's Included
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mentor.highlights.map((h, i) => (
              <motion.div
                key={h}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${
                  isElite ? "bg-slate-800/40" : "bg-muted/50"
                }`}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05, duration: 0.4 }}
              >
                <TrendingUp className={`h-4 w-4 shrink-0 ${isElite ? "text-slate-400" : "text-primary"}`} />
                <span className="text-foreground font-medium">{h}</span>
              </motion.div>
            ))}
          </div>

          {/* Showcase Images */}
          {showcaseImages.length > 0 && (
            <div className="mt-6 pt-5 border-t border-border/50">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(showAllImages ? showcaseImages : showcaseImages.slice(0, 3)).map((img: any, i: number) => (
                  <motion.div
                    key={img.id}
                    className="rounded-xl overflow-hidden border border-border aspect-video bg-muted"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.05, duration: 0.4 }}
                  >
                    <img src={img.image_url} alt={img.caption || "Showcase"} className="w-full h-full object-cover" />
                  </motion.div>
                ))}
              </div>
              {showcaseImages.length > 3 && !showAllImages && (
                <button
                  onClick={() => setShowAllImages(true)}
                  className="mt-4 w-full rounded-xl border border-border bg-muted/50 hover:bg-muted py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
                >
                  <ImageIcon className="h-4 w-4" />
                  See all {showcaseImages.length} photos
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* ===== REVIEWS ===== */}
        <motion.div
          variants={fadeUp}
          className={`rounded-2xl border p-6 sm:p-8 mb-6 ${isElite ? "border-slate-600/50 bg-slate-900/80" : "border-border bg-card"}`}
        >
          <h2 className="font-heading text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
            <MessageSquare className={`h-5 w-5 ${isElite ? "text-slate-300" : "text-primary"}`} />
            Reviews
            <span className="ml-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{reviews.length}</span>
          </h2>

          {/* Review Submission */}
          {isSubscribed && user && !hasReviewed && (
            <motion.div
              className={`rounded-xl border p-5 mb-6 ${isElite ? "border-slate-600/30 bg-slate-800/30" : "border-primary/15 bg-primary/[0.02]"}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="font-heading font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Leave a Review
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Your rating</p>
                  <InteractiveStarRating rating={reviewRating} onChange={setReviewRating} />
                </div>
                <Textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this mentor..."
                  className="bg-muted border-border text-sm min-h-[80px] resize-none"
                  maxLength={500}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{reviewText.length}/500</span>
                  <Button
                    size="sm"
                    onClick={() => submitReviewMutation.mutate()}
                    disabled={submitReviewMutation.isPending || !reviewText.trim()}
                    className="text-xs font-semibold"
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {hasReviewed && (
            <div className={`rounded-xl border p-4 mb-6 flex items-center gap-2 ${isElite ? "border-slate-600/30 bg-slate-800/30" : "border-primary/15 bg-primary/[0.02]"}`}>
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">You've already reviewed this mentor. Thank you!</p>
            </div>
          )}

          {reviews.length === 0 ? (
            <motion.div className="text-center py-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Sparkles className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No reviews yet. Be the first to subscribe!</p>
            </motion.div>
          ) : (
            <div className="space-y-0">
              {reviews.map((review, idx) => (
                <motion.div
                  key={review.id}
                  className={`py-5 ${idx < reviews.length - 1 ? "border-b border-border/50" : ""}`}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05, duration: 0.4 }}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        isElite ? "bg-slate-700/50 text-slate-300" : "bg-primary/10 text-primary"
                      }`}>
                        {review.reviewer_name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-foreground block">{review.reviewer_name}</span>
                        <span className="text-xs text-muted-foreground">{review.review_date}</span>
                      </div>
                    </div>
                    <StarRating rating={review.rating} />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed pl-12">{review.review_text}</p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ===== STICKY SUBSCRIBE BAR ===== */}
        <motion.div
          className={`sticky bottom-4 rounded-2xl border backdrop-blur-md p-5 flex items-center justify-between shadow-2xl z-10 ${
            isElite
              ? "border-slate-600/50 bg-slate-900/95 shadow-slate-900/50"
              : "border-border/80 bg-card/95 shadow-black/20"
          }`}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, type: "spring", stiffness: 200 }}
        >
          <div>
            <motion.span
              className="font-heading text-3xl font-bold text-foreground"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, type: "spring" }}
            >
              ${mentor.monthly_price}
            </motion.span>
            <span className="text-sm text-muted-foreground">/month</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className={`h-12 w-12 rounded-xl ${isElite ? "border-slate-600/50 hover:bg-slate-800" : "border-border hover:border-primary/30"}`}
              onClick={handleSave}
              disabled={toggleSave.isPending}
            >
              <Heart className={`h-5 w-5 transition-all ${isSaved ? "fill-pink-400 text-pink-400 scale-110" : "text-muted-foreground hover:text-pink-400"}`} />
            </Button>
            {isSubscribed ? (
              <Link to={`/mentorship/${mentor.id}`}>
                <Button variant="glow" className={`h-12 px-8 font-semibold text-base ${isElite ? "bg-slate-200 text-slate-900 hover:bg-white" : ""}`}>
                  <Crown className="h-4 w-4 mr-2" /> Access Mentorship
                </Button>
              </Link>
            ) : (
              <Link to={`/subscribe/${mentor.id}`}>
                <Button variant="glow" className={`h-12 px-8 font-semibold text-base ${isElite ? "bg-slate-200 text-slate-900 hover:bg-white" : ""}`}>
                  Subscribe Now <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
    </PageTransition>
  );
};

export default MentorProfile;
