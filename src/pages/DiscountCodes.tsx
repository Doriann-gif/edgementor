import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMyMentorProfile } from "@/hooks/use-mentor-dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Plus, Copy, Trash2, Tag, Ticket, LogOut,
} from "lucide-react";
import { toast } from "sonner";

const DiscountCodes = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const { data: mentorProfile } = useMyMentorProfile();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState<"promo" | "referral">("promo");
  const [newDiscount, setNewDiscount] = useState("10");
  const [newMaxUses, setNewMaxUses] = useState("");
  const [newExpires, setNewExpires] = useState("");

  const canManage = isAdmin || !!mentorProfile;

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ["discount-codes", isAdmin, mentorProfile?.id],
    enabled: !!user && canManage,
    queryFn: async () => {
      let query = supabase.from("discount_codes").select("*").order("created_at", { ascending: false });
      if (!isAdmin && mentorProfile) {
        query = query.eq("mentor_id", mentorProfile.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const codeValue = newCode.trim().toUpperCase();
      if (!codeValue) throw new Error("Code is required.");
      const { error } = await supabase.from("discount_codes").insert({
        code: codeValue,
        type: newType,
        discount_percent: parseInt(newDiscount, 10),
        max_uses: newMaxUses ? parseInt(newMaxUses, 10) : null,
        expires_at: newExpires || null,
        created_by: user!.id,
        mentor_id: mentorProfile?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discount-codes"] });
      toast.success("Code created!");
      setShowCreate(false);
      setNewCode("");
      setNewDiscount("10");
      setNewMaxUses("");
      setNewExpires("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to create code."),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("discount_codes").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discount-codes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("discount_codes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discount-codes"] });
      toast.success("Code deleted.");
    },
    onError: () => toast.error("Failed to delete code."),
  });

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm">Loading...</p></div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!canManage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">You don't have access to manage codes.</p>
          <Link to="/"><Button variant="outline" size="sm">Back to home</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(hsl(160 84% 39% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(160 84% 39% / 0.3) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to={isAdmin ? "/admin" : "/mentor-dashboard"} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Promo & Referral Codes</h1>
            <p className="text-sm text-muted-foreground mt-1">Create and manage discount codes.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="text-xs font-semibold" onClick={() => setShowCreate(!showCreate)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> New Code
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={signOut}>
              <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign Out
            </Button>
          </div>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="rounded-2xl border border-primary/30 bg-card p-6 mb-6 space-y-4">
            <h3 className="font-heading font-semibold text-foreground text-sm">Create New Code</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Code</Label>
                <Input value={newCode} onChange={(e) => setNewCode(e.target.value)} className="bg-muted border-border text-sm uppercase" placeholder="SUMMER20" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Type</Label>
                <div className="flex gap-2">
                  {(["promo", "referral"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setNewType(t)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-all ${
                        newType === t ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground"
                      }`}
                    >
                      {t === "promo" ? <Tag className="h-3 w-3 inline mr-1" /> : <Ticket className="h-3 w-3 inline mr-1" />}
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Discount %</Label>
                <Input type="number" value={newDiscount} onChange={(e) => setNewDiscount(e.target.value)} className="bg-muted border-border text-sm" min="1" max="100" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Max Uses (optional)</Label>
                <Input type="number" value={newMaxUses} onChange={(e) => setNewMaxUses(e.target.value)} className="bg-muted border-border text-sm" placeholder="Unlimited" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Expires (optional)</Label>
                <Input type="date" value={newExpires} onChange={(e) => setNewExpires(e.target.value)} className="bg-muted border-border text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="text-xs font-semibold" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                Create Code
              </Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Codes list */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-16 text-muted-foreground text-sm">Loading codes...</div>
          ) : codes.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No codes yet. Create your first one!</div>
          ) : (
            codes.map((code: any) => (
              <div key={code.id} className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                    {code.type === "referral" ? <Ticket className="h-5 w-5 text-primary" /> : <Tag className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-foreground text-sm tracking-wider">{code.code}</span>
                      <Badge variant="secondary" className="text-[10px] capitalize">{code.type}</Badge>
                      <Badge variant={code.active ? "default" : "secondary"} className="text-[10px]">
                        {code.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{code.discount_percent}% off</span>
                      <span>{code.current_uses}{code.max_uses ? `/${code.max_uses}` : ""} uses</span>
                      {code.expires_at && <span>Expires {new Date(code.expires_at).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      navigator.clipboard.writeText(code.code);
                      toast.success("Code copied!");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Switch
                    checked={code.active}
                    onCheckedChange={(active) => toggleMutation.mutate({ id: code.id, active })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (window.confirm("Delete this code?")) deleteMutation.mutate(code.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscountCodes;
