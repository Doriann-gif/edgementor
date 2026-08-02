import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Download, Copy } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

// Growth surface: the /learn email capture list.
const AdminLeads = () => {
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

  return (
    <div className="space-y-6">
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
