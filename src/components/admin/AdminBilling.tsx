import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  DollarSign, TrendingUp, CreditCard, Users, Search, ArrowUpDown,
  CalendarDays, Clock, CheckCircle2, XCircle, AlertCircle, Ban, Trash2,
  Download, Wallet, Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const AdminBilling = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "price">("date");
  const queryClient = useQueryClient();


  // Fetch all subscriptions with mentor details
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["admin-billing-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, mentors(name, monthly_price, avatar)")
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch profiles for user display names
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-billing-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, display_name");
      if (error) throw error;
      return data || [];
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (subId: string) => {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "canceled", expires_at: new Date().toISOString() })
        .eq("id", subId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-billing-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-subscriptions"] });
      toast.success("Subscription canceled");
    },
    onError: () => toast.error("Failed to cancel subscription"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (subId: string) => {
      const { error } = await supabase.from("subscriptions").delete().eq("id", subId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-billing-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-subscriptions"] });
      toast.success("Subscription removed");
    },
    onError: () => toast.error("Failed to remove subscription"),
  });

  // Platform balance
  const { data: platformBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ["admin-platform-balance"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-balance");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as {
        available: number;
        pending: number;
        breakdown: { available: { amount: number; currency: string }[]; pending: { amount: number; currency: string }[] };
        payout_history: { id: string; amount: number; currency: string; status: string; created: number; arrival_date: number }[];
      };
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-balance", {
        body: { action: "payout" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-platform-balance"] });
      toast.success(`Withdrawal of $${data.amount.toFixed(2)} initiated!`);
    },
    onError: (err: any) => {
      const msg = err.message || "Failed to withdraw";
      if (msg.includes("No available balance")) toast.info("No available balance to withdraw yet.");
      else toast.error(msg);
    },
  });

  const profileMap = new Map(profiles.map((p) => [p.id, p.display_name || "Unknown"]));

  // Compute stats
  const activeCount = subscriptions.filter((s) => s.status === "active").length;
  const canceledCount = subscriptions.filter((s) => s.status === "canceled" || s.status === "cancelled").length;
  const totalRevenue = subscriptions.reduce(
    (sum, s) => sum + ((s as any).mentors?.monthly_price || 0),
    0
  );
  const monthlyRecurring = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + ((s as any).mentors?.monthly_price || 0), 0);

  // Unique subscribers
  const uniqueSubscribers = new Set(subscriptions.map((s) => s.user_id)).size;

  // Filter & sort
  const filtered = subscriptions.filter((s) => {
    const mentorName = ((s as any).mentors?.name || "").toLowerCase();
    const userName = (profileMap.get(s.user_id) || "").toLowerCase();
    const matchesSearch =
      !search ||
      mentorName.includes(search.toLowerCase()) ||
      userName.includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.started_at).getTime() - new Date(a.started_at).getTime();
    }
    return ((b as any).mentors?.monthly_price || 0) - ((a as any).mentors?.monthly_price || 0);
  });

  const statusIcon = (status: string) => {
    if (status === "active") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
    if (status === "canceled" || status === "cancelled") return <XCircle className="h-3.5 w-3.5 text-red-400" />;
    return <AlertCircle className="h-3.5 w-3.5 text-amber-400" />;
  };

  const statusBadgeVariant = (status: string) => {
    if (status === "active") return "default" as const;
    if (status === "canceled" || status === "cancelled") return "destructive" as const;
    return "secondary" as const;
  };

  if (isLoading) {
    return <p className="text-center py-12 text-muted-foreground text-sm">Loading billing data...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Revenue Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-heading">${totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">From {subscriptions.length} subscriptions</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Recurring</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-heading">${monthlyRecurring.toLocaleString()}/mo</p>
            <p className="text-xs text-muted-foreground mt-1">{activeCount} active subscriptions</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unique Subscribers</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-heading">{uniqueSubscribers}</p>
            <p className="text-xs text-muted-foreground mt-1">Across all mentors</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Churn</CardTitle>
            <CreditCard className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-heading">{canceledCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Canceled subscriptions</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription History Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-heading font-semibold text-foreground">Subscription History</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sorted.length} subscription{sorted.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search user or mentor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs w-full sm:w-56 bg-secondary/50 border-border/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-xs w-28 bg-secondary/50 border-border/50 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={() => setSortBy(sortBy === "date" ? "price" : "date")}
              className="flex items-center gap-1 h-9 px-3 rounded-lg border border-border/50 bg-secondary/50 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowUpDown className="h-3 w-3" />
              {sortBy === "date" ? "Date" : "Price"}
            </button>
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="text-center py-16">
            <CreditCard className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No subscriptions found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-13 gap-4 px-6 py-3 bg-muted/30 text-xs font-medium text-muted-foreground">
              <div className="col-span-3">Subscriber</div>
              <div className="col-span-3">Mentor</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-2">Started</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Actions</div>
            </div>

            {sorted.map((sub) => {
              const mentor = (sub as any).mentors;
              const userName = profileMap.get(sub.user_id) || "Unknown User";

              return (
                <div
                  key={sub.id}
                  className="grid grid-cols-1 sm:grid-cols-13 gap-2 sm:gap-4 px-6 py-4 hover:bg-muted/20 transition-colors items-center"
                >
                  <div className="col-span-3 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{sub.user_id.slice(0, 8)}...</p>
                    </div>
                  </div>

                  <div className="col-span-3 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-bold shrink-0">
                      {mentor?.avatar || "?"}
                    </div>
                    <p className="text-sm text-foreground truncate">{mentor?.name || "Unknown Mentor"}</p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm font-semibold text-foreground">
                      ${mentor?.monthly_price || 0}<span className="text-xs text-muted-foreground font-normal">/mo</span>
                    </p>
                  </div>

                  <div className="col-span-2 flex items-center gap-1.5">
                    <CalendarDays className="h-3 w-3 text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(sub.started_at), "MMM d, yyyy")}
                    </p>
                  </div>

                  <div className="col-span-2 flex items-center gap-1.5">
                    {statusIcon(sub.status)}
                    <Badge variant={statusBadgeVariant(sub.status)} className="text-[10px] capitalize">
                      {sub.status}
                    </Badge>
                    {sub.expires_at && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {format(new Date(sub.expires_at), "MMM d")}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center gap-1">
                    {sub.status === "active" ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="Cancel subscription">
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cancel {userName}'s subscription to {mentor?.name}? This will mark it as canceled immediately.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Active</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => cancelMutation.mutate(sub.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Cancel Subscription
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="Delete record">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Subscription Record</AlertDialogTitle>
                            <AlertDialogDescription>
                              Permanently delete this subscription record? This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(sub.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
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

export default AdminBilling;
