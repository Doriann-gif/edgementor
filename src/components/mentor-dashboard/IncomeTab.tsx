import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion } from "framer-motion";
import {
  DollarSign, TrendingUp, Clock, Wallet, ChevronDown, ChevronUp,
  Banknote, ArrowDownToLine, RefreshCw, ExternalLink, BarChart3, History, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

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
    onSuccess: (data) => { toast.success(data.message); refetch(); },
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
    onSuccess: (data) => { toast.success(data.message); refetch(); },
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
          const months: { name: string; revenue: number }[] = [];
          const now = new Date();
          for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({ name: d.toLocaleString("default", { month: "short" }), revenue: 0 });
          }
          if (months.length > 0) {
            months[months.length - 1].revenue = balance.available + balance.pending;
            const past = balance.total_earned - (balance.available + balance.pending);
            if (past > 0 && months.length > 1) {
              const perMonth = past / (months.length - 1);
              for (let i = 0; i < months.length - 1; i++) months[i].revenue = Math.round(perMonth * 100) / 100;
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
                {!balance.payouts_enabled && <p className="text-xs text-amber-400">⚠ Complete your account setup to enable payouts.</p>}
              </div>
              <Button className="w-full" disabled={balance.available <= 0 || !balance.payouts_enabled || withdraw.isPending} onClick={() => withdraw.mutate()}>
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
                    {balance.auto_payout ? "Your balance is automatically transferred on the 1st of each month." : "Manually withdraw whenever you want."}
                  </p>
                </div>
                <Switch checked={balance.auto_payout} onCheckedChange={() => toggleAuto.mutate()} disabled={toggleAuto.isPending || !balance.payouts_enabled} />
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
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Complete Account Setup
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
                            {p.arrival_date && <> · Est. arrival {new Date(p.arrival_date * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</>}
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

export default IncomeTab;
