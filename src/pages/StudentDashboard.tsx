import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptions, useMessages, useMarkMessageRead, useSavedMentors, useSendMessage } from "@/hooks/use-student";
import { useMentors } from "@/hooks/use-mentors";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Star, Clock, BookOpen, Heart, MessageSquare,
  Mail, MailOpen, LogOut, ChevronRight, Users, CreditCard, MoreVertical,
  XCircle, ExternalLink, Send, PenSquare,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Mentor } from "@/types/mentor";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: "easeOut" as const },
  }),
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

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
  const sendMessage = useSendMessage();
  const [portalLoading, setPortalLoading] = useState(false);
  const [canManageBilling, setCanManageBilling] = useState(false);
  const [cancellingSubId, setCancellingSubId] = useState<string | null>(null);
  const [confirmCancelSub, setConfirmCancelSub] = useState<{ id: string; mentorName: string } | null>(null);
  const [activeTab, setActiveTab] = useState("mentorships");
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

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

  // Stripe is the source of truth for recurring billing — cancelling only the
  // local row would keep the card being charged. Send the user to the secure
  // billing portal; check-subscription syncs the local status afterwards.
  const cancelSubscription = async (subId: string) => {
    setCancellingSubId(subId);
    try {
      await openBillingPortal();
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
  const totalSpend = subscriptions.reduce((sum: number, s: any) => {
    const m = s.mentors as Mentor;
    // One-time purchases aren't part of recurring monthly spend
    return m?.payment_type === "one_time" ? sum : sum + (m?.monthly_price || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <motion.div className="flex items-center justify-between mb-10" initial="hidden" animate="show">
          <div>
            <motion.h1 variants={fadeUp} custom={0} className="font-heading text-2xl font-bold text-foreground tracking-tight">
              {getGreeting()}, {displayName}
            </motion.h1>
            <motion.p variants={fadeUp} custom={1} className="text-sm text-muted-foreground mt-1">
              Your trading journey at a glance
            </motion.p>
          </div>
          <motion.div variants={fadeUp} custom={1} className="flex items-center gap-3">
            {canManageBilling && (
              <Button variant="outline" size="sm" className="text-xs" onClick={openBillingPortal} disabled={portalLoading}>
                <CreditCard className="h-3.5 w-3.5 mr-1.5" /> {portalLoading ? "Opening..." : "Manage Billing"}
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-xs" onClick={signOut}>
              <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign Out
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {[
            { icon: BookOpen, label: "Active Mentorships", value: subscriptions.length },
            { icon: Heart, label: "Saved Mentors", value: savedMentors.length },
            { icon: MessageSquare, label: "Unread Messages", value: unreadCount },
            { icon: CreditCard, label: "Monthly Spend", value: `$${totalSpend}` },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              custom={i}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <span className="font-heading text-2xl font-bold text-foreground">{stat.value}</span>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Tabbed Content */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="w-full grid grid-cols-3 h-11 bg-muted/50 border border-border rounded-xl">
              <TabsTrigger value="mentorships" className="text-xs font-semibold gap-1.5 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <BookOpen className="h-3.5 w-3.5" /> Mentorships
              </TabsTrigger>
              <TabsTrigger value="favourites" className="text-xs font-semibold gap-1.5 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Heart className="h-3.5 w-3.5" /> Favourites
              </TabsTrigger>
              <TabsTrigger value="messages" className="text-xs font-semibold gap-1.5 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <MessageSquare className="h-3.5 w-3.5" /> Messages
                {unreadCount > 0 && (
                  <span className="ml-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 min-w-[18px] text-center">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Active Mentorships Tab */}
            <TabsContent value="mentorships">
              <AnimatePresence mode="wait">
                {subsLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Loading mentorships...</p>
                  </motion.div>
                ) : subscriptions.length === 0 ? (
                  <motion.div key="empty" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
                    <BookOpen className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-1">No active mentorships yet.</p>
                    <p className="text-xs text-muted-foreground/70 mb-6">Find a mentor to start your trading journey.</p>
                    <Link to="/mentors">
                      <Button size="sm" className="text-xs font-semibold">
                        Browse Mentors <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
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
                          className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/20"
                        >
                          <Link to={`/mentorship/${mentor.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-foreground font-heading font-bold text-sm">
                              {mentor.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-heading font-semibold text-foreground text-sm">{mentor.name}</h3>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {days}d ago</span>
                                <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {mentor.rating}</span>
                                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {mentor.students}</span>
                              </div>
                            </div>
                          </Link>
                          <div className="text-right shrink-0 mr-1">
                            <span className="font-heading font-bold text-foreground text-sm">${mentor.monthly_price}</span>
                            <span className="text-[10px] text-muted-foreground block">{mentor.payment_type === "one_time" ? "lifetime" : "/month"}</span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
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
                              {mentor.payment_type !== "one_time" && (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive flex items-center gap-2"
                                  onClick={() => setConfirmCancelSub({ id: sub.id, mentorName: mentor.name })}
                                >
                                  <XCircle className="h-3.5 w-3.5" /> Cancel Membership
                                </DropdownMenuItem>
                              )}
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
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
                    <div className="h-6 w-6 border-2 border-border border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Loading favourites...</p>
                  </motion.div>
                ) : savedMentors.length === 0 ? (
                  <motion.div key="empty" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
                    <Heart className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-1">No favourite mentors yet.</p>
                    <p className="text-xs text-muted-foreground/70 mb-6">Browse mentors and tap the heart icon to save your favourites.</p>
                    <Link to="/mentors">
                      <Button size="sm" variant="outline" className="text-xs font-semibold">
                        Find Mentors <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div key="list" variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedMentors.map((mentor, i) => (
                      <motion.div key={mentor.id} variants={fadeUp} custom={i}>
                        <Link to={`/mentor/${mentor.id}`}>
                          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/20">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground font-heading font-bold text-xs">
                              {mentor.avatar}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-heading font-semibold text-foreground text-sm truncate">{mentor.name}</h3>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {mentor.rating}</span>
                                <span>${mentor.monthly_price}/mo</span>
                                <span>{mentor.students} students</span>
                              </div>
                            </div>
                            <Heart className="h-4 w-4 fill-primary text-primary shrink-0" />
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold text-sm text-foreground">Messages</h3>
                {subscriptions.length > 0 && (
                  <Button size="sm" className="text-xs" onClick={() => { setComposeOpen(true); setComposeTo(""); setComposeSubject(""); setComposeBody(""); }}>
                    <PenSquare className="h-3.5 w-3.5 mr-1.5" /> New Message
                  </Button>
                )}
              </div>
              <AnimatePresence mode="wait">
                {msgsLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Loading messages...</p>
                  </motion.div>
                ) : messages.length === 0 ? (
                  <motion.div key="empty" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
                    <Mail className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No messages yet.</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Send a message to your mentor to get started.</p>
                    {subscriptions.length > 0 && (
                      <Button size="sm" className="text-xs mt-4" onClick={() => setComposeOpen(true)}>
                        <PenSquare className="h-3.5 w-3.5 mr-1.5" /> Compose
                      </Button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="list" variants={stagger} initial="hidden" animate="show" className="space-y-3">
                    {messages.map((msg, i) => {
                      const isSent = msg.sender_user_id === user!.id;
                      return (
                        <motion.div
                          key={msg.id}
                          variants={fadeUp}
                          custom={i}
                          className={`rounded-xl border bg-card p-4 ${
                            !isSent && !msg.is_read ? "border-primary/20" : "border-border"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                isSent ? "bg-primary/10" : msg.is_read ? "bg-muted" : "bg-primary/10"
                              }`}>
                                {isSent ? (
                                  <Send className="h-3.5 w-3.5 text-primary" />
                                ) : msg.is_read ? (
                                  <MailOpen className="h-3.5 w-3.5 text-muted-foreground" />
                                ) : (
                                  <Mail className="h-3.5 w-3.5 text-primary" />
                                )}
                              </div>
                              <div>
                                <span className="font-heading font-semibold text-sm text-foreground">
                                  {isSent ? `To: ${msg.sender_name === (user?.user_metadata?.display_name || user?.email?.split("@")[0]) ? "Mentor" : msg.sender_name}` : msg.sender_name}
                                </span>
                                {isSent && (
                                  <span className="ml-2 inline-flex items-center rounded-full bg-muted text-muted-foreground text-[9px] font-bold px-1.5 py-0.5">SENT</span>
                                )}
                                {!isSent && !msg.is_read && (
                                  <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5">NEW</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(msg.created_at).toLocaleDateString()}
                              </span>
                              {!isSent && !msg.is_read && (
                                <button
                                  onClick={() => markRead.mutate(msg.id)}
                                  className="text-[10px] text-primary hover:underline font-medium"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                          </div>
                          <h4 className="text-sm font-medium text-foreground mb-1">{msg.subject}</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">{msg.body}</p>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Compose Message Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">New Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">To</label>
              <select
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="">Select a mentor...</option>
                {subscriptions.map((sub: any) => {
                  const mentor = sub.mentors as Mentor;
                  return (
                    <option key={mentor.id} value={mentor.user_id || ""}>
                      {mentor.name}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Subject</label>
              <Input
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="e.g. Question about your strategy"
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Message</label>
              <Textarea
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Write your message..."
                rows={4}
                className="text-sm"
              />
            </div>
            <Button
              className="w-full text-sm"
              disabled={!composeTo || !composeSubject.trim() || !composeBody.trim() || sendMessage.isPending}
              onClick={async () => {
                try {
                  const mentor = subscriptions.find((s: any) => (s.mentors as Mentor).user_id === composeTo);
                  const mentorName = mentor ? (mentor.mentors as Mentor).name : "Mentor";
                  const senderName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Student";
                  await sendMessage.mutateAsync({
                    recipientId: composeTo,
                    subject: composeSubject.trim(),
                    body: composeBody.trim(),
                    senderName,
                  });
                  toast.success(`Message sent to ${mentorName}`);
                  setComposeOpen(false);
                } catch (err: any) {
                  toast.error(err.message || "Failed to send message");
                }
              }}
            >
              {sendMessage.isPending ? "Sending..." : <><Send className="h-3.5 w-3.5 mr-1.5" /> Send Message</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!confirmCancelSub} onOpenChange={(open) => !open && setConfirmCancelSub(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Membership</AlertDialogTitle>
            <AlertDialogDescription>
              To cancel your membership with <span className="font-semibold text-foreground">{confirmCancelSub?.mentorName}</span>, we'll open the secure Stripe billing portal where you can cancel the subscription. Access ends after cancellation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Membership</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmCancelSub && cancelSubscription(confirmCancelSub.id)}
              disabled={!!cancellingSubId}
            >
              {cancellingSubId ? "Opening portal..." : "Continue to Portal"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StudentDashboard;
