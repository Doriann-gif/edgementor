import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMentorStudents } from "@/hooks/use-mentor-dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Users, Search, Send, Megaphone, MapPin, Clock, TrendingUp,
  CalendarDays, MessageSquare, Loader2,
} from "lucide-react";
import { toast } from "sonner";

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced", professional: "Professional",
};

const daysSince = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));

const StudentsTab = ({ mentorId, mentorUserId }: { mentorId: string; mentorUserId: string }) => {
  const queryClient = useQueryClient();
  const { data: students = [], isLoading } = useMentorStudents(mentorId);
  const [search, setSearch] = useState("");
  const [dm, setDm] = useState<{ userId: string; name: string } | null>(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s: any) => {
      const p = s.profiles;
      return (p?.display_name || "").toLowerCase().includes(q) || (p?.country || "").toLowerCase().includes(q);
    });
  }, [students, search]);

  const resetCompose = () => { setSubject(""); setBody(""); setDm(null); setBroadcastOpen(false); };

  const sendDm = useMutation({
    mutationFn: async () => {
      if (!dm) throw new Error("No recipient");
      const { error } = await supabase.from("messages").insert({
        recipient_id: dm.userId,
        sender_user_id: mentorUserId,
        sender_mentor_id: mentorId,
        sender_name: "Mentor",
        subject: subject.trim(),
        body: body.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentor-messages"] });
      toast.success(`Message sent to ${dm?.name}`);
      resetCompose();
    },
    onError: (e: any) => toast.error(e.message || "Failed to send message"),
  });

  const broadcast = useMutation({
    mutationFn: async () => {
      const rows = students.map((s: any) => ({
        recipient_id: s.profiles?.id ?? s.user_id,
        sender_user_id: mentorUserId,
        sender_mentor_id: mentorId,
        sender_name: "Mentor",
        subject: subject.trim(),
        body: body.trim(),
      })).filter((r: any) => r.recipient_id);
      if (rows.length === 0) throw new Error("No students to message");
      const { error } = await supabase.from("messages").insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["mentor-messages"] });
      toast.success(`Announcement sent to ${count} student${count === 1 ? "" : "s"}`);
      resetCompose();
    },
    onError: (e: any) => toast.error(e.message || "Failed to send announcement"),
  });

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Loading students...</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
        <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-foreground font-medium mb-1">No active students yet</p>
        <p className="text-xs text-muted-foreground">They'll appear here once someone subscribes to your mentorship.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students by name or country..."
            className="bg-muted border-border text-sm pl-9"
          />
        </div>
        <Button size="sm" className="text-xs shrink-0" onClick={() => setBroadcastOpen(true)}>
          <Megaphone className="h-3.5 w-3.5 mr-1.5" /> Announce to all ({students.length})
        </Button>
      </div>

      {/* Student list */}
      <div className="space-y-2.5">
        {filtered.map((sub: any) => {
          const p = sub.profiles;
          const interests: string[] = p?.trading_interests || [];
          return (
            <div key={sub.id} className="rounded-xl border border-border bg-card p-4 hover:border-border/80 transition-colors">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 shrink-0 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground overflow-hidden">
                  {p?.avatar_url ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" /> : (p?.display_name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-heading font-semibold text-sm text-foreground truncate">{p?.display_name || "Student"}</h4>
                    <Button variant="outline" size="sm" className="h-7 text-xs shrink-0"
                      onClick={() => { setDm({ userId: p?.id ?? sub.user_id, name: p?.display_name || "Student" }); setSubject(""); setBody(""); }}>
                      <Send className="h-3 w-3 mr-1" /> Message
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {daysSince(sub.started_at)}d subscribed</span>
                    {p?.country && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.country}</span>}
                    {p?.timezone && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {p.timezone}</span>}
                    {p?.trading_experience && <span className="inline-flex items-center gap-1 capitalize"><TrendingUp className="h-3 w-3" /> {EXPERIENCE_LABELS[p.trading_experience] || p.trading_experience}</span>}
                    {p?.age && <span>Age {p.age}</span>}
                  </div>
                  {interests.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {interests.map((i) => (
                        <span key={i} className="rounded-md bg-primary/5 border border-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">{i}</span>
                      ))}
                    </div>
                  )}
                  {p?.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.bio}</p>}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No students match "{search}".</p>
        )}
      </div>

      {/* Direct message dialog */}
      <Dialog open={!!dm} onOpenChange={(o) => !o && setDm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Message {dm?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Subject</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="text-sm" placeholder="e.g. Welcome to the mentorship" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Message</label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="text-sm" placeholder="Write your message..." />
            </div>
            <Button className="w-full text-sm" disabled={!subject.trim() || !body.trim() || sendDm.isPending} onClick={() => sendDm.mutate()}>
              {sendDm.isPending ? "Sending..." : <><Send className="h-3.5 w-3.5 mr-1.5" /> Send Message</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Broadcast dialog */}
      <Dialog open={broadcastOpen} onOpenChange={(o) => !o && setBroadcastOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2"><Megaphone className="h-4 w-4 text-primary" /> Announce to all students</DialogTitle>
            <DialogDescription className="text-xs">This message is sent to all {students.length} active student{students.length === 1 ? "" : "s"}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Subject</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="text-sm" placeholder="e.g. New live session this Friday" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Message</label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="text-sm" placeholder="Write your announcement..." />
            </div>
            <Button className="w-full text-sm" disabled={!subject.trim() || !body.trim() || broadcast.isPending} onClick={() => broadcast.mutate()}>
              {broadcast.isPending ? "Sending..." : <><Megaphone className="h-3.5 w-3.5 mr-1.5" /> Send to {students.length} student{students.length === 1 ? "" : "s"}</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentsTab;
