import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptions, useMessages, useMarkMessageRead } from "@/hooks/use-student";
import { useSavedMentors } from "@/hooks/use-student";
import { useMentors } from "@/hooks/use-mentors";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Zap, ArrowLeft, Star, Clock, BookOpen, Heart, MessageSquare,
  Mail, MailOpen, LogOut, ChevronRight, Users,
} from "lucide-react";
import type { Mentor } from "@/types/mentor";

const StudentDashboard = () => {
  const { user, loading, signOut } = useAuth();
  const { data: subscriptions = [], isLoading: subsLoading } = useSubscriptions();
  const { data: savedMentorIds, isLoading: savedLoading } = useSavedMentors();
  const { data: allMentors = [] } = useMentors();
  const { data: messages = [], isLoading: msgsLoading } = useMessages();
  const markRead = useMarkMessageRead();

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm">Loading...</p></div>;
  }
  if (!user) return <Navigate to="/auth" replace />;

  const savedMentors = allMentors.filter((m) => savedMentorIds?.has(m.id));
  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(hsl(160 84% 39% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(160 84% 39% / 0.3) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              My Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back, {user.user_metadata?.display_name || user.email}
            </p>
          </div>
          <Button variant="outline" size="sm" className="text-xs" onClick={signOut}>
            <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign Out
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: BookOpen, label: "Active Mentorships", value: subscriptions.length, color: "text-primary" },
            { icon: Heart, label: "Favourites", value: savedMentors.length, color: "text-pink-400" },
            { icon: MessageSquare, label: "Unread Messages", value: unreadCount, color: "text-amber-400" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <span className="font-heading text-2xl font-bold text-foreground">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="mentorships" className="space-y-6">
          <TabsList className="w-full grid grid-cols-3 h-11">
            <TabsTrigger value="mentorships" className="text-xs font-semibold">
              <BookOpen className="h-3.5 w-3.5 mr-1.5" /> Mentorships
            </TabsTrigger>
            <TabsTrigger value="favourites" className="text-xs font-semibold">
              <Heart className="h-3.5 w-3.5 mr-1.5" /> Favourites
            </TabsTrigger>
            <TabsTrigger value="messages" className="text-xs font-semibold">
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Messages
              {unreadCount > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5">{unreadCount}</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Active Mentorships Tab */}
          <TabsContent value="mentorships">
            {subsLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : subscriptions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
                <p className="text-sm text-muted-foreground mb-3">You don't have any active mentorships yet.</p>
                <Link to="/mentors">
                  <Button size="sm" className="text-xs font-semibold">
                    Browse Mentors <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {subscriptions.map((sub: any) => {
                  const mentor = sub.mentors as Mentor;
                  return (
                    <Link key={sub.id} to={`/mentor/${mentor.id}`} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/30">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-heading font-bold text-sm">
                        {mentor.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-semibold text-foreground text-sm">{mentor.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Since {new Date(sub.started_at).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1 text-amber-400"><Star className="h-3 w-3 fill-current" /> {mentor.rating}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-heading font-bold text-foreground text-sm">${mentor.monthly_price}</span>
                        <span className="text-xs text-muted-foreground block">/mo</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Favourites Tab */}
          <TabsContent value="favourites">
            {savedLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : savedMentors.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
                <Heart className="h-8 w-8 text-pink-400/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-1">No favourite mentors yet.</p>
                <p className="text-xs text-muted-foreground mb-4">Browse mentors and tap the heart icon to save your favourites.</p>
                <Link to="/mentors">
                  <Button size="sm" variant="outline" className="text-xs font-semibold">
                    Find Mentors <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {savedMentors.map((mentor) => (
                  <Link key={mentor.id} to={`/mentor/${mentor.id}`} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/30">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-heading font-bold text-xs">
                      {mentor.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading font-semibold text-foreground text-sm truncate">{mentor.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1 text-amber-400"><Star className="h-3 w-3 fill-current" /> {mentor.rating}</span>
                        <span>${mentor.monthly_price}/mo</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs shrink-0" onClick={(e) => { e.preventDefault(); }}>
                      <Heart className="h-3.5 w-3.5 fill-pink-400 text-pink-400" />
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            {msgsLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
                <p className="text-sm text-muted-foreground">No messages yet. Messages from your mentors will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-2xl border bg-card p-4 transition-all ${
                      msg.is_read ? "border-border" : "border-primary/30 bg-primary/[0.02]"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {msg.is_read ? (
                          <MailOpen className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Mail className="h-4 w-4 text-primary" />
                        )}
                        <span className="font-heading font-semibold text-sm text-foreground">{msg.sender_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(msg.created_at).toLocaleDateString()}
                        </span>
                        {!msg.is_read && (
                          <button
                            onClick={() => markRead.mutate(msg.id)}
                            className="text-[10px] text-primary hover:underline"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                    <h4 className="text-sm font-medium text-foreground mb-1">{msg.subject}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{msg.body}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentDashboard;
