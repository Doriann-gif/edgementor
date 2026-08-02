import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMyMentorProfile, useUpdateMentorProfile, useMentorEarnings } from "@/hooks/use-mentor-dashboard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MentorContentManager from "@/components/MentorContentManager";
import MentorProfileEditor from "@/components/MentorProfileEditor";
import PageTransition from "@/components/PageTransition";
import IncomeTab from "@/components/mentor-dashboard/IncomeTab";
import MentorOverviewTab from "@/components/mentor-dashboard/MentorOverviewTab";
import StudentsTab from "@/components/mentor-dashboard/StudentsTab";
import { motion } from "framer-motion";
import {
  LogOut, Users, DollarSign, TrendingUp, Edit3,
  Star, Eye, Tag, Crown, BookOpen, LayoutDashboard,
} from "lucide-react";
import { toast } from "sonner";

const MentorDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: mentor, isLoading } = useMyMentorProfile();
  const updateProfile = useUpdateMentorProfile();
  const [tab, setTab] = useState("overview");

  const { data: earnings } = useMentorEarnings(mentor?.id, mentor?.monthly_price ?? 0);

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

  const handleSaveProfile = async (updates: any) => {
    await updateProfile.mutateAsync({ id: mentor.id, updates });
  };

  const handleToggleAvailability = async () => {
    try {
      await updateProfile.mutateAsync({ id: mentor.id, updates: { available: !mentor.available } });
      toast.success(mentor.available ? "You're now unavailable." : "You're now available!");
    } catch { toast.error("Failed to update availability."); }
  };

  return (
    <PageTransition>
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground font-heading font-bold text-base">{mentor.avatar}</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-xl font-bold text-foreground tracking-tight">{mentor.name}</h1>
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${mentor.available ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {mentor.available ? "Live" : "Hidden"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{mentor.experience} · {mentor.session} session · ${mentor.monthly_price}/mo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/mentor/${mentor.id}`}><Button variant="ghost" size="sm" className="text-xs h-8"><Eye className="h-3.5 w-3.5 mr-1" /> Preview</Button></Link>
            <Link to="/codes"><Button variant="ghost" size="sm" className="text-xs h-8"><Tag className="h-3.5 w-3.5 mr-1" /> Codes</Button></Link>
            <Button variant="ghost" size="sm" className="text-xs h-8" onClick={signOut}><LogOut className="h-3.5 w-3.5" /></Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {[
            { icon: Users, label: "Active students", value: earnings?.activeStudents ?? 0 },
            { icon: DollarSign, label: mentor.payment_type === "one_time" ? "Est. net / sale" : "Est. net / mo", value: `$${(mentor.payment_type === "one_time" ? earnings?.netPerSale : earnings?.monthlyNet) ?? 0}` },
            { icon: Star, label: "Rating", value: mentor.rating || "—" },
            { icon: TrendingUp, label: "All-time subs", value: earnings?.allTimeSubs ?? 0 },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0"><stat.icon className="h-4 w-4 text-muted-foreground" /></div>
              <div className="min-w-0">
                <span className="font-heading text-lg font-bold text-foreground leading-none">{stat.value}</span>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="w-full grid grid-cols-3 sm:grid-cols-5 h-auto sm:h-10 gap-1 bg-muted/50 rounded-xl p-1">
            <TabsTrigger value="overview" className="text-xs font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"><LayoutDashboard className="h-3.5 w-3.5 mr-1.5" /> Overview</TabsTrigger>
            <TabsTrigger value="profile" className="text-xs font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"><Edit3 className="h-3.5 w-3.5 mr-1.5" /> Profile</TabsTrigger>
            <TabsTrigger value="content" className="text-xs font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"><Crown className="h-3.5 w-3.5 mr-1.5" /> Content</TabsTrigger>
            <TabsTrigger value="students" className="text-xs font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"><Users className="h-3.5 w-3.5 mr-1.5" /> Students</TabsTrigger>
            <TabsTrigger value="income" className="text-xs font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"><DollarSign className="h-3.5 w-3.5 mr-1.5" /> Income</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <MentorOverviewTab mentor={mentor} mentorUserId={user.id} earnings={earnings} onGoToTab={setTab} />
          </TabsContent>

          <TabsContent value="profile">
            <MentorProfileEditor mentor={mentor} onUpdate={handleSaveProfile} onToggleAvailability={handleToggleAvailability} isUpdating={updateProfile.isPending} />
          </TabsContent>

          <TabsContent value="content">
            <MentorContentManager mentorId={mentor.id} />
          </TabsContent>

          <TabsContent value="students">
            <StudentsTab mentorId={mentor.id} />
          </TabsContent>

          <TabsContent value="income">
            <IncomeTab mentorId={mentor.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </PageTransition>
  );
};

export default MentorDashboard;
