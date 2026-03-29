import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMentor } from "@/hooks/use-mentors";
import { useMentorContent, useIsSubscribed } from "@/hooks/use-mentor-content";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Lock, Video, Link2, MessageCircle, Calendar,
  BookOpen, ExternalLink, Star, Crown,
} from "lucide-react";

const CONTENT_ICONS: Record<string, typeof Video> = {
  video: Video,
  link: Link2,
  discord: MessageCircle,
  call: Calendar,
  resource: BookOpen,
};

const CONTENT_COLORS: Record<string, string> = {
  video: "text-red-400 bg-red-400/10",
  link: "text-blue-400 bg-blue-400/10",
  discord: "text-indigo-400 bg-indigo-400/10",
  call: "text-amber-400 bg-amber-400/10",
  resource: "text-primary bg-primary/10",
};

const MentorContent = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { data: mentor, isLoading: mentorLoading } = useMentor(id);
  const { data: isSubscribed, isLoading: subLoading } = useIsSubscribed(id);
  const { data: content = [], isLoading: contentLoading } = useMentorContent(id);

  if (authLoading || mentorLoading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!mentor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Mentor not found.</p>
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Exclusive Content</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Subscribe to {mentor.name} to unlock their exclusive mentorship content, group links, videos, and scheduled calls.
          </p>
          <Link to={`/subscribe/${id}`}>
            <Button variant="glow" className="font-semibold">Subscribe for ${mentor.monthly_price}/mo</Button>
          </Link>
        </div>
      </div>
    );
  }

  const grouped: Record<string, typeof content> = {};
  content.forEach((item) => {
    const type = item.content_type || "link";
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(item);
  });

  const typeLabels: Record<string, string> = {
    video: "Videos & Recordings",
    link: "Resources & Links",
    discord: "Community & Discord",
    call: "Scheduled Calls",
    resource: "Course Materials",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(hsl(160 84% 39% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(160 84% 39% / 0.3) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Link to={`/mentor/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to profile
        </Link>

        {/* Header */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-heading font-bold text-lg">
              {mentor.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">{mentor.name}</h1>
                <Crown className="h-5 w-5 text-amber-400" />
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">Exclusive mentorship content</p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                <Star className="h-3 w-3 fill-current" /> Subscribed
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        {contentLoading ? (
          <p className="text-sm text-muted-foreground">Loading content...</p>
        ) : content.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">Content Coming Soon</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {mentor.name} hasn't added exclusive content yet. Check back soon — videos, group links, and resources will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([type, items]) => {
              const Icon = CONTENT_ICONS[type] || Link2;
              const colorClass = CONTENT_COLORS[type] || "text-primary bg-primary/10";
              return (
                <div key={type}>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <h2 className="font-heading font-semibold text-foreground">{typeLabels[type] || type}</h2>
                    <span className="text-xs text-muted-foreground">({items.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {items.map((item) => (
                      <a
                        key={item.id}
                        href={item.content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                      >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorClass} mt-0.5`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">{item.title}</h3>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorContent;
