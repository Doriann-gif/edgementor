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
import PageTransition from "@/components/PageTransition";
import { motion } from "framer-motion";
import {
  ArrowLeft, LogOut, Users, DollarSign, TrendingUp, Edit3, Save,
  X, Clock, Star, Eye, Tag, Crown, Sparkles, BookOpen,
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
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Loading your dashboard...</p>
      </motion.div>
    </div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!mentor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <BookOpen className="h-12 w-12 text-primary/20 mx-auto" />
          </motion.div>
          <div>
            <p className="text-foreground font-heading font-semibold mb-1">No mentor profile found</p>
            <p className="text-xs text-muted-foreground mb-4">Your account must be linked to an approved mentor profile.</p>
          </div>
          <Link to="/"><Button variant="outline" size="sm">Back to home</Button></Link>
        </motion.div>
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
    <PageTransition>
    <div className="min-h-screen bg-background">
      {/* Ambient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div className="absolute top-[-80px] left-1/4 w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[130px]" animate={{ y: [0, -15, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute bottom-[-60px] right-1/3 w-[400px] h-[400px] bg-pink/[0.03] rounded-full blur-[100px]" animate={{ y: [0, 12, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
      </div>

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
        <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }}>
          {[
            { icon: Users, label: "Active Students", value: earnings?.activeStudents ?? 0, color: "text-primary", bg: "bg-primary/10" },
            { icon: DollarSign, label: "Monthly Revenue", value: `$${earnings?.monthlyRevenue ?? 0}`, color: "text-primary", bg: "bg-primary/10" },
            { icon: Star, label: "Rating", value: mentor.rating, color: "text-amber-400", bg: "bg-amber-400/10" },
            { icon: TrendingUp, label: "Total Subscribers", value: earnings?.allTimeSubs ?? 0, color: "text-pink", bg: "bg-pink/10" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="rounded-2xl border border-border bg-card p-4 card-pink-hover cursor-default"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-8 w-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <span className="font-heading text-2xl font-bold text-foreground">{stat.value}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Tabbed Content */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="w-full grid grid-cols-3 h-11">
            <TabsTrigger value="profile" className="text-xs font-semibold">
              <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Profile
            </TabsTrigger>
            <TabsTrigger value="content" className="text-xs font-semibold">
              <Crown className="h-3.5 w-3.5 mr-1.5" /> Exclusive Content
            </TabsTrigger>
            <TabsTrigger value="students" className="text-xs font-semibold">
              <Users className="h-3.5 w-3.5 mr-1.5" /> Students
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
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
            <section>
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
          </TabsContent>

          <TabsContent value="content">
            <MentorContentManager mentorId={mentor.id} />
          </TabsContent>

          <TabsContent value="students">
            <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Your Students ({students.length})
            </h2>
            {students.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                  <Users className="h-10 w-10 text-primary/20 mx-auto mb-4" />
                </motion.div>
                <p className="text-sm text-foreground font-medium mb-1">No active students yet</p>
                <p className="text-xs text-muted-foreground">They'll appear here once someone subscribes to your mentorship.</p>
              </motion.div>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </PageTransition>
  );
};

export default MentorDashboard;
