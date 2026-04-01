import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import {
  ChevronRight, CalendarDays, Mail, CheckCircle2, XCircle, CreditCard, ArrowLeft, Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const AdminStudents = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allSubscriptions = [] } = useQuery({
    queryKey: ["admin-all-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, mentors(name, monthly_price, avatar, payment_type)")
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data;
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
      queryClient.invalidateQueries({ queryKey: ["admin-all-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-billing-subscriptions"] });
      toast.success("Subscription canceled successfully");
    },
    onError: () => toast.error("Failed to cancel subscription"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (subId: string) => {
      const { error } = await supabase.from("subscriptions").delete().eq("id", subId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-billing-subscriptions"] });
      toast.success("Subscription removed");
    },
    onError: () => toast.error("Failed to remove subscription"),
  });

  const activeSubMap = new Map<string, string[]>();
  allSubscriptions
    .filter((s) => s.status === "active")
    .forEach((s: any) => {
      const list = activeSubMap.get(s.user_id) || [];
      list.push(s.mentors?.name || "Unknown");
      activeSubMap.set(s.user_id, list);
    });

  const selectedProfile = profiles.find((p) => p.id === selectedUserId);
  const selectedSubs = allSubscriptions.filter((s) => s.user_id === selectedUserId);

  if (isLoading) return <p className="text-center py-12 text-muted-foreground text-sm">Loading students...</p>;

  // Detail view
  if (selectedUserId && selectedProfile) {
    const activeSubs = selectedSubs.filter((s) => s.status === "active");
    const pastSubs = selectedSubs.filter((s) => s.status !== "active");
    const totalSpent = selectedSubs.reduce((sum, s) => sum + ((s as any).mentors?.monthly_price || 0), 0);

    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedUserId(null)}
          className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Students
        </Button>

        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary text-xl font-bold shrink-0">
                {(selectedProfile.display_name || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-heading font-semibold text-foreground">
                  {selectedProfile.display_name || "Unknown"}
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Joined {format(new Date(selectedProfile.created_at), "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {selectedProfile.email_notifications ? "Email notifications on" : "Notifications off"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground mb-1">Active Subscriptions</p>
              <p className="text-2xl font-heading font-bold">{activeSubs.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground mb-1">Total Subscriptions</p>
              <p className="text-2xl font-heading font-bold">{selectedSubs.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground mb-1">Total Value</p>
              <p className="text-2xl font-heading font-bold">${totalSpent}</p>
            </CardContent>
          </Card>
        </div>

        {activeSubs.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium font-heading text-foreground">Active Subscriptions</h3>
            <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
              {activeSubs.map((sub) => {
                const mentor = (sub as any).mentors;
                return (
                  <div key={sub.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-bold shrink-0">
                      {mentor?.avatar || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{mentor?.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        Started {format(new Date(sub.started_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">
                          ${mentor?.monthly_price || 0}
                          <span className="text-xs text-muted-foreground font-normal">
                            {mentor?.payment_type === "one_time" ? "" : "/mo"}
                          </span>
                        </p>
                        <Badge variant="default" className="text-[10px] mt-0.5">
                          <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                          Active
                        </Badge>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will cancel {selectedProfile.display_name}'s subscription to {mentor?.name}. This action cannot be undone.
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
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {pastSubs.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium font-heading text-foreground">Past Subscriptions</h3>
            <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
              {pastSubs.map((sub) => {
                const mentor = (sub as any).mentors;
                return (
                  <div key={sub.id} className="flex items-center gap-4 px-5 py-4 opacity-60">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground text-xs font-bold shrink-0">
                      {mentor?.avatar || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{mentor?.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(sub.started_at), "MMM d, yyyy")}
                        {sub.expires_at && ` — ${format(new Date(sub.expires_at), "MMM d, yyyy")}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-muted-foreground">${mentor?.monthly_price || 0}</p>
                        <Badge variant="destructive" className="text-[10px] mt-0.5 capitalize">
                          <XCircle className="h-2.5 w-2.5 mr-0.5" />
                          {sub.status}
                        </Badge>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Subscription Record</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this subscription record. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(sub.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Record
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedSubs.length === 0 && (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <CreditCard className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No subscription history</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Active Mentorships</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.length === 0 ? (
            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-12">No students found.</TableCell></TableRow>
          ) : profiles.map((p) => (
            <TableRow
              key={p.id}
              className="cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={() => setSelectedUserId(p.id)}
            >
              <TableCell className="font-medium">{p.display_name || "—"}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                {activeSubMap.has(p.id) ? (
                  <div className="flex flex-wrap gap-1">
                    {activeSubMap.get(p.id)!.map((name, i) => (
                      <Badge key={i} variant="default" className="text-[10px]">{name}</Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
              </TableCell>
              <TableCell>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminStudents;
