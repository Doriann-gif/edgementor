import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface Application {
  id: string;
  full_name: string;
  experience: string;
  instruments: string[];
  concepts: string[];
  session: string;
  monthly_price: number;
  payment_type: string;
  bio: string;
  status: string;
  proof_url: string | null;
  social_link: string | null;
  country: string | null;
  created_at: string;
  user_id: string | null;
  email: string | null;
}

const AdminApplications = () => {
  const [filter, setFilter] = useState<string>("pending");
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["admin-applications", filter],
    queryFn: async () => {
      let query = supabase.from("mentor_applications").select("*").order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("status", filter);
      const { data, error } = await query;
      if (error) throw error;
      return data as Application[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (app: Application) => {
      // Resolve user_id: use stored one, or look up by email
      let userId = app.user_id;
      if (!userId && app.email) {
        const { data: lookupData } = await supabase.rpc("lookup_user_id_by_email", { _email: app.email });
        if (lookupData) userId = lookupData;
      }

      const { error: insertError } = await supabase.from("mentors").insert({
        name: app.full_name,
        avatar: app.full_name.split(" ").map((n) => n[0]).join("").toUpperCase(),
        bio: app.bio,
        full_bio: app.bio,
        experience: app.experience,
        instruments: app.instruments,
        concepts: app.concepts,
        session: app.session,
        monthly_price: app.monthly_price,
        payment_type: (app as any).payment_type || "recurring",
        country: (app as any).country || null,
        social_link: (app as any).social_link || null,
        status: "approved",
        user_id: userId || null,
      });
      if (insertError) throw insertError;
      const { error: updateError } = await supabase
        .from("mentor_applications")
        .update({ status: "approved" })
        .eq("id", app.id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
      toast.success("Application approved! Mentor is now live.");
    },
    onError: () => toast.error("Failed to approve application."),
  });



  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("mentor_applications")
        .update({ status: "rejected" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
      toast.success("Application rejected.");
    },
    onError: () => toast.error("Failed to reject application."),
  });

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {["pending", "approved", "rejected", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-all duration-200 ${
              filter === f
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-center py-12 text-muted-foreground text-sm">Loading applications...</p>
      ) : applications.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground text-sm">No {filter !== "all" ? filter : ""} applications found.</p>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Instruments</TableHead>
                <TableHead>Concepts</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Proof</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.full_name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{app.experience}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {app.instruments.map((i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">{i}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {app.concepts.map((c) => (
                        <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{app.session}</TableCell>
                  <TableCell className="text-xs font-medium">${app.monthly_price}/mo</TableCell>
                  <TableCell>
                    {app.proof_url ? (
                      <a href={app.proof_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-xs">
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={app.status === "approved" ? "default" : app.status === "rejected" ? "destructive" : "secondary"} className="text-[10px] capitalize">
                      {app.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {app.status === "pending" && (
                      <div className="flex gap-1.5 justify-end">
                        <Button size="sm" className="h-7 text-[11px]" onClick={() => approveMutation.mutate(app)} disabled={approveMutation.isPending}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-[11px] text-destructive hover:text-destructive" onClick={() => rejectMutation.mutate(app.id)} disabled={rejectMutation.isPending}>
                          <XCircle className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminApplications;
