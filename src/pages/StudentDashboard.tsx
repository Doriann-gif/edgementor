import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptions, useMessages, useMarkMessageRead, useSavedMentors } from "@/hooks/use-student";
import { useQueryClient } from "@tanstack/react-query";
import { useMentors } from "@/hooks/use-mentors";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  ArrowLeft, Star, Clock, BookOpen, Heart, MessageSquare,
  Mail, MailOpen, LogOut, ChevronRight, Users, CreditCard, MoreVertical,
  XCircle, ExternalLink, TrendingUp, Sparkles, CalendarDays, Search, Flame, Target, Award,
  BarChart3,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Mentor } from "@/types/mentor";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const getDaysSince = (dateStr: string) => {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
};

const StudentDashboard = () => {
  const { user, loading, signOut } = useAuth();
  const { data: subscriptions = [], isLoading: subsLoading } = useSubscriptions();
  const { data: savedMentorIds, isLoading: savedLoading } = useSavedMentors();
  const { data: allMentors = [] } = useMentors();
  const { data: messages = [], isLoading: msgsLoading } = useMessages();
  const markRead = useMarkMessageRead();
  const [portalLoading, setPortalLoading] = useState(false);
  const [canManageBilling, setCanManageBilling] = useState(false);
  const [cancellingSubId, setCancellingSubId] = useState<string | null>(null);
  const [confirmCancelSub, setConfirmCancelSub] = useState<{ id: string; mentorName: string } | null>(null);
  const [activeTab, setActiveTab] = useState("mentorships");
  const queryClient = useQueryClient();

  useEffect(() => {
    let isActive = true;
    const checkBillingAccess = async () => {
      if (!user) { if (isActive) setCanManageBilling(false); return; }
      const { data, error } = await supabase.functions.invoke("check-subscription", { body: {} });
      if (isActive) setCanManageBilling(!error && !!data?.subscribed);
    };
    void checkBillingAccess();
    return () => { isActive = false; };
  }, [user?.id]);

  const openBillingPortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) {
        let noCustomer = false;
        const errorMessage = typeof error === "object" && error && "message" in error ? String((error as { message?: string }).message ?? "") : String(error);
        if (typeof error === "object" && error && "context" in error) {
          const response = (error as { context?: Response }).context;
          if (response) {
            const errorBody = await response.json().catch(() => null);
            if (errorBody?.error === "no_customer") noCustomer = true;
          }
        }
        if (noCustomer || errorMessage.includes("no_customer") || errorMessage.includes("404")) {
          toast.error("You need to complete a Stripe checkout first before managing billing.");
          return;
        }
        throw error;
      }
      if (data?.error === "no_customer") { toast.error("You need to complete a Stripe checkout first before managing billing."); return; }
      if (data?.url) window.open(data.url, "_blank"); else throw new Error("No portal URL returned");
    } catch (err: any) {
      toast.error(err.message || "Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  const cancelSubscription = async (subId: string) => {
    setCancellingSubId(subId);
    try {
      const { error } = await supabase.from("subscriptions").update({ status: "cancelled" }).eq("id", subId).eq("user_id", user!.id);
      if (error) throw error;
      toast.success("Membership cancelled successfully.");
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel membership.");
    } finally {
      setCancellingSubId(null);
      setConfirmCancelSub(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  const savedMentors = allMentors.filter((m) => savedMentorIds?.has(m.id));
  const unreadCount = messages.filter((m) => !m.is_read).length;
  const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "Trader";
  const totalSpend = subscriptions.reduce((sum: number, s: any) => sum + ((s.mentors as Mentor)?.monthly_price || 0), 0);
  const oldestSub = subscriptions.length > 0 ? subscriptions.reduce((oldest: any, s: any) => new Date(s.started_at) < new Date(oldest.started_at) ? s : oldest) : null;
  const learningDays = oldestSub ? getDaysSince(oldestSub.started_at) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-[-80px] right-1/4 w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[130px]"
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-60px] left-1/3 w-[400px] h-[400px] bg-pink/[0.03] rounded-full blur-[100px]"
          animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div className="flex items-center justify-between mb-6" initial="hidden" animate="show">
          <div>
            <motion.div variants={fadeUp} custom={0}>
              <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
                <ArrowLeft className="h-4 w-4" /> Back to home
              </Link>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {getGreeting()},{" "}
              <span className="bg-gradient-to-r from-primary via-pink to-primary bg-clip-text text-transparent">{displayName}</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Your trading journey at a glance
            </motion.p>
          </div>
          <motion.div variants={fadeUp} custom={1} className="flex items-center gap-2">
            {canManageBilling && (
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Button variant="outline" size="sm" className="text-xs" onClick={openBillingPortal} disabled={portalLoading}>
                  <CreditCard className="h-3.5 w-3.5 mr-1.5" /> {portalLoading ? "Opening..." : "Manage Billing"}
                </Button>
              </motion.div>
            )}
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Button variant="outline" size="sm" className="text-xs" onClick={signOut}>
                <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign Out
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Welcome Hero Card */}
        <motion.div
          className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-pink/5 p-5 sm:p-6 mb-8 overflow-hidden"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-pink/5 to-transparent rounded-tr-full pointer-events-none" />
          
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Flame className="h-5 w-5 text-amber-400" />
                </motion.div>
                <span className="font-heading font-bold text-lg text-foreground">
                  {learningDays > 0 ? `${learningDays} Day Streak!` : "Start Your Streak!"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                {learningDays > 30
                  ? "You're on fire! Keep up the incredible consistency."
                  : learningDays > 0
                    ? "Great start! Consistency builds champions."
                    : "Subscribe to a mentor and begin your trading journey today."}
              </p>
            </div>
            
            {/* Achievement Badges */}
            <div className="flex items-center gap-2">
              {[
                { icon: Target, label: "First Sub", unlocked: subscriptions.length > 0, color: "text-primary" },
                { icon: CalendarDays, label: "7 Days", unlocked: learningDays >= 7, color: "text-amber-400" },
                { icon: Award, label: "30 Days", unlocked: learningDays >= 30, color: "text-pink-400" },
                { icon: Sparkles, label: "100 Days", unlocked: learningDays >= 100, color: "text-blue-400" },
              ].map((badge, i) => (
                <motion.div
                  key={badge.label}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
                  className={`flex flex-col items-center gap-1 ${badge.unlocked ? "" : "opacity-30"}`}
                  title={badge.label}
                >
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                    badge.unlocked ? "bg-card border border-border shadow-sm" : "bg-muted/50 border border-border/50"
                  }`}>
                    <badge.icon className={`h-4 w-4 ${badge.unlocked ? badge.color : "text-muted-foreground"}`} />
                  </div>
                  <span className="text-[9px] text-muted-foreground font-medium">{badge.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {[
            { icon: BookOpen, label: "Active Mentorships", value: subscriptions.length, color: "text-primary", bgColor: "bg-primary/10", borderColor: "border-primary/20" },
            { icon: Heart, label: "Saved Mentors", value: savedMentors.length, color: "text-pink-400", bgColor: "bg-pink-400/10", borderColor: "border-pink-400/20" },
            { icon: MessageSquare, label: "Unread Messages", value: unreadCount, color: "text-amber-400", bgColor: "bg-amber-400/10", borderColor: "border-amber-400/20" },
            { icon: CalendarDays, label: "Days Learning", value: learningDays, color: "text-blue-400", bgColor: "bg-blue-400/10", borderColor: "border-blue-400/20" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              custom={i}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`rounded-2xl border ${stat.borderColor} bg-card p-4 cursor-default`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`h-8 w-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <span className="font-heading text-2xl font-bold text-foreground">{stat.value}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Weekly Activity Chart */}
        <motion.div
          className="rounded-2xl border border-border bg-card p-5 mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-sm text-foreground">Weekly Activity</h3>
                <p className="text-[11px] text-muted-foreground">Your learning engagement over the past 7 days</p>
              </div>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={(() => {
                  const days = [];
                  for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
                    const dayStr = d.toISOString().split("T")[0];
                    const msgsOnDay = messages.filter(
                      (m) => m.created_at.split("T")[0] === dayStr
                    ).length;
                    const hasActiveSub = subscriptions.some(
                      (s: any) => new Date(s.started_at) <= d && (!s.expires_at || new Date(s.expires_at) >= d)
                    );
                    days.push({
                      day: dayLabel,
                      messages: msgsOnDay,
                      activity: hasActiveSub ? Math.max(1, msgsOnDay + (i === 0 ? 1 : 0)) : msgsOnDay,
                    });
                  }
                  return days;
                })()}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="activity"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#activityGradient)"
                  name="Activity"
                  dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stroke="hsl(var(--pink, 330 80% 60%))"
                  strokeWidth={2}
                  fill="none"
                  name="Messages"
                  dot={{ r: 3, fill: "hsl(var(--pink, 330 80% 60%))", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>


        <motion.div
          className="flex flex-wrap gap-2 mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Link to="/settings">
            <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" size="sm" className="text-xs gap-1.5 rounded-full">
                <Users className="h-3.5 w-3.5" /> Account Settings
              </Button>
            </motion.div>
          </Link>
        </motion.div>

        {/* Learning Progress (show when subscriptions exist) */}
        {subscriptions.length > 0 && (
          <motion.div
            className="rounded-2xl border border-border bg-card p-5 mb-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Flame className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-sm text-foreground">Your Trading Journey</h3>
                  <p className="text-[11px] text-muted-foreground">Keep going — consistency is key!</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">${totalSpend}/mo invested</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Target, label: "Mentors", value: subscriptions.length, max: 5, tip: "Track up to 5 mentors" },
                { icon: CalendarDays, label: "Days Active", value: Math.min(learningDays, 365), max: 365, tip: "1 year milestone" },
                { icon: Award, label: "Messages Read", value: messages.filter(m => m.is_read).length, max: Math.max(messages.length, 1), tip: "Stay on top of updates" },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <item.icon className="h-3 w-3" /> {item.label}
                    </span>
                    <span className="text-[11px] font-medium text-foreground">{item.value}/{item.max}</span>
                  </div>
                  <Progress value={(item.value / item.max) * 100} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground/70">{item.tip}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tabbed Content */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="w-full grid grid-cols-3 h-11 bg-muted/50 border border-border">
              <TabsTrigger value="mentorships" className="text-xs font-semibold gap-1.5 data-[state=active]:shadow-md">
                <BookOpen className="h-3.5 w-3.5" /> Mentorships
              </TabsTrigger>
              <TabsTrigger value="favourites" className="text-xs font-semibold gap-1.5 data-[state=active]:shadow-md">
                <Heart className="h-3.5 w-3.5" /> Favourites
              </TabsTrigger>
              <TabsTrigger value="messages" className="text-xs font-semibold gap-1.5 data-[state=active]:shadow-md">
                <MessageSquare className="h-3.5 w-3.5" /> Messages
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 min-w-[18px] text-center"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Active Mentorships Tab */}
            <TabsContent value="mentorships">
              <AnimatePresence mode="wait">
                {subsLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-12">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Loading mentorships...</p>
                  </motion.div>
                ) : subscriptions.length === 0 ? (
                  <motion.div key="empty" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
                    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                      <BookOpen className="h-10 w-10 text-primary/20 mx-auto mb-4" />
                    </motion.div>
                    <p className="text-sm text-muted-foreground mb-1">You don't have any active mentorships yet.</p>
                    <p className="text-xs text-muted-foreground/70 mb-5">Find a mentor to start your trading journey.</p>
                    <Link to="/mentors">
                      <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                        <Button size="sm" className="text-xs font-semibold shadow-lg shadow-primary/20">
                          Browse Mentors <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </motion.div>
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div key="list" variants={stagger} initial="hidden" animate="show" className="space-y-3">
                    {subscriptions.map((sub: any, i: number) => {
                      const mentor = sub.mentors as Mentor;
                      const days = getDaysSince(sub.started_at);
                      return (
                        <motion.div
                          key={sub.id}
                          variants={fadeUp}
                          custom={i}
                          whileHover={{ y: -2, scale: 1.005 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                        >
                          <Link to={`/mentorship/${mentor.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                            <motion.div
                              whileHover={{ rotate: [0, -5, 5, 0] }}
                              transition={{ duration: 0.4 }}
                              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-pink-400/10 text-primary font-heading font-bold text-sm border border-primary/20"
                            >
                              {mentor.avatar}
                            </motion.div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-heading font-semibold text-foreground text-sm">{mentor.name}</h3>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {days}d ago</span>
                                <span className="flex items-center gap-1 text-amber-400"><Star className="h-3 w-3 fill-current" /> {mentor.rating}</span>
                                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {mentor.students} students</span>
                              </div>
                            </div>
                          </Link>
                          <div className="text-right shrink-0 mr-1">
                            <span className="font-heading font-bold text-foreground text-sm">${mentor.monthly_price}</span>
                            <span className="text-[10px] text-muted-foreground block">/month</span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0 hover:bg-muted">
                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem asChild>
                                <Link to={`/mentorship/${mentor.id}`} className="flex items-center gap-2">
                                  <ExternalLink className="h-3.5 w-3.5" /> Access Content
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/mentor/${mentor.id}`} className="flex items-center gap-2">
                                  <Users className="h-3.5 w-3.5" /> View Profile
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive flex items-center gap-2"
                                onClick={() => setConfirmCancelSub({ id: sub.id, mentorName: mentor.name })}
                              >
                                <XCircle className="h-3.5 w-3.5" /> Cancel Membership
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            {/* Favourites Tab */}
            <TabsContent value="favourites">
              <AnimatePresence mode="wait">
                {savedLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-12">
                    <div className="h-6 w-6 border-2 border-pink-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Loading favourites...</p>
                  </motion.div>
                ) : savedMentors.length === 0 ? (
                  <motion.div key="empty" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
                    <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                      <Heart className="h-10 w-10 text-pink-400/20 mx-auto mb-4" />
                    </motion.div>
                    <p className="text-sm text-muted-foreground mb-1">No favourite mentors yet.</p>
                    <p className="text-xs text-muted-foreground/70 mb-5">Browse mentors and tap the heart icon to save your favourites.</p>
                    <Link to="/mentors">
                      <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                        <Button size="sm" variant="outline" className="text-xs font-semibold">
                          Find Mentors <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </motion.div>
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div key="list" variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedMentors.map((mentor, i) => (
                      <motion.div key={mentor.id} variants={fadeUp} custom={i}>
                        <Link to={`/mentor/${mentor.id}`}>
                          <motion.div
                            whileHover={{ y: -3, scale: 1.01 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-pink-400/30 hover:shadow-lg hover:shadow-pink-400/5"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-400/20 to-primary/10 text-primary font-heading font-bold text-xs border border-pink-400/20">
                              {mentor.avatar}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-heading font-semibold text-foreground text-sm truncate">{mentor.name}</h3>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <span className="flex items-center gap-1 text-amber-400"><Star className="h-3 w-3 fill-current" /> {mentor.rating}</span>
                                <span>${mentor.monthly_price}/mo</span>
                                <span>{mentor.students} students</span>
                              </div>
                            </div>
                            <Heart className="h-4 w-4 fill-pink-400 text-pink-400 shrink-0" />
                          </motion.div>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages">
              <AnimatePresence mode="wait">
                {msgsLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-12">
                    <div className="h-6 w-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Loading messages...</p>
                  </motion.div>
                ) : messages.length === 0 ? (
                  <motion.div key="empty" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
                    <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                      <Mail className="h-10 w-10 text-amber-400/20 mx-auto mb-4" />
                    </motion.div>
                    <p className="text-sm text-muted-foreground">No messages yet.</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Messages from your mentors will appear here.</p>
                  </motion.div>
                ) : (
                  <motion.div key="list" variants={stagger} initial="hidden" animate="show" className="space-y-3">
                    {messages.map((msg, i) => (
                      <motion.div
                        key={msg.id}
                        variants={fadeUp}
                        custom={i}
                        whileHover={{ y: -2 }}
                        className={`rounded-2xl border bg-card p-4 transition-all cursor-default ${
                          msg.is_read ? "border-border" : "border-primary/30 bg-primary/[0.02] shadow-md shadow-primary/5"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <motion.div
                              whileHover={{ scale: 1.15 }}
                              className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                msg.is_read ? "bg-muted" : "bg-primary/10"
                              }`}
                            >
                              {msg.is_read ? (
                                <MailOpen className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <Mail className="h-3.5 w-3.5 text-primary" />
                              )}
                            </motion.div>
                            <div>
                              <span className="font-heading font-semibold text-sm text-foreground">{msg.sender_name}</span>
                              {!msg.is_read && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5">NEW</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(msg.created_at).toLocaleDateString()}
                            </span>
                            {!msg.is_read && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => markRead.mutate(msg.id)}
                                className="text-[10px] text-primary hover:underline font-medium"
                              >
                                Mark read
                              </motion.button>
                            )}
                          </div>
                        </div>
                        <h4 className="text-sm font-medium text-foreground mb-1">{msg.subject}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{msg.body}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Suggested Mentors (when no subscriptions) */}
        {subscriptions.length === 0 && allMentors.length > 0 && (
          <motion.div
            className="mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="font-heading font-semibold text-foreground text-base mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Recommended Mentors
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {allMentors.slice(0, 3).map((mentor, i) => (
                <motion.div key={mentor.id} variants={fadeUp} custom={i} initial="hidden" animate="show">
                  <Link to={`/mentor/${mentor.id}`}>
                    <motion.div
                      whileHover={{ y: -4, scale: 1.01 }}
                      className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading font-bold text-xs">
                          {mentor.avatar}
                        </div>
                        <div>
                          <h4 className="font-heading font-semibold text-sm text-foreground">{mentor.name}</h4>
                          <span className="text-[11px] text-muted-foreground">{mentor.experience}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{mentor.bio}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-amber-400"><Star className="h-3 w-3 fill-current" /> {mentor.rating}</span>
                        <span className="font-medium text-foreground">${mentor.monthly_price}/mo</span>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!confirmCancelSub} onOpenChange={(open) => !open && setConfirmCancelSub(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Membership</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your membership with <span className="font-semibold text-foreground">{confirmCancelSub?.mentorName}</span>? You'll lose access to their exclusive content immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Membership</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmCancelSub && cancelSubscription(confirmCancelSub.id)}
              disabled={!!cancellingSubId}
            >
              {cancellingSubId ? "Cancelling..." : "Yes, Cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StudentDashboard;
