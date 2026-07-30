import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion } from "framer-motion";
import {
  DollarSign, TrendingUp, Clock, Wallet, ChevronDown, ChevronUp,
  Banknote, ArrowDownToLine, RefreshCw, BarChart3, History, Bitcoin, Landmark, Pencil,
} from "lucide-react";
import { toast } from "sonner";
import PayoutMethodDialog, { type PayoutMethod } from "./PayoutMethodDialog";

type State = {
  method: { method: PayoutMethod; details: Record<string, string> } | null;
  balance: { total: number; reserved: number; available: number };
  requests: { id: string; amount: number; method: string; status: string; requested_at: string; processed_at: string | null }[];
  ledger: { id: string; entry_type: string; amount: number; note: string | null; created_at: string }[];
  min_withdrawal: number;
};

// Surface the real error text — supabase-js hides the JSON body behind a
// generic FunctionsHttpError.
async function callPayouts<T = any>(payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("mentor-payouts", { body: payload });
  if (error) {
    let msg = error.message;
    try {
      const body = await (error as any).context?.json?.();
      if (body?.error) msg = body.error;
    } catch { /* keep generic message */ }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}

const METHOD_LABEL: Record<string, string> = { crypto: "Crypto", bank: "Bank transfer", paypal: "PayPal" };

const IncomeTab = ({ mentorId }: { mentorId: string }) => {
  const queryClient = useQueryClient();
  const [withdrawOpen, setWithdrawOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [methodOpen, setMethodOpen] = useState(false);
  const [amount, setAmount] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["mentor-payouts", mentorId],
    queryFn: () => callPayouts<State>({ action: "get_state" }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["mentor-payouts", mentorId] });

  const saveMethod = useMutation({
    mutationFn: (vars: { method: PayoutMethod; details: Record<string, string> }) =>
      callPayouts({ action: "save_method", ...vars }),
    onSuccess: () => { invalidate(); setMethodOpen(false); toast.success("Payout method saved."); },
    onError: (e: any) => toast.error(e?.message || "Couldn't save payout method"),
  });

  const withdraw = useMutation({
    mutationFn: (amt?: number) => callPayouts<{ message: string }>({ action: "request_withdrawal", amount: amt }),
    onSuccess: (res) => { invalidate(); setAmount(""); toast.success(res.message); },
    onError: (e: any) => toast.error(e?.message || "Withdrawal failed"),
  });

  if (isLoading || !data) {
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

  const { balance, method, requests, ledger, min_withdrawal } = data;
  const totalEarned = ledger.filter((l) => l.entry_type === "earning").reduce((s, l) => s + Number(l.amount), 0);
  const totalPaid = ledger.filter((l) => l.entry_type === "payout").reduce((s, l) => s + Math.abs(Number(l.amount)), 0);

  // Per-month earnings for the chart, from real ledger entries.
  const months: { name: string; revenue: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const revenue = ledger
      .filter((l) => l.entry_type === "earning" && l.created_at.startsWith(key))
      .reduce((s, l) => s + Number(l.amount), 0);
    months.push({ name: d.toLocaleString("default", { month: "short" }), revenue: Math.round(revenue * 100) / 100 });
  }

  const methodSummary = () => {
    if (!method) return null;
    const d = method.details;
    if (method.method === "crypto") return `${d.asset} · ${d.network} · ${d.wallet_address?.slice(0, 10)}…`;
    if (method.method === "bank") {
      const acct = d.iban || d.account_number || "";
      return [d.bank_name, acct && `…${acct.slice(-4)}`, d.country].filter(Boolean).join(" · ");
    }
    return d.paypal_email;
  };

  // First run: no payout method yet.
  if (!method) {
    return (
      <>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <Wallet className="h-10 w-10 text-primary/20 mx-auto mb-4" />
          </motion.div>
          <p className="text-sm text-foreground font-medium mb-1">Set up payouts</p>
          <p className="text-xs text-muted-foreground mb-4">
            Choose how you want to receive your earnings — crypto, bank transfer, or PayPal.
          </p>
          {balance.total > 0 && (
            <p className="text-xs text-primary mb-4">You have ${balance.total.toFixed(2)} waiting.</p>
          )}
          <Button size="sm" onClick={() => setMethodOpen(true)}>
            <Wallet className="h-3.5 w-3.5 mr-1.5" /> Choose payout method
          </Button>
        </motion.div>
        <PayoutMethodDialog
          open={methodOpen}
          onOpenChange={setMethodOpen}
          onSave={(m, d) => saveMethod.mutate({ method: m, details: d })}
          saving={saveMethod.isPending}
        />
      </>
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
            <p className="font-heading text-2xl font-bold text-foreground">${balance.reserved.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Being paid out</p>
          </div>
          <div className="rounded-xl bg-muted/50 border border-border p-4 text-center">
            <TrendingUp className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
            <p className="font-heading text-2xl font-bold text-foreground">${totalEarned.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Earned</p>
          </div>
        </div>

        <div className="rounded-xl bg-muted/30 border border-border/50 p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Revenue Breakdown</p>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Gross Revenue</span>
              <span className="text-sm font-semibold text-foreground">${(totalEarned / 0.8).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-destructive/60" />
                Platform Fee (20%)
              </span>
              <span className="text-sm text-destructive/80">−${(totalEarned / 0.8 * 0.2).toFixed(2)}</span>
            </div>
            <div className="border-t border-border/50 pt-2.5 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                Net Earnings (80%)
              </span>
              <span className="text-sm font-bold text-primary">${totalEarned.toFixed(2)}</span>
            </div>
            {totalPaid > 0 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Already withdrawn</span><span>−${totalPaid.toFixed(2)}</span>
              </div>
            )}
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
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Earnings"]}
            />
            <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revenueGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-[11px] text-muted-foreground mt-2 text-center">Your net earnings per month</p>
      </motion.div>

      {/* Withdraw */}
      <Collapsible open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-border bg-card">
          <CollapsibleTrigger className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors rounded-2xl">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <ArrowDownToLine className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-heading font-semibold text-foreground text-sm">Withdraw Funds</h3>
                <p className="text-xs text-muted-foreground">Request a payout to your chosen method</p>
              </div>
            </div>
            {withdrawOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-5 pb-5 pt-0 space-y-4">
              {/* Current method */}
              <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {method.method === "crypto" ? <Bitcoin className="h-4 w-4 text-primary" />
                      : method.method === "bank" ? <Landmark className="h-4 w-4 text-primary" />
                      : <Wallet className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{METHOD_LABEL[method.method]}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{methodSummary()}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-xs shrink-0" onClick={() => setMethodOpen(true)}>
                  <Pencil className="h-3 w-3 mr-1" /> Change
                </Button>
              </div>

              <div className="rounded-xl bg-muted/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Available to withdraw</span>
                  <span className="font-heading font-bold text-foreground">${balance.available.toFixed(2)}</span>
                </div>
                {balance.available < min_withdrawal && (
                  <p className="text-xs text-amber-400">Minimum withdrawal is ${min_withdrawal}.</p>
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder={`Amount (max $${balance.available.toFixed(2)})`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-10"
                />
                <Button
                  variant="outline"
                  className="shrink-0"
                  onClick={() => setAmount(balance.available.toFixed(2))}
                  disabled={balance.available <= 0}
                >
                  Max
                </Button>
              </div>

              <Button
                className="w-full"
                disabled={balance.available < min_withdrawal || withdraw.isPending}
                onClick={() => withdraw.mutate(amount ? Number(amount) : undefined)}
              >
                <Banknote className="h-4 w-4 mr-2" />
                {withdraw.isPending ? "Requesting…" : "Request withdrawal"}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                Payouts are reviewed and sent manually — usually within 1–3 business days.
              </p>
            </div>
          </CollapsibleContent>
        </motion.div>
      </Collapsible>

      {/* Payout History */}
      <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card">
          <CollapsibleTrigger className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors rounded-2xl">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <History className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-heading font-semibold text-foreground text-sm">Payout History</h3>
                <p className="text-xs text-muted-foreground">
                  {requests.length ? `${requests.length} request(s)` : "No payouts yet"}
                </p>
              </div>
            </div>
            {historyOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-5 pb-5 pt-0 space-y-2">
              {!requests.length ? (
                <p className="text-xs text-muted-foreground text-center py-4">No withdrawals requested yet.</p>
              ) : requests.map((r) => {
                const color =
                  r.status === "paid" ? "bg-primary/10 text-primary" :
                  r.status === "rejected" ? "bg-destructive/10 text-destructive" :
                  "bg-amber-400/10 text-amber-400";
                return (
                  <div key={r.id} className="flex items-center justify-between rounded-xl bg-muted/50 p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center">
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">${Number(r.amount).toFixed(2)}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {METHOD_LABEL[r.method] ?? r.method} · {new Date(r.requested_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <Badge className={`text-[11px] font-semibold capitalize border-0 ${color}`}>{r.status}</Badge>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </motion.div>
      </Collapsible>

      <PayoutMethodDialog
        open={methodOpen}
        onOpenChange={setMethodOpen}
        initial={method}
        onSave={(m, d) => saveMethod.mutate({ method: m, details: d })}
        saving={saveMethod.isPending}
      />
    </div>
  );
};

export default IncomeTab;
