import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, Navigate } from "react-router-dom";
import { Zap, ArrowLeft, CheckCircle2, XCircle, Clock, LogOut } from "lucide-react";
import { toast } from "sonner";

interface Application {
  id: string;
  full_name: string;
  experience: string;
  instruments: string[];
  concepts: string[];
  session: string;
  monthly_price: number;
  bio: string;
  status: string;
  created_at: string;
}

const AdminDashboard = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const [filter, setFilter] = useState<string>("pending");
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["admin-applications", filter],
    enabled: isAdmin,
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
      // Create mentor from application
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
        status: "approved",
      });
      if (insertError) throw insertError;

      // Update application status
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

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm">Loading...</p></div>;
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">You don't have admin access.</p>
          <Link to="/"><Button variant="outline" size="sm">Back to home</Button></Link>
        </div>
      </div>
    );
  }

  const statusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle2 className="h-4 w-4 text-primary" />;
    if (status === "rejected") return <XCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-amber-400" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(hsl(160 84% 39% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(160 84% 39% / 0.3) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
              <ArrowLeft className="h-4 w-4" /> Back to site
            </Link>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Review and manage mentor applications.</p>
          </div>
          <Button variant="outline" size="sm" className="text-xs" onClick={signOut}>
            <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign Out
          </Button>
        </div>

        {/* Filters */}
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

        {/* Applications */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-16 text-muted-foreground text-sm">Loading applications...</div>
          ) : applications.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No {filter !== "all" ? filter : ""} applications found.</div>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {statusIcon(app.status)}
                      <h3 className="font-heading font-semibold text-foreground">{app.full_name}</h3>
                      <Badge variant="secondary" className="text-[10px] capitalize">{app.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {app.experience} · {app.session} session · ${app.monthly_price}/mo · {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {app.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-8 text-xs font-semibold"
                        onClick={() => approveMutation.mutate(app)}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs font-semibold text-destructive hover:text-destructive"
                        onClick={() => rejectMutation.mutate(app.id)}
                        disabled={rejectMutation.isPending}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{app.bio}</p>
                <div className="flex flex-wrap gap-1.5">
                  {app.instruments.map((i) => (
                    <span key={i} className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{i}</span>
                  ))}
                  {app.concepts.map((c) => (
                    <span key={c} className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">{c}</span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
