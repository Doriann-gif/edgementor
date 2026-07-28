import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useMentorStudents } from "@/hooks/use-mentor-dashboard";
import { useMentorReviews } from "@/hooks/use-mentors";
import { Button } from "@/components/ui/button";
import {
  Users, DollarSign, Star, MessageSquare, TrendingUp, Crown,
  Eye, ArrowRight, CalendarDays, Wallet, AlertCircle, CheckCircle2,
  CalendarClock, Mail,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  mentor: any;
  mentorUserId: string;
  earnings: any;
  onGoToTab: (tab: string) => void;
}

const daysSince = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));

const MentorOverviewTab = ({ mentor, mentorUserId, earnings, onGoToTab }: Props) => {
  const { data: students = [] } = useMentorStudents(mentor.id);
  const { data: reviews = [] } = useMentorReviews(mentor.id);
  const queryClient = useQueryClient();

  // Free intro requests waiting on this mentor (RLS: mentors read their own)
  const { data: introRequests = [] } = useQuery({
    queryKey: ["mentor-intro-requests", mentor.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("intro_requests")
        .select("*")
        .eq("mentor_id", mentor.id)
        .eq("status", "new")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const markContacted = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("intro_requests").update({ status: "contacted" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentor-intro-requests", mentor.id] });
      toast.success("Marked as contacted.");
    },
    onError: () => toast.error("Failed to update request."),
  });

  // Unread messages from students
  const { data: unread = 0 } = useQuery({
    queryKey: ["mentor-unread-overview", mentorUserId],
    enabled: !!mentorUserId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", mentorUserId)
        .eq("is_read", false);
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Content count
  const { data: contentCount = 0 } = useQuery({
    queryKey: ["mentor-content-count", mentor.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("mentor_content")
        .select("id", { count: "exact", head: true })
        .eq("mentor_id", mentor.id);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const isOneTime = mentor.payment_type === "one_time";
  const recentStudents = students.slice(0, 4);
  const recentReviews = reviews.slice(0, 2);

  // Setup checklist — nudges the mentor toward a complete, sellable product
  const checklist = [
    { done: !!mentor.full_bio && mentor.full_bio.length > 20, label: "Write a full bio", tab: "profile" },
    { done: (mentor.highlights?.length ?? 0) >= 3, label: "Add 3+ highlights", tab: "profile" },
    { done: contentCount > 0, label: "Publish exclusive content", tab: "content" },
    { done: mentor.available, label: "Go live (accepting students)", tab: "profile" },
  ];
  const remaining = checklist.filter((c) => !c.done);

  return (
    <div className="space-y-4">
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Users, label: "Active students", value: earnings?.activeStudents ?? 0, tab: "students", tint: "text-primary bg-primary/10" },
          { icon: DollarSign, label: isOneTime ? "Est. net / sale" : "Est. net / mo", value: `$${(isOneTime ? earnings?.netPerSale : earnings?.monthlyNet) ?? 0}`, tab: "income", tint: "text-emerald-400 bg-emerald-400/10" },
          { icon: MessageSquare, label: "Unread messages", value: unread, tab: "messages", tint: unread > 0 ? "text-amber-400 bg-amber-400/10" : "text-muted-foreground bg-muted" },
          { icon: Star, label: "Rating", value: mentor.rating || "—", tab: "profile", tint: "text-amber-400 bg-amber-400/10" },
        ].map((m) => (
          <button key={m.label} onClick={() => onGoToTab(m.tab)}
            className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${m.tint} mb-2.5`}>
              <m.icon className="h-4 w-4" />
            </div>
            <p className="font-heading text-xl font-bold text-foreground leading-none">{m.value}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{m.label}</p>
          </button>
        ))}
      </div>

      {/* Setup checklist (only while incomplete) */}
      {remaining.length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-primary" />
            <h3 className="font-heading font-semibold text-sm text-foreground">Finish setting up your mentorship</h3>
            <span className="ml-auto text-xs text-muted-foreground">{checklist.length - remaining.length}/{checklist.length}</span>
          </div>
          <div className="space-y-2">
            {checklist.map((c) => (
              <button key={c.label} onClick={() => onGoToTab(c.tab)}
                className="w-full flex items-center gap-2.5 text-left group">
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${c.done ? "text-primary" : "text-muted-foreground/30"}`} />
                <span className={`text-sm ${c.done ? "text-muted-foreground line-through" : "text-foreground group-hover:text-primary transition-colors"}`}>{c.label}</span>
                {!c.done && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 ml-auto group-hover:text-primary transition-colors" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Free intro requests — hot leads, answer fast */}
      {introRequests.length > 0 && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.04] p-5">
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock className="h-4 w-4 text-amber-400" />
            <h3 className="font-heading font-semibold text-sm text-foreground">Free intro requests</h3>
            <span className="ml-auto rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">{introRequests.length} waiting</span>
          </div>
          <div className="space-y-2.5">
            {introRequests.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/60 p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{r.requester_name}</p>
                  {r.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.message}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{daysSince(r.created_at) === 0 ? "Today" : `${daysSince(r.created_at)}d ago`}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a href={`mailto:${r.requester_email}?subject=${encodeURIComponent("Your free intro call — " + mentor.name)}`}>
                    <Button size="sm" variant="outline" className="h-7 text-[11px]">
                      <Mail className="h-3 w-3 mr-1" /> Reply
                    </Button>
                  </a>
                  <Button size="sm" variant="ghost" className="h-7 text-[11px] text-muted-foreground" onClick={() => markContacted.mutate(r.id)} disabled={markContacted.isPending}>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Done
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent students */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Recent students</h3>
            {students.length > 0 && (
              <button onClick={() => onGoToTab("students")} className="text-xs text-primary hover:underline inline-flex items-center gap-0.5">
                View all <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
          {recentStudents.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No students yet. Share your profile to get your first subscriber.</p>
          ) : (
            <div className="space-y-2.5">
              {recentStudents.map((s: any) => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground overflow-hidden">
                    {s.profiles?.avatar_url ? <img src={s.profiles.avatar_url} alt="" className="h-full w-full object-cover" /> : (s.profiles?.display_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-foreground truncate flex-1">{s.profiles?.display_name || "Student"}</span>
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {daysSince(s.started_at)}d</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent reviews */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2"><Star className="h-4 w-4 text-amber-400" /> Recent reviews</h3>
            <span className="text-xs text-muted-foreground">{reviews.length} total</span>
          </div>
          {recentReviews.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No reviews yet — they appear after students rate you.</p>
          ) : (
            <div className="space-y-3">
              {recentReviews.map((r: any) => (
                <div key={r.id} className="text-sm">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-medium text-foreground">{r.reviewer_name}</span>
                    <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-400"><Star className="h-3 w-3 fill-current" /> {r.rating}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{r.review_text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button onClick={() => onGoToTab("content")} className="rounded-xl border border-border bg-card p-4 text-left hover:border-primary/30 transition-colors group">
          <Crown className="h-5 w-5 text-primary mb-2" />
          <p className="text-sm font-semibold text-foreground">Manage content</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{contentCount} item{contentCount === 1 ? "" : "s"}</p>
        </button>
        <button onClick={() => onGoToTab("students")} className="rounded-xl border border-border bg-card p-4 text-left hover:border-primary/30 transition-colors">
          <MessageSquare className="h-5 w-5 text-primary mb-2" />
          <p className="text-sm font-semibold text-foreground">Message students</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Announce or DM</p>
        </button>
        <button onClick={() => onGoToTab("income")} className="rounded-xl border border-border bg-card p-4 text-left hover:border-primary/30 transition-colors">
          <Wallet className="h-5 w-5 text-primary mb-2" />
          <p className="text-sm font-semibold text-foreground">Earnings</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Withdraw & history</p>
        </button>
        <Link to={`/mentor/${mentor.id}`} className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors block">
          <Eye className="h-5 w-5 text-primary mb-2" />
          <p className="text-sm font-semibold text-foreground">View public page</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">As students see it</p>
        </Link>
      </div>
    </div>
  );
};

export default MentorOverviewTab;
