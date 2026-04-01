import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Clock, Users, MapPin, TrendingUp, CheckCircle2, MessageSquare, Heart, Crown, ChevronRight, Sparkles, Shield, Award, Pencil } from "lucide-react";
import { useMentor, useMentorReviews } from "@/hooks/use-mentors";
import { useSavedMentors, useToggleSaveMentor } from "@/hooks/use-student";
import { useIsSubscribed } from "@/hooks/use-mentor-content";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
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
      <PageTransition>
        <div className="min-h-screen bg-background">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-5">
            {/* Back link skeleton */}
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />

            {/* Main card skeleton */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6">
              <div className="flex items-start gap-5">
                <div className="h-20 w-20 shrink-0 rounded-2xl bg-muted animate-pulse" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 w-48 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                  <div className="flex gap-4">
                    <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-28 rounded bg-muted animate-pulse" />
                  </div>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => <div key={i} className="h-4 w-4 rounded bg-muted animate-pulse" />)}
                  </div>
                </div>
              </div>
              {/* Tags skeleton */}
              <div className="flex flex-wrap gap-2">
                {[1,2,3,4,5].map(i => <div key={i} className="h-7 rounded-lg bg-muted animate-pulse" style={{ width: `${60 + i * 12}px` }} />)}
              </div>
              {/* Bio skeleton */}
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-muted animate-pulse" />
                <div className="h-3 w-full rounded bg-muted animate-pulse" />
                <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
              </div>
            </div>

            {/* Stats skeleton */}
            <div className="grid grid-cols-3 gap-3">
              {[1,2,3].map(i => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4 flex flex-col items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-muted animate-pulse" />
                  <div className="h-5 w-10 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-14 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>

            {/* What's Included skeleton */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4">
              <div className="h-5 w-36 rounded bg-muted animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-muted animate-pulse shrink-0" />
                    <div className="h-3 w-full rounded bg-muted animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews skeleton */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-5">
              <div className="h-5 w-28 rounded bg-muted animate-pulse" />
              {[1,2].map(i => (
                <div key={i} className="space-y-2 pb-5 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                    <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                  </div>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(j => <div key={j} className="h-4 w-4 rounded bg-muted animate-pulse" />)}
                  </div>
                  <div className="h-3 w-full rounded bg-muted animate-pulse" />
                  <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>

            {/* Subscribe bar skeleton */}
            <div className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-6 w-24 rounded bg-muted animate-pulse" />
                <div className="h-3 w-16 rounded bg-muted animate-pulse" />
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
                <div className="h-10 w-32 rounded-xl bg-muted animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
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
    <PageTransition>
    <div className={`min-h-screen ${isElite ? "bg-slate-950" : "bg-background"}`}>
      {/* Ambient background with pink corners */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {isElite ? (
          <>
            <motion.div
              className="absolute top-[-100px] left-1/3 w-[500px] h-[500px] bg-slate-400/[0.03] rounded-full blur-[120px]"
              animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-[-100px] right-1/4 w-[400px] h-[400px] bg-pink-400/[0.03] rounded-full blur-[100px]"
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        ) : (
          <>
            <motion.div
              className="absolute top-[-100px] right-1/4 w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[130px]"
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-[-100px] left-1/4 w-[400px] h-[400px] bg-pink-400/[0.04] rounded-full blur-[100px]"
              animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Pink corner accents */}
            <motion.div
              className="absolute top-[5%] right-[3%] w-[200px] h-[200px] bg-pink-500/[0.06] rounded-full blur-[70px]"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-[15%] left-[3%] w-[180px] h-[180px] bg-pink-400/[0.05] rounded-full blur-[60px]"
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
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
        {/* Back link */}
        <motion.div variants={fadeUp}>
          <Link to="/mentors" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6 group">
            <ArrowLeft className="h-4 w-4" />
            <span className="group-hover:underline">All Mentors</span>
          </Link>
        </motion.div>

        {/* Main Card */}
        <motion.div
          variants={scaleIn}
          className={`relative rounded-2xl border p-6 sm:p-8 mb-5 overflow-hidden ${
            isElite
              ? "border-slate-600/50 bg-gradient-to-br from-slate-900 via-slate-800/50 to-slate-900"
              : "border-border bg-card hover:border-pink-400/20 transition-colors"
          }`}
        >
          {/* Pink corner decorations */}
          {!isElite && (
            <>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pink-400/[0.08] to-transparent rounded-bl-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/[0.06] to-transparent rounded-tr-full pointer-events-none" />
            </>
          )}

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

          {/* Avatar & Info */}
          <div className="flex items-start gap-5 mb-6 mt-1">
            <motion.div
              className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl font-heading font-bold text-xl shadow-lg ${
                isElite
                  ? "bg-slate-700/50 text-slate-200 shadow-slate-900/50"
                  : "bg-gradient-to-br from-primary/15 via-pink-400/10 to-primary/5 text-primary shadow-primary/10"
              }`}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {mentor.avatar}
            </motion.div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-heading text-2xl font-bold text-foreground">{mentor.name}</h1>
                <TierBadge tier={tier} size="md" showLabel={false} />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <TierBadge tier={tier} size="sm" />
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  <Clock className="h-3.5 w-3.5" />{mentor.experience}
                </span>
                <span className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  <Users className="h-3.5 w-3.5" />{mentor.students} students
                </span>
                <span className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  <MapPin className="h-3.5 w-3.5" />{mentor.session} session
                </span>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <StarRating rating={Math.round(mentor.rating)} />
                <span className="text-sm font-semibold text-foreground">{mentor.rating}</span>
                <span className="text-xs text-muted-foreground">({reviews.length} reviews)</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {mentor.instruments.map((i, idx) => (
              <motion.span
                key={i}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${isElite ? "bg-slate-700/50 text-slate-300" : "bg-primary/10 text-primary hover:bg-primary/15 transition-colors"}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
              >
                {i}
              </motion.span>
            ))}
            {mentor.concepts.map((c, idx) => (
              <motion.span
                key={c}
                className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + idx * 0.05 }}
              >
                {c}
              </motion.span>
            ))}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">{mentor.full_bio}</p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          variants={fadeUp}
          className={`grid grid-cols-3 gap-3 mb-5`}
        >
          {[
            { label: "Students", value: mentor.students, icon: Users, color: "text-primary bg-primary/10" },
            { label: "Rating", value: mentor.rating, icon: Star, color: "text-amber-400 bg-amber-400/10" },
            { label: "Experience", value: mentor.experience, icon: Award, color: "text-pink-400 bg-pink-400/10" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className={`rounded-2xl border p-4 text-center ${isElite ? "border-slate-600/50 bg-slate-900/80" : "border-border bg-card hover:border-pink-400/20 transition-colors"}`}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              // @ts-ignore
              custom={i}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.color} mx-auto mb-2`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <p className="font-heading text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* What's Included */}
        <motion.div
          variants={fadeUp}
          className={`relative rounded-2xl border p-6 sm:p-8 mb-5 overflow-hidden ${isElite ? "border-slate-600/50 bg-slate-900/80" : "border-border bg-card"}`}
        >
          {!isElite && <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-pink-400/[0.06] to-transparent rounded-bl-full pointer-events-none" />}

          <h2 className="font-heading text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
            <TrendingUp className={`h-5 w-5 ${isElite ? "text-slate-300" : "text-primary"}`} />
            What's Included
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mentor.highlights.map((h, i) => (
              <motion.div
                key={h}
                className="flex items-center gap-3 text-sm group"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.06, duration: 0.4 }}
              >
                <CheckCircle2 className={`h-5 w-5 shrink-0 ${isElite ? "text-slate-300" : "text-primary"}`} />
                <span className="text-foreground group-hover:text-primary transition-colors">{h}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Reviews */}
        <motion.div
          variants={fadeUp}
          className={`relative rounded-2xl border p-6 sm:p-8 mb-5 overflow-hidden ${isElite ? "border-slate-600/50 bg-slate-900/80" : "border-border bg-card"}`}
        >
          {!isElite && <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-pink-400/[0.06] to-transparent rounded-tr-full pointer-events-none" />}

          <h2 className="font-heading text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
            <MessageSquare className={`h-5 w-5 ${isElite ? "text-slate-300" : "text-primary"}`} />
            Reviews
            <span className="text-sm font-normal text-muted-foreground">({reviews.length})</span>
          </h2>

          {reviews.length === 0 ? (
            <motion.div
              className="text-center py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Sparkles className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No reviews yet. Be the first to subscribe!</p>
            </motion.div>
          ) : (
            <div className="space-y-5">
              {reviews.map((review, idx) => (
                <motion.div
                  key={review.id}
                  className={`${idx < reviews.length - 1 ? "pb-5 border-b border-border" : ""} group`}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.06, duration: 0.4 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/10 to-pink-400/10 flex items-center justify-center text-[10px] font-bold text-primary">
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
          )}
        </motion.div>

        {/* Sticky Subscribe Bar */}
        <motion.div
          className={`sticky bottom-4 rounded-2xl border backdrop-blur-md p-5 flex items-center justify-between shadow-2xl z-10 ${
            isElite
              ? "border-slate-600/50 bg-slate-900/95 shadow-slate-900/50"
              : "border-border/80 bg-card/95 shadow-black/30 hover:border-pink-400/20 transition-colors"
          }`}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, type: "spring", stiffness: 200 }}
        >
          {/* Pink accent on bar */}
          {!isElite && (
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-400/30 to-transparent" />
          )}

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
            <Button variant="outline" size="icon" className="h-12 w-12 border-pink-400/20 hover:border-pink-400/40 hover:bg-pink-400/5 transition-colors" onClick={handleSave} disabled={toggleSave.isPending}>
              <Heart className={`h-5 w-5 transition-all ${isSaved ? "fill-pink-400 text-pink-400 scale-110" : "text-muted-foreground hover:text-pink-400"}`} />
            </Button>
            {isSubscribed ? (
              <Link to={`/mentorship/${mentor.id}`}>
                <Button variant="glow" className={`h-12 px-8 font-semibold text-base ${isElite ? "bg-slate-200 text-slate-900 hover:bg-white" : "shadow-xl shadow-primary/25"}`}>
                  <Crown className="h-4 w-4 mr-2" /> Access Mentorship
                </Button>
              </Link>
            ) : (
              <Link to={`/subscribe/${mentor.id}`}>
                <Button variant="glow" className={`h-12 px-8 font-semibold text-base ${isElite ? "bg-slate-200 text-slate-900 hover:bg-white" : "shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/35"}`}>
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
