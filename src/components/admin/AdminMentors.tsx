import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Ban, Trash2, Search, RotateCcw, Pencil, Eye, DollarSign, Shield } from "lucide-react";
import { toast } from "sonner";
import TierBadge from "@/components/TierBadge";
import type { MentorTier } from "@/types/mentor";

type Mentor = {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  full_bio: string;
  experience: string;
  instruments: string[];
  concepts: string[];
  session: string;
  monthly_price: number;
  rating: number;
  students: number;
  available: boolean;
  status: string;
  tier: string;
  user_id: string | null;
  created_at: string;
  highlights: string[];
};

const AdminMentors = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [confirmAction, setConfirmAction] = useState<{ type: "delete" | "suspend" | "remove" | "restore"; mentor: Mentor } | null>(null);
  const [editMentor, setEditMentor] = useState<Mentor | null>(null);
  const [editForm, setEditForm] = useState({ name: "", bio: "", monthly_price: 0, experience: "" });
  const [viewMentor, setViewMentor] = useState<Mentor | null>(null);

  const { data: mentors = [], isLoading } = useQuery({
    queryKey: ["admin-mentors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("mentors").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Mentor[];
    },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-mentors"] });
    queryClient.invalidateQueries({ queryKey: ["mentors"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const suspendMutation = useMutation({
    mutationFn: async ({ id, available }: { id: string; available: boolean }) => {
      const { error } = await supabase.from("mentors").update({ available: !available }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { available }) => {
      invalidateAll();
      toast.success(available ? "Mentor suspended." : "Mentor unsuspended.");
    },
    onError: () => toast.error("Failed to update mentor status."),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mentors").update({ status: "removed", available: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Mentor removed from platform.");
    },
    onError: () => toast.error("Failed to remove mentor."),
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mentors").update({ status: "approved", available: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Mentor restored and re-approved.");
    },
    onError: () => toast.error("Failed to restore mentor."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete related content first
      await supabase.from("mentor_content").delete().eq("mentor_id", id);
      const { error } = await supabase.from("mentors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Mentor permanently deleted.");
    },
    onError: () => toast.error("Failed to delete mentor."),
  });

  const tierMutation = useMutation({
    mutationFn: async ({ id, tier }: { id: string; tier: MentorTier }) => {
      const { error } = await supabase.from("mentors").update({ tier }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Tier updated.");
    },
    onError: () => toast.error("Failed to update tier."),
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Mentor> }) => {
      const { error } = await supabase.from("mentors").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      setEditMentor(null);
      toast.success("Mentor details updated.");
    },
    onError: () => toast.error("Failed to update mentor."),
  });

  const handleConfirm = () => {
    if (!confirmAction) return;
    const { type, mentor } = confirmAction;
    switch (type) {
      case "suspend": suspendMutation.mutate({ id: mentor.id, available: mentor.available }); break;
      case "remove": removeMutation.mutate(mentor.id); break;
      case "restore": restoreMutation.mutate(mentor.id); break;
      case "delete": deleteMutation.mutate(mentor.id); break;
    }
    setConfirmAction(null);
  };

  const openEdit = (m: Mentor) => {
    setEditForm({ name: m.name, bio: m.bio, monthly_price: m.monthly_price, experience: m.experience });
    setEditMentor(m);
  };

  const filtered = mentors.filter((m) => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" ||
      (statusFilter === "suspended" ? !m.available : m.status === statusFilter);
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (m: Mentor) => {
    if (m.status === "removed") return <Badge variant="destructive" className="text-[10px]">Removed</Badge>;
    if (!m.available) return <Badge variant="destructive" className="text-[10px]">Suspended</Badge>;
    if (m.status === "approved") return <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">Active</Badge>;
    return <Badge variant="secondary" className="text-[10px] capitalize">{m.status}</Badge>;
  };

  if (isLoading) return <p className="text-center py-12 text-muted-foreground text-sm">Loading mentors...</p>;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search mentors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-muted border-border" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {[
            { value: "all", label: "All" },
            { value: "approved", label: "Active" },
            { value: "suspended", label: "Suspended" },
            { value: "removed", label: "Removed" },
            { value: "pending", label: "Pending" },
          ].map((f) => (
            <Button
              key={f.value}
              variant={statusFilter === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(f.value)}
              className="text-xs whitespace-nowrap"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span><strong className="text-foreground">{mentors.filter(m => m.status === "approved" && m.available).length}</strong> Active</span>
        <span><strong className="text-foreground">{mentors.filter(m => !m.available && m.status !== "removed").length}</strong> Suspended</span>
        <span><strong className="text-foreground">{mentors.filter(m => m.status === "removed").length}</strong> Removed</span>
        <span><strong className="text-foreground">{mentors.length}</strong> Total</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mentor</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">No mentors found.</TableCell></TableRow>
            ) : filtered.map((m) => (
              <TableRow key={m.id} className={m.status === "removed" ? "opacity-50" : ""}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {m.avatar?.length <= 3 ? m.avatar : m.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{m.instruments.join(", ")}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={m.tier || "verified"}
                    onValueChange={(value: MentorTier) => tierMutation.mutate({ id: m.id, tier: value })}
                  >
                    <SelectTrigger className="w-[110px] h-7 text-[11px] bg-muted border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="verified"><span className="flex items-center gap-1.5">✅ Verified</span></SelectItem>
                      <SelectItem value="pro"><span className="flex items-center gap-1.5">⭐ Pro</span></SelectItem>
                      <SelectItem value="elite"><span className="flex items-center gap-1.5">👑 Elite</span></SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{getStatusBadge(m)}</TableCell>
                <TableCell className="text-xs font-medium">${m.monthly_price}/mo</TableCell>
                <TableCell className="text-xs">{m.students}</TableCell>
                <TableCell className="text-xs">{Number(m.rating).toFixed(1)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end flex-wrap">
                    {/* View */}
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="View details" onClick={() => setViewMentor(m)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {/* Edit */}
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Edit mentor" onClick={() => openEdit(m)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {/* Suspend/Unsuspend */}
                    {m.status !== "removed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className={`h-7 text-[11px] ${!m.available ? "text-primary" : "text-amber-500"}`}
                        onClick={() => setConfirmAction({ type: "suspend", mentor: m })}
                      >
                        <Ban className="h-3 w-3 mr-1" /> {m.available ? "Suspend" : "Unsuspend"}
                      </Button>
                    )}
                    {/* Remove / Restore */}
                    {m.status === "removed" ? (
                      <Button size="sm" variant="outline" className="h-7 text-[11px] text-primary" onClick={() => setConfirmAction({ type: "restore", mentor: m })}>
                        <RotateCcw className="h-3 w-3 mr-1" /> Restore
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 text-[11px] text-destructive hover:text-destructive" onClick={() => setConfirmAction({ type: "remove", mentor: m })}>
                        <Shield className="h-3 w-3 mr-1" /> Remove
                      </Button>
                    )}
                    {/* Permanent Delete */}
                    <Button size="sm" variant="outline" className="h-7 text-[11px] text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => setConfirmAction({ type: "delete", mentor: m })}>
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "delete" && "Permanently delete this mentor?"}
              {confirmAction?.type === "remove" && "Remove this mentor from the platform?"}
              {confirmAction?.type === "suspend" && (confirmAction.mentor.available ? "Suspend this mentor?" : "Unsuspend this mentor?")}
              {confirmAction?.type === "restore" && "Restore this mentor?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "delete" && (
                <>This will permanently delete <strong>{confirmAction.mentor.name}</strong> and all their content. This action cannot be undone.</>
              )}
              {confirmAction?.type === "remove" && (
                <>This will remove <strong>{confirmAction.mentor.name}</strong> from the public listing. They can be restored later.</>
              )}
              {confirmAction?.type === "suspend" && confirmAction.mentor.available && (
                <>This will suspend <strong>{confirmAction.mentor.name}</strong>. Their profile will be hidden from new subscribers.</>
              )}
              {confirmAction?.type === "suspend" && !confirmAction.mentor.available && (
                <>This will unsuspend <strong>{confirmAction.mentor.name}</strong> and make them visible again.</>
              )}
              {confirmAction?.type === "restore" && (
                <>This will restore <strong>{confirmAction.mentor.name}</strong> and set them back to approved and available.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={confirmAction?.type === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {confirmAction?.type === "delete" && "Delete Permanently"}
              {confirmAction?.type === "remove" && "Remove"}
              {confirmAction?.type === "suspend" && (confirmAction.mentor.available ? "Suspend" : "Unsuspend")}
              {confirmAction?.type === "restore" && "Restore"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Mentor Dialog */}
      <Dialog open={!!viewMentor} onOpenChange={(open) => !open && setViewMentor(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewMentor?.name}
              {viewMentor && <TierBadge tier={(viewMentor.tier as MentorTier) || "verified"} />}
            </DialogTitle>
          </DialogHeader>
          {viewMentor && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-muted-foreground text-xs">Status</Label><p className="font-medium">{viewMentor.status} {!viewMentor.available && "(Suspended)"}</p></div>
                <div><Label className="text-muted-foreground text-xs">Price</Label><p className="font-medium">${viewMentor.monthly_price}/mo</p></div>
                <div><Label className="text-muted-foreground text-xs">Students</Label><p className="font-medium">{viewMentor.students}</p></div>
                <div><Label className="text-muted-foreground text-xs">Rating</Label><p className="font-medium">{Number(viewMentor.rating).toFixed(1)} / 5</p></div>
                <div><Label className="text-muted-foreground text-xs">Experience</Label><p className="font-medium">{viewMentor.experience}</p></div>
                <div><Label className="text-muted-foreground text-xs">Session</Label><p className="font-medium">{viewMentor.session}</p></div>
              </div>
              <div><Label className="text-muted-foreground text-xs">Bio</Label><p className="text-foreground mt-1">{viewMentor.bio}</p></div>
              <div><Label className="text-muted-foreground text-xs">Instruments</Label>
                <div className="flex flex-wrap gap-1 mt-1">{viewMentor.instruments.map(i => <Badge key={i} variant="secondary" className="text-[10px]">{i}</Badge>)}</div>
              </div>
              <div><Label className="text-muted-foreground text-xs">Concepts</Label>
                <div className="flex flex-wrap gap-1 mt-1">{viewMentor.concepts.map(c => <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>)}</div>
              </div>
              <div><Label className="text-muted-foreground text-xs">Joined</Label><p>{new Date(viewMentor.created_at).toLocaleDateString()}</p></div>
              {viewMentor.user_id && <div><Label className="text-muted-foreground text-xs">User ID</Label><p className="text-[11px] text-muted-foreground font-mono">{viewMentor.user_id}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Mentor Dialog */}
      <Dialog open={!!editMentor} onOpenChange={(open) => !open && setEditMentor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Mentor — {editMentor?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Monthly Price ($)</Label>
              <Input type="number" value={editForm.monthly_price} onChange={(e) => setEditForm(f => ({ ...f, monthly_price: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Experience</Label>
              <Input value={editForm.experience} onChange={(e) => setEditForm(f => ({ ...f, experience: e.target.value }))} />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea value={editForm.bio} onChange={(e) => setEditForm(f => ({ ...f, bio: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMentor(null)}>Cancel</Button>
            <Button
              onClick={() => editMentor && editMutation.mutate({
                id: editMentor.id,
                data: { name: editForm.name, bio: editForm.bio, monthly_price: editForm.monthly_price, experience: editForm.experience },
              })}
              disabled={editMutation.isPending}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMentors;
