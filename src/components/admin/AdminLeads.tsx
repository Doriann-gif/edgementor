import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Download, CalendarClock, Copy } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

// Growth surfaces: the /learn email list and free-intro requests from
// mentor profiles. Both are read here; intro request status is workable.
const AdminLeads = () => {
  const queryClient = useQueryClient();

  const { data: subscribers = [], isLoading: subsLoading } = useQuery({
    queryKey: ["admin-email-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_subscribers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: introRequests = [], isLoading: introLoading } = useQuery({
    queryKey: ["admin-intro-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("intro_requests")
        .select("*, mentors(name, avatar)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("intro_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-intro-requests"] });
      toast.success("Status updated.");
    },
    onError: () => toast.error("Failed to update status."),
  });

  const exportCsv = () => {
    const rows = [["email", "source", "subscribed_at"], ...subscribers.map((s) => [s.email, s.source, s.created_at])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `edgementor-subscribers-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyEmails = async () => {
    await navigator.clipboard.writeText(subscribers.map((s) => s.email).join(", "));
    toast.success(`${subscribers.length} emails copied.`);
  };

  const newCount = introRequests.filter((r) => r.status === "new").length;

  return (
    <div className="space-y-6">
      {/* ===== INTRO REQUESTS ===== */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-heading font-semibold flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" /> Free Intro Requests
              {newCount > 0 && <Badge className="text-[10px]">{newCount} new</Badge>}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">People who asked for a free 15-min intro with a mentor.</p>
          </div>
        </CardHeader>
        <CardContent>
          {introLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
          ) : introRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No intro requests yet.</p>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
              {introRequests.map((r) => (
                <div key={r.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">{r.requester_name}</p>
                      <a href={`mailto:${r.requester_email}`} className="text-xs text-primary hover:underline">{r.requester_email}</a>
                      <span className="text-[10px] text-muted-foreground">→ {(r as any).mentors?.name || "Unknown mentor"}</span>
                    </div>
                    {r.message && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.message}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(r.created_at), "MMM d, yyyy HH:mm")}</p>
                  </div>
                  <Select value={r.status} onValueChange={(status) => statusMutation.mutate({ id: r.id, status })}>
                    <SelectTrigger className="h-8 text-xs w-32 bg-secondary/50 border-border/50 rounded-lg shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== EMAIL SUBSCRIBERS ===== */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-heading font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" /> Email Subscribers
              <Badge variant="secondary" className="text-[10px]">{subscribers.length}</Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Collected on the free /learn library.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={copyEmails} disabled={subscribers.length === 0}>
              <Copy className="h-3 w-3 mr-1.5" /> Copy All
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={exportCsv} disabled={subscribers.length === 0}>
              <Download className="h-3 w-3 mr-1.5" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {subsLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
          ) : subscribers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No subscribers yet — the capture form is live on /learn.</p>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden divide-y divide-border max-h-96 overflow-y-auto">
              {subscribers.map((s) => (
                <div key={s.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                  <p className="text-sm text-foreground truncate">{s.email}</p>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="secondary" className="text-[10px]">{s.source}</Badge>
                    <span className="text-[10px] text-muted-foreground">{format(new Date(s.created_at), "MMM d, yyyy")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLeads;
