import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMyMentorProfile, useUpdateMentorProfile, useMentorStudents, useMentorEarnings } from "@/hooks/use-mentor-dashboard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MentorContentManager from "@/components/MentorContentManager";
import MentorProfileEditor from "@/components/MentorProfileEditor";
import PageTransition from "@/components/PageTransition";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  ArrowLeft, LogOut, Users, DollarSign, TrendingUp, Edit3, Save,
  X, Clock, Star, Eye, Tag, Crown, Sparkles, BookOpen, Wallet,
  ChevronDown, ChevronUp, Banknote, ArrowDownToLine, RefreshCw, ExternalLink, BarChart3, History,
  MessageSquare, Mail, MailOpen, Send,
} from "lucide-react";
import { toast } from "sonner";

/* ── Income Tab Component ── */
const IncomeTab = ({ mentorId }: { mentorId: string }) => {
  const queryClient = useQueryClient();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { data: balance, isLoading, refetch } = useQuery({
    queryKey: ["connect-balance", mentorId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await supabase.functions.invoke("connect-balance", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (resp.error) throw resp.error;
      return resp.data as {
        onboarded: boolean;
        available: number;
        pending: number;
        total_earned: number;
        payouts_enabled: boolean;
        auto_payout: boolean;
        payout_history?: { id: string; amount: number; status: string; created: number; arrival_date: number; description: string | null }[];
      };
    },
  });

  const onboard = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await supabase.functions.invoke("create-connect-account", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (resp.error) throw resp.error;
      if (resp.data?.error) throw new Error(resp.data.error);
      return resp.data;
    },
    onSuccess: (data) => {
      if (data?.url) window.open(data.url, "_blank");
      else toast.error("No onboarding URL returned. Please try again.");
    },
    onError: (e: any) => {
      const msg = e?.message || String(e);
      if (msg.includes("signed up for Connect")) {
        toast.error("Stripe Connect is not yet activated. The platform admin needs to enable Connect in the Stripe Dashboard.");
      } else {
        toast.error(msg || "Failed to start onboarding");
      }
    },
  });

  const withdraw = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await supabase.functions.invoke("process-withdrawal", {
        body: { action: "withdraw" },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (resp.error) throw resp.error;
      return resp.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
    },
    onError: (e: any) => toast.error(e?.message || "Withdrawal failed"),
  });

  const toggleAuto = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await supabase.functions.invoke("process-withdrawal", {
        body: { action: "toggle_auto_payout" },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (resp.error) throw resp.error;
      return resp.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
    },
    onError: () => toast.error("Failed to toggle auto-payout"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse">
            <div className="h-4 w-32 bg-muted rounded mb-3" />
            <div className="h-8 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!balance?.onboarded) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
          <Wallet className="h-10 w-10 text-primary/20 mx-auto mb-4" />
        </motion.div>
        <p className="text-sm text-foreground font-medium mb-1">Set up payouts</p>
        <p className="text-xs text-muted-foreground mb-4">Connect your bank account to start receiving earnings from subscriptions.</p>
        <Button size="sm" onClick={() => onboard.mutate()} disabled={onboard.isPending}>
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
          {onboard.isPending ? "Setting up…" : "Set Up Payouts"}
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Earnings Overview */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" /> Earnings Overview
          </h2>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="rounded-xl bg-muted/50 border border-border p-4 text-center">
            <DollarSign className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
            <p className="font-heading text-2xl font-bold text-foreground">${balance.available.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Available</p>
          </div>
          <div className="rounded-xl bg-muted/50 border border-border p-4 text-center">
            <Clock className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
            <p className="font-heading text-2xl font-bold text-foreground">${balance.pending.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Pending</p>
          </div>
          <div className="rounded-xl bg-muted/50 border border-border p-4 text-center">
            <TrendingUp className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
            <p className="font-heading text-2xl font-bold text-foreground">${balance.total_earned.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Earned</p>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="rounded-xl bg-muted/30 border border-border/50 p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Revenue Breakdown</p>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Gross Revenue</span>
              <span className="text-sm font-semibold text-foreground">${(balance.total_earned / 0.8).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-destructive/60" />
                Platform Fee (20%)
              </span>
              <span className="text-sm text-destructive/80">−${(balance.total_earned / 0.8 * 0.2).toFixed(2)}</span>
            </div>
            <div className="border-t border-border/50 pt-2.5 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                Net Earnings (80%)
              </span>
              <span className="text-sm font-bold text-primary">${balance.total_earned.toFixed(2)}</span>
            </div>
          </div>
          {/* Visual bar */}
          <div className="mt-3 flex h-2 rounded-full overflow-hidden bg-muted">
            <div className="bg-primary rounded-l-full" style={{ width: "80%" }} />
            <div className="bg-destructive/40 rounded-r-full" style={{ width: "20%" }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground">Your earnings — 80%</span>
            <span className="text-[10px] text-muted-foreground">Platform — 20%</span>
          </div>
        </div>
      </motion.div>

      {/* Monthly Revenue Chart */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h2 className="font-heading font-semibold text-foreground text-sm">Monthly Revenue</h2>
        </div>
        {(() => {
          // Generate last 6 months of data from subscriptions context
          const months: { name: string; revenue: number }[] = [];
          const now = new Date();
          for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
              name: d.toLocaleString("default", { month: "short" }),
              revenue: 0,
            });
          }
          // Current month gets the live balance total as a rough proxy
          if (months.length > 0) {
            months[months.length - 1].revenue = balance.available + balance.pending;
            // Spread total_earned minus current across previous months as estimate
            const past = balance.total_earned - (balance.available + balance.pending);
            if (past > 0 && months.length > 1) {
              const perMonth = past / (months.length - 1);
              for (let i = 0; i < months.length - 1; i++) {
                months[i].revenue = Math.round(perMonth * 100) / 100;
              }
            }
          }
          return (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={months} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revenueGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          );
        })()}
        <p className="text-[11px] text-muted-foreground mt-2 text-center">Estimated distribution based on total earnings</p>
      </motion.div>

      {/* Withdraw Section */}
      <Collapsible open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-border bg-card">
          <CollapsibleTrigger className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors rounded-2xl">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <ArrowDownToLine className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-heading font-semibold text-foreground text-sm">Withdraw Funds</h3>
                <p className="text-xs text-muted-foreground">Transfer available balance to your bank</p>
              </div>
            </div>
            {withdrawOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-5 pb-5 pt-0 space-y-4">
              <div className="rounded-xl bg-muted/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Available to withdraw</span>
                  <span className="font-heading font-bold text-foreground">${balance.available.toFixed(2)}</span>
                </div>
                {!balance.payouts_enabled && (
                  <p className="text-xs text-amber-400">⚠ Complete your account setup to enable payouts.</p>
                )}
              </div>
              <Button
                className="w-full"
                disabled={balance.available <= 0 || !balance.payouts_enabled || withdraw.isPending}
                onClick={() => withdraw.mutate()}
              >
                <Banknote className="h-4 w-4 mr-2" />
                {withdraw.isPending ? "Processing…" : `Withdraw $${balance.available.toFixed(2)}`}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">Funds typically arrive in 2-3 business days.</p>
            </div>
          </CollapsibleContent>
        </motion.div>
      </Collapsible>

      {/* Payout Settings */}
      <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card">
          <CollapsibleTrigger className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors rounded-2xl">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-heading font-semibold text-foreground text-sm">Payout Settings</h3>
                <p className="text-xs text-muted-foreground">Configure how you receive earnings</p>
              </div>
            </div>
            {detailsOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-5 pb-5 pt-0 space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Automatic Monthly Payouts</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {balance.auto_payout
                      ? "Your balance is automatically transferred on the 1st of each month."
                      : "Manually withdraw whenever you want."}
                  </p>
                </div>
                <Switch
                  checked={balance.auto_payout}
                  onCheckedChange={() => toggleAuto.mutate()}
                  disabled={toggleAuto.isPending || !balance.payouts_enabled}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Payout Status</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Your account verification status</p>
                </div>
                <span className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${balance.payouts_enabled ? "bg-primary/10 text-primary" : "bg-amber-400/10 text-amber-400"}`}>
                  {balance.payouts_enabled ? "Enabled" : "Pending Setup"}
                </span>
              </div>
              {!balance.payouts_enabled && (
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => onboard.mutate()} disabled={onboard.isPending}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Complete Account Setup
                </Button>
              )}
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-sm font-medium text-foreground mb-1">Platform Fee</p>
                <p className="text-xs text-muted-foreground">EdgeMentor retains a 20% platform fee on each subscription payment. The remaining 80% is deposited into your balance.</p>
              </div>
            </div>
          </CollapsibleContent>
        </motion.div>
      </Collapsible>

      {/* Payout History */}
      <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-border bg-card">
          <CollapsibleTrigger className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors rounded-2xl">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <History className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-heading font-semibold text-foreground text-sm">Payout History</h3>
                <p className="text-xs text-muted-foreground">
                  {balance.payout_history?.length ? `${balance.payout_history.length} payout(s)` : "No payouts yet"}
                </p>
              </div>
            </div>
            {historyOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-5 pb-5 pt-0 space-y-2">
              {!balance.payout_history?.length ? (
                <p className="text-xs text-muted-foreground text-center py-4">No payouts have been made yet.</p>
              ) : (
                balance.payout_history.map((p) => {
                  const statusColor =
                    p.status === "paid" ? "bg-primary/10 text-primary" :
                    p.status === "pending" || p.status === "in_transit" ? "bg-amber-400/10 text-amber-400" :
                    "bg-destructive/10 text-destructive";
                  return (
                    <div key={p.id} className="flex items-center justify-between rounded-xl bg-muted/50 p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center">
                          <Banknote className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">${p.amount.toFixed(2)}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(p.created * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            {p.arrival_date && (
                              <> · Est. arrival {new Date(p.arrival_date * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className={`rounded-md px-2.5 py-1 text-[11px] font-semibold capitalize ${statusColor}`}>
                        {p.status === "in_transit" ? "In Transit" : p.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </CollapsibleContent>
        </motion.div>
      </Collapsible>
    </div>
  );
};

/* ── Messages Tab Component ── */
const MentorMessagesTab = ({ mentorId, mentorName }: { mentorId: string; mentorName: string }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [replyTo, setReplyTo] = useState<{ userId: string; name: string } | null>(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["mentor-messages", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`recipient_id.eq.${user!.id},sender_mentor_id.eq.${mentorId}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("messages").update({ is_read: true }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mentor-messages"] }),
  });

  const sendReply = useMutation({
    mutationFn: async () => {
      if (!replyTo || !user) throw new Error("Missing data");
      const { error } = await supabase.from("messages").insert({
        recipient_id: replyTo.userId,
        sender_user_id: user.id,
        sender_mentor_id: mentorId,
        sender_name: mentorName,
        subject: replySubject.trim(),
        body: replyBody.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentor-messages"] });
      toast.success(`Reply sent to ${replyTo?.name}`);
      setReplyTo(null);
      setReplySubject("");
      setReplyBody("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to send reply"),
  });

  const unreadCount = messages.filter((m) => m.recipient_id === user?.id && !m.is_read).length;

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-2.5 text-sm text-primary font-medium">
          {unreadCount} unread message{unreadCount > 1 ? "s" : ""}
        </div>
      )}
      {messages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-foreground font-medium mb-1">No messages yet</p>
          <p className="text-xs text-muted-foreground">Student messages will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => {
            const isFromStudent = msg.recipient_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`rounded-xl border bg-card p-4 ${
                  isFromStudent && !msg.is_read ? "border-primary/20" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      !isFromStudent ? "bg-primary/10" : msg.is_read ? "bg-muted" : "bg-primary/10"
                    }`}>
                      {!isFromStudent ? (
                        <Send className="h-3.5 w-3.5 text-primary" />
                      ) : msg.is_read ? (
                        <MailOpen className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <Mail className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                    <div>
                      <span className="font-heading font-semibold text-sm text-foreground">
                        {isFromStudent ? msg.sender_name : `You → ${msg.sender_name}`}
                      </span>
                      {isFromStudent && !msg.is_read && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5">NEW</span>
                      )}
                      {!isFromStudent && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-muted text-muted-foreground text-[9px] font-bold px-1.5 py-0.5">SENT</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{new Date(msg.created_at).toLocaleDateString()}</span>
                    {isFromStudent && !msg.is_read && (
                      <button onClick={() => markRead.mutate(msg.id)} className="text-[10px] text-primary hover:underline font-medium">
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
                <h4 className="text-sm font-medium text-foreground mb-1">{msg.subject}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{msg.body}</p>
                {isFromStudent && msg.sender_user_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs mt-2 h-7"
                    onClick={() => {
                      setReplyTo({ userId: msg.sender_user_id!, name: msg.sender_name });
                      setReplySubject(`Re: ${msg.subject}`);
                      setReplyBody("");
                    }}
                  >
                    <Send className="h-3 w-3 mr-1" /> Reply
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reply Dialog */}
      <Dialog open={!!replyTo} onOpenChange={(open) => !open && setReplyTo(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Reply to {replyTo?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Subject</label>
              <Input value={replySubject} onChange={(e) => setReplySubject(e.target.value)} className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Message</label>
              <Textarea value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="Write your reply..." rows={4} className="text-sm" />
            </div>
            <Button
              className="w-full text-sm"
              disabled={!replySubject.trim() || !replyBody.trim() || sendReply.isPending}
              onClick={() => sendReply.mutate()}
            >
              {sendReply.isPending ? "Sending..." : <><Send className="h-3.5 w-3.5 mr-1.5" /> Send Reply</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const MentorDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: mentor, isLoading } = useMyMentorProfile();
  const updateProfile = useUpdateMentorProfile();


  const { data: students = [] } = useMentorStudents(mentor?.id);
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground font-heading font-bold text-base">
              {mentor.avatar}
            </div>
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
            <Link to={`/mentor/${mentor.id}`}>
              <Button variant="ghost" size="sm" className="text-xs h-8"><Eye className="h-3.5 w-3.5 mr-1" /> Preview</Button>
            </Link>
            <Link to="/codes">
              <Button variant="ghost" size="sm" className="text-xs h-8"><Tag className="h-3.5 w-3.5 mr-1" /> Codes</Button>
            </Link>
            <Button variant="ghost" size="sm" className="text-xs h-8" onClick={signOut}>
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: "Students", value: earnings?.activeStudents ?? 0 },
            { icon: DollarSign, label: "Revenue", value: `$${earnings?.monthlyRevenue ?? 0}` },
            { icon: Star, label: "Rating", value: mentor.rating },
            { icon: TrendingUp, label: "Total Subs", value: earnings?.allTimeSubs ?? 0 },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <span className="font-heading text-lg font-bold text-foreground leading-none">{stat.value}</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="w-full grid grid-cols-5 h-10 bg-muted/50 rounded-xl">
            <TabsTrigger value="profile" className="text-xs font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Profile
            </TabsTrigger>
            <TabsTrigger value="content" className="text-xs font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Crown className="h-3.5 w-3.5 mr-1.5" /> Content
            </TabsTrigger>
            <TabsTrigger value="students" className="text-xs font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Users className="h-3.5 w-3.5 mr-1.5" /> Students
            </TabsTrigger>
            <TabsTrigger value="messages" className="text-xs font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Messages
            </TabsTrigger>
            <TabsTrigger value="income" className="text-xs font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Wallet className="h-3.5 w-3.5 mr-1.5" /> Income
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <MentorProfileEditor
              mentor={mentor}
              onUpdate={handleSaveProfile}
              isUpdating={updateProfile.isPending}
              onToggleAvailability={handleToggleAvailability}
            />
          </TabsContent>

          <TabsContent value="content">
            <MentorContentManager mentorId={mentor.id} />
          </TabsContent>

          <TabsContent value="students">
            {students.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
                <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-foreground font-medium mb-1">No active students yet</p>
                <p className="text-xs text-muted-foreground">They'll appear here once someone subscribes.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-2.5 border-b border-border bg-muted/30 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <span />
                  <span>Student</span>
                  <span>Joined</span>
                  <span>Status</span>
                </div>
                {students.map((sub: any) => {
                  const profile = sub.profiles;
                  return (
                    <div key={sub.id} className="grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                        {(profile?.display_name || "?").charAt(0).toUpperCase()}
                      </div>
                      <span className="font-heading font-semibold text-sm text-foreground truncate">
                        {profile?.display_name || "Student"}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(sub.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary capitalize">{sub.status}</span>
                    </div>
                  );
                })}
              </div>
            )}
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
