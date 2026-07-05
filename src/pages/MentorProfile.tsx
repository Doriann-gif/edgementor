import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft, Star, Clock, Users, MapPin, Globe, TrendingUp,
  CheckCircle2, MessageSquare, Heart, Crown, ChevronRight,
  Sparkles, Shield, Award, Send, ImageIcon, ExternalLink, Zap, BookOpen,
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
      <Star key={s} className={`h-4 w-4 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
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

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
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
      className={`inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
        isElite
          ? "border-slate-500/40 bg-slate-800/60 text-slate-200 hover:bg-slate-700/60 hover:border-slate-400/50"
          : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 hover:border-primary/50 hover:shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
      }`}
    >
      <ExternalLink className="h-4 w-4" />
      Follow on {platform.label}
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
            <p className="text-sm text-muted-foreground leading-relaxed">This mentor profile doesn't exist or may have been removed.</p>
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
          <div className="h-48 sm:h-56 bg-muted animate-pulse" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-16">
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-2xl bg-muted animate-pulse ring-4 ring-background" />
              <div className="h-6 w-48 rounded bg-muted animate-pulse mt-4" />
              <div className="h-4 w-32 rounded bg-muted animate-pulse mt-2" />
            </div>
            <div className="grid grid-cols-4 gap-4 mt-8">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
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
  const bannerColor = (mentor as any).banner_color || "#6d28d9";

  const stats = [
    { label: "Students", value: mentor.students, icon: Users, color: "text-primary bg-primary/10" },
    { label: "Rating", value: mentor.rating, icon: Star, color: "text-amber-400 bg-amber-400/10" },
    { label: "Experience", value: mentor.experience, icon: Clock, color: "text-blue-400 bg-blue-400/10" },
    { label: "Session", value: mentor.session, icon: MapPin, color: "text-pink-400 bg-pink-400/10" },
  ];

  return (
    <PageTransition>
      <div className={`min-h-screen ${isElite ? "bg-slate-950" : "bg-background"}`}>
        <Helmet>
          <title>{`${mentor.name} — Trading Mentor | EdgeMentor`}</title>
          <meta name="description" content={`Learn from ${mentor.name}. ${mentor.bio} ${mentor.instruments?.join(", ")} mentor with ${mentor.students} students.`} />
          <link rel="canonical" href={`https://edgementor.netlify.app/mentor/${id}`} />
          <meta property="og:title" content={`${mentor.name} — Trading Mentor | EdgeMentor`} />
          <meta property="og:description" content={mentor.bio} />
          <meta property="og:type" content="profile" />
          <meta property="og:url" content={`https://edgementor.netlify.app/mentor/${id}`} />
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
            "url": `https://edgementor.netlify.app/mentor/${id}`,
            "memberOf": { "@type": "Organization", "name": "EdgeMentor", "url": "https://edgementor.netlify.app" },
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

        {/* ===== FULL-WIDTH BANNER ===== */}
        <div className="relative">
          <motion.div
            className="h-48 sm:h-56 w-full relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${bannerColor}, ${bannerColor}99, ${bannerColor}55)`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-[0.07]" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }} />

            {/* Back button on banner */}
            <div className="absolute top-4 left-4 sm:left-6 z-10">
              <Link to="/mentors">
                <Button variant="outline" size="sm" className="bg-black/30 border-white/20 text-white hover:bg-black/50 backdrop-blur-sm font-medium">
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  All Mentors
                </Button>
              </Link>
            </div>

            {/* Elite badge on banner */}
            {isElite && (
              <motion.div
                className="absolute top-4 right-4 sm:right-6 z-10"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 px-4 py-1.5 text-xs font-bold text-white shadow-lg tracking-wide">
                  <Crown className="h-3.5 w-3.5 text-amber-300" /> ELITE MENTOR
                </span>
              </motion.div>
            )}
          </motion.div>

          {/* ===== PROFILE HEADER — centered, overlapping banner ===== */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <motion.div
              className="relative -mt-16 flex flex-col items-center text-center"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
            >
              {/* Avatar */}
              <motion.div
                className={`flex h-28 w-28 items-center justify-center rounded-2xl font-heading font-bold text-3xl shadow-2xl ring-4 ${
                  isElite
                    ? "bg-slate-800 text-slate-200 ring-slate-950"
                    : "bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-background"
                }`}
                variants={fadeUp}
              >
                {mentor.avatar}
              </motion.div>

              {/* Name & badges */}
              <motion.div className="mt-4 space-y-2" variants={fadeUp}>
                <div className="flex items-center justify-center gap-2">
                  <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">{mentor.name}</h1>
                  <TierBadge tier={tier} size="md" showLabel={false} />
                </div>
                <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                  <TierBadge tier={tier} size="sm" />
                  {mentor.country && (
                    <span className="flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5" />
                      {mentor.country}
                    </span>
                  )}
                </div>
              </motion.div>

              {/* Rating */}
              <motion.div className="flex items-center gap-2 mt-3" variants={fadeUp}>
                <StarRating rating={Math.round(mentor.rating)} />
                <span className="text-sm font-bold text-foreground">{mentor.rating}</span>
                <span className="text-xs text-muted-foreground">({reviews.length} {reviews.length === 1 ? "review" : "reviews"})</span>
              </motion.div>

              {/* Quick action row */}
              <motion.div className="flex items-center gap-3 mt-5 flex-wrap justify-center" variants={fadeUp}>
                {socialLink && <SocialButton url={socialLink} isElite={isElite} />}
                <Button
                  variant="outline"
                  size="sm"
                  className={`rounded-xl px-4 ${isElite ? "border-slate-600/50 hover:bg-slate-800" : ""}`}
                  onClick={handleSave}
                  disabled={toggleSave.isPending}
                >
                  <Heart className={`h-4 w-4 mr-1.5 transition-all ${isSaved ? "fill-pink-400 text-pink-400" : "text-muted-foreground"}`} />
                  {isSaved ? "Saved" : "Save"}
                </Button>
              </motion.div>

              {/* Tags */}
              <motion.div className="flex flex-wrap justify-center gap-2 mt-5" variants={fadeUp}>
                {mentor.instruments.map((i) => (
                  <span
                    key={i}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${isElite ? "bg-slate-800/60 text-slate-300 border border-slate-600/30" : "bg-primary/10 text-primary border border-primary/10"}`}
                  >
                    {i}
                  </span>
                ))}
                {mentor.concepts.map((c) => (
                  <span
                    key={c}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${isElite ? "bg-slate-800/40 text-slate-400 border border-slate-700/30" : "bg-secondary text-secondary-foreground border border-border"}`}
                  >
                    {c}
                  </span>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* ===== STATS ROW ===== */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } } }}
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                className={`rounded-2xl border p-4 text-center ${isElite ? "border-slate-600/40 bg-slate-900/70" : "border-border bg-card"}`}
                variants={fadeUp}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl mx-auto mb-2 ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <p className="font-heading text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* ===== TABBED CONTENT ===== */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 pb-32">
          <Tabs defaultValue="about" className="w-full">
            <TabsList className={`w-full justify-start rounded-xl h-12 p-1 mb-6 ${isElite ? "bg-slate-900/80 border border-slate-700/50" : "bg-muted/50 border border-border"}`}>
              <TabsTrigger value="about" className="rounded-lg text-sm font-medium data-[state=active]:shadow-sm gap-1.5">
                <BookOpen className="h-4 w-4" /> About
              </TabsTrigger>
              <TabsTrigger value="included" className="rounded-lg text-sm font-medium data-[state=active]:shadow-sm gap-1.5">
                <Zap className="h-4 w-4" /> What's Included
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-lg text-sm font-medium data-[state=active]:shadow-sm gap-1.5">
                <MessageSquare className="h-4 w-4" /> Reviews ({reviews.length})
              </TabsTrigger>
            </TabsList>

            {/* --- ABOUT TAB --- */}
            <TabsContent value="about">
              <motion.div
                className={`rounded-2xl border p-6 sm:p-8 ${isElite ? "border-slate-600/40 bg-slate-900/70" : "border-border bg-card"}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="font-heading text-lg font-semibold text-foreground mb-4">About {mentor.name}</h2>
                <p className={`text-sm leading-relaxed whitespace-pre-line ${isElite ? "text-slate-400" : "text-muted-foreground"}`}>
                  {mentor.full_bio}
                </p>

                {/* Showcase Images in About tab */}
                {showcaseImages.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-border/50">
                    <h3 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-primary" /> Gallery
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(showAllImages ? showcaseImages : showcaseImages.slice(0, 3)).map((img: any) => (
                        <div
                          key={img.id}
                          className="rounded-xl overflow-hidden border border-border aspect-video bg-muted group cursor-pointer"
                        >
                          <img src={img.image_url} alt={img.caption || "Showcase"} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
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
            </TabsContent>

            {/* --- WHAT'S INCLUDED TAB --- */}
            <TabsContent value="included">
              <motion.div
                className={`rounded-2xl border p-6 sm:p-8 ${isElite ? "border-slate-600/40 bg-slate-900/70" : "border-border bg-card"}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="font-heading text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
                  <CheckCircle2 className={`h-5 w-5 ${isElite ? "text-slate-300" : "text-primary"}`} />
                  What You Get
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mentor.highlights.map((h, i) => (
                    <motion.div
                      key={h}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm ${
                        isElite ? "bg-slate-800/40 border border-slate-700/30" : "bg-muted/50 border border-border/50"
                      }`}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.4 }}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isElite ? "bg-slate-700/50 text-slate-300" : "bg-primary/10 text-primary"}`}>
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <span className="text-foreground font-medium">{h}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Price CTA inside included tab */}
                <div className={`mt-6 rounded-xl border p-5 flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  isElite ? "border-slate-600/40 bg-slate-800/30" : "border-primary/20 bg-primary/[0.03]"
                }`}>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly subscription</p>
                    <p className="font-heading text-3xl font-bold text-foreground">${mentor.monthly_price}<span className="text-base font-normal text-muted-foreground">/mo</span></p>
                  </div>
                  {isSubscribed ? (
                    <Link to={`/mentorship/${mentor.id}`}>
                      <Button variant="glow" className={`h-11 px-6 font-semibold ${isElite ? "bg-slate-200 text-slate-900 hover:bg-white" : ""}`}>
                        <Crown className="h-4 w-4 mr-2" /> Access Mentorship
                      </Button>
                    </Link>
                  ) : (
                    <Link to={`/subscribe/${mentor.id}`}>
                      <Button variant="glow" className={`h-11 px-6 font-semibold ${isElite ? "bg-slate-200 text-slate-900 hover:bg-white" : ""}`}>
                        Get Started <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              </motion.div>
            </TabsContent>

            {/* --- REVIEWS TAB --- */}
            <TabsContent value="reviews">
              <motion.div
                className={`rounded-2xl border p-6 sm:p-8 ${isElite ? "border-slate-600/40 bg-slate-900/70" : "border-border bg-card"}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Review Submission */}
                {isSubscribed && user && !hasReviewed && (
                  <div className={`rounded-xl border p-5 mb-6 ${isElite ? "border-slate-600/30 bg-slate-800/30" : "border-primary/15 bg-primary/[0.02]"}`}>
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
                  </div>
                )}

                {hasReviewed && (
                  <div className={`rounded-xl border p-4 mb-6 flex items-center gap-2 ${isElite ? "border-slate-600/30 bg-slate-800/30" : "border-primary/15 bg-primary/[0.02]"}`}>
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-xs text-muted-foreground">You've already reviewed this mentor. Thank you!</p>
                  </div>
                )}

                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No reviews yet. Be the first to subscribe and leave a review!</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {reviews.map((review, idx) => (
                      <div
                        key={review.id}
                        className={`py-5 ${idx < reviews.length - 1 ? "border-b border-border/50" : ""}`}
                      >
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold ${
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
                        <p className="text-sm text-muted-foreground leading-relaxed pl-[52px]">{review.review_text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>

        {/* ===== STICKY SUBSCRIBE BAR ===== */}
        <motion.div
          className={`fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl ${
            isElite
              ? "border-slate-700/50 bg-slate-950/95"
              : "border-border/80 bg-background/95"
          }`}
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, type: "spring", stiffness: 200 }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground hidden sm:block">Monthly subscription</p>
              <div className="flex items-baseline gap-1">
                <span className="font-heading text-2xl sm:text-3xl font-bold text-foreground">${mentor.monthly_price}</span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="icon"
                className={`h-11 w-11 rounded-xl ${isElite ? "border-slate-600/50 hover:bg-slate-800" : "border-border hover:border-primary/30"}`}
                onClick={handleSave}
                disabled={toggleSave.isPending}
              >
                <Heart className={`h-5 w-5 transition-all ${isSaved ? "fill-pink-400 text-pink-400 scale-110" : "text-muted-foreground hover:text-pink-400"}`} />
              </Button>
              {isSubscribed ? (
                <Link to={`/mentorship/${mentor.id}`}>
                  <Button variant="glow" className={`h-11 px-5 sm:px-8 font-semibold text-sm sm:text-base ${isElite ? "bg-slate-200 text-slate-900 hover:bg-white" : ""}`}>
                    <Crown className="h-4 w-4 mr-1.5" /> Access
                  </Button>
                </Link>
              ) : (
                <Link to={`/subscribe/${mentor.id}`}>
                  <Button variant="glow" className={`h-11 px-5 sm:px-8 font-semibold text-sm sm:text-base ${isElite ? "bg-slate-200 text-slate-900 hover:bg-white" : ""}`}>
                    Subscribe Now <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default MentorProfile;
