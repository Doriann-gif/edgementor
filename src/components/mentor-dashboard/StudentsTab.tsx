import { useMemo, useState } from "react";
import { useMentorStudents } from "@/hooks/use-mentor-dashboard";
import { Input } from "@/components/ui/input";
import {
  Users, Search, MapPin, Clock, TrendingUp, CalendarDays, Loader2,
} from "lucide-react";

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced", professional: "Professional",
};

const daysSince = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));

const StudentsTab = ({ mentorId }: { mentorId: string }) => {
  const { data: students = [], isLoading } = useMentorStudents(mentorId);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s: any) => {
      const p = s.profiles;
      return (p?.display_name || "").toLowerCase().includes(q) || (p?.country || "").toLowerCase().includes(q);
    });
  }, [students, search]);

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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students by name or country..."
          className="bg-muted border-border text-sm pl-9"
        />
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
                  <h4 className="font-heading font-semibold text-sm text-foreground truncate">{p?.display_name || "Student"}</h4>
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
    </div>
  );
};

export default StudentsTab;
