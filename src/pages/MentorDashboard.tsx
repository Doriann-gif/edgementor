import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMyMentorProfile, useUpdateMentorProfile, useMentorStudents, useMentorEarnings } from "@/hooks/use-mentor-dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MentorContentManager from "@/components/MentorContentManager";
import {
  ArrowLeft, LogOut, Users, DollarSign, TrendingUp, Edit3, Save,
  X, Clock, Star, Eye, Tag, Crown,
} from "lucide-react";
import { toast } from "sonner";

const MentorDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: mentor, isLoading } = useMyMentorProfile();
  const updateProfile = useUpdateMentorProfile();

  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editFullBio, setEditFullBio] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editHighlights, setEditHighlights] = useState("");

  const { data: students = [] } = useMentorStudents(mentor?.id);
  const { data: earnings } = useMentorEarnings(mentor?.id, mentor?.monthly_price ?? 0);

  useEffect(() => {
    if (mentor) {
      setEditBio(mentor.bio);
      setEditFullBio(mentor.full_bio);
      setEditPrice(String(mentor.monthly_price));
      setEditHighlights(mentor.highlights.join("\n"));
    }
  }, [mentor]);

  if (authLoading || isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm">Loading...</p></div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!mentor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No mentor profile found.</p>
          <p className="text-xs text-muted-foreground mb-4">Your account must be linked to an approved mentor profile.</p>
          <Link to="/"><Button variant="outline" size="sm">Back to home</Button></Link>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        id: mentor.id,
        updates: {
          bio: editBio,
          full_bio: editFullBio,
          monthly_price: parseInt(editPrice, 10),
          highlights: editHighlights.split("\n").map((h) => h.trim()).filter(Boolean),
        },
      });
      setEditing(false);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile.");
    }
  };

  const handleToggleAvailability = async () => {
    try {
      await updateProfile.mutateAsync({
        id: mentor.id,
        updates: { available: !mentor.available },
      });
      toast.success(mentor.available ? "You're now unavailable." : "You're now available!");
    } catch {
      toast.error("Failed to update availability.");
    }
  };

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
              <ArrowLeft className="h-4 w-4" /> Back to site
            </Link>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Mentor Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your profile, students, and earnings.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/mentor/${mentor.id}`}>
              <Button variant="outline" size="sm" className="text-xs"><Eye className="h-3.5 w-3.5 mr-1" /> View Public Profile</Button>
            </Link>
            <Link to="/codes">
              <Button variant="outline" size="sm" className="text-xs"><Tag className="h-3.5 w-3.5 mr-1" /> Promo Codes</Button>
            </Link>
            <Button variant="outline" size="sm" className="text-xs" onClick={signOut}>
              <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign Out
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: "Active Students", value: earnings?.activeStudents ?? 0, color: "text-primary" },
            { icon: DollarSign, label: "Monthly Revenue", value: `$${earnings?.monthlyRevenue ?? 0}`, color: "text-primary" },
            { icon: Star, label: "Rating", value: mentor.rating, color: "text-amber-400" },
            { icon: TrendingUp, label: "Total Subscribers", value: earnings?.allTimeSubs ?? 0, color: "text-primary" },
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

        {/* Availability Toggle */}
        <div className="rounded-2xl border border-border bg-card p-5 mb-6 flex items-center justify-between">
          <div>
            <h3 className="font-heading font-semibold text-foreground text-sm">Availability</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {mentor.available ? "You're visible and accepting new students." : "You're hidden from the listing. Existing students aren't affected."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium ${mentor.available ? "text-primary" : "text-muted-foreground"}`}>
              {mentor.available ? "Available" : "Unavailable"}
            </span>
            <Switch
              checked={mentor.available}
              onCheckedChange={handleToggleAvailability}
              disabled={updateProfile.isPending}
            />
          </div>
        </div>

        {/* Profile Editor */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-primary" /> Profile
            </h2>
            {!editing ? (
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setEditing(true)}>
                <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" className="text-xs h-8" onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                  <Save className="h-3.5 w-3.5 mr-1" /> Save
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setEditing(false)}>
                  <X className="h-3.5 w-3.5 mr-1" /> Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
            {/* Name & Avatar (read-only) */}
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-heading font-bold text-lg">
                {mentor.avatar}
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground">{mentor.name}</h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {mentor.experience}</span>
                  <span>{mentor.session} session</span>
                </div>
              </div>
            </div>

            {editing ? (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Short Bio</Label>
                  <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={2} className="bg-muted border-border text-sm resize-none" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Full Bio</Label>
                  <Textarea value={editFullBio} onChange={(e) => setEditFullBio(e.target.value)} rows={4} className="bg-muted border-border text-sm resize-none" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Monthly Price (USD)</Label>
                  <Input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="bg-muted border-border text-sm w-32" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Highlights (one per line)</Label>
                  <Textarea value={editHighlights} onChange={(e) => setEditHighlights(e.target.value)} rows={4} className="bg-muted border-border text-sm resize-none" placeholder="Live trading room daily&#10;1-on-1 weekly calls" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-xs text-muted-foreground">Short Bio</span>
                  <p className="text-sm text-foreground mt-1">{mentor.bio}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Full Bio</span>
                  <p className="text-sm text-foreground mt-1 leading-relaxed">{mentor.full_bio}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-xs text-muted-foreground">Monthly Price</span>
                    <p className="font-heading font-bold text-foreground mt-1">${mentor.monthly_price}</p>
                  </div>
                </div>
                {mentor.highlights.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">Highlights</span>
                    <ul className="mt-2 space-y-1.5">
                      {mentor.highlights.map((h) => (
                        <li key={h} className="text-sm text-foreground flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" /> {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Students */}
        <section>
          <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Your Students ({students.length})
          </h2>
          {students.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
              <p className="text-sm text-muted-foreground">No active students yet. They'll appear here once someone subscribes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((sub: any) => {
                const profile = sub.profiles;
                return (
                  <div key={sub.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                      {(profile?.display_name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-heading font-semibold text-sm text-foreground truncate">
                        {profile?.display_name || "Student"}
                      </h4>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Joined {new Date(sub.started_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary capitalize">{sub.status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default MentorDashboard;
