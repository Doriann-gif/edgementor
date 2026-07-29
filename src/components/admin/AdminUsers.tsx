import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import {
  Search, Shield, ShieldCheck, ShieldAlert, Ban, KeyRound, Trash2, Mail,
  CalendarDays, Clock, Globe, CheckCircle2, XCircle, Crown, User as UserIcon, Save,
} from "lucide-react";
import { toast } from "sonner";

type UserRow = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  banned_until: string | null;
  providers: string[];
  display_name: string | null;
  country: string | null;
  age: number | null;
  roles: string[];
  is_mentor: boolean;
  mentor_name: string | null;
  mentor_status: string | null;
  active_subs: number;
  total_subs: number;
};

// Call the admin-users edge function and surface the real error message
// (supabase-js hides the JSON body behind a generic FunctionsHttpError).
async function callAdmin<T = any>(payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("admin-users", { body: payload });
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

const isBanned = (u: { banned_until: string | null }) =>
  Boolean(u.banned_until && new Date(u.banned_until) > new Date());

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ type: "ban" | "unban" | "delete" | "reset"; user: UserRow | { id: string; display_name: string | null; email: string | null } } | null>(null);
  const [deleteText, setDeleteText] = useState("");
  const [edit, setEdit] = useState<Record<string, any> | null>(null);

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await callAdmin<{ users: UserRow[] }>({ action: "list" })).users,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["admin-user-detail", selectedId],
    enabled: !!selectedId,
    queryFn: async () => (await callAdmin<{ detail: any }>({ action: "get", user_id: selectedId })).detail,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    if (selectedId) queryClient.invalidateQueries({ queryKey: ["admin-user-detail", selectedId] });
  };

  const action = useMutation({
    mutationFn: (payload: Record<string, unknown>) => callAdmin(payload),
    onSuccess: () => invalidate(),
    onError: (e: any) => toast.error(e?.message || "Action failed"),
  });

  const run = (payload: Record<string, unknown>, success: string) =>
    action.mutate(payload, { onSuccess: () => { invalidate(); toast.success(success); } });

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || (u.display_name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
  });

  const roleBadges = (roles: string[], isMentor: boolean) => (
    <div className="flex flex-wrap gap-1">
      {roles.includes("admin") && <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30"><Crown className="h-2.5 w-2.5 mr-0.5" />Admin</Badge>}
      {roles.includes("moderator") && <Badge variant="secondary" className="text-[10px]"><ShieldCheck className="h-2.5 w-2.5 mr-0.5" />Mod</Badge>}
      {isMentor && <Badge variant="outline" className="text-[10px]">Mentor</Badge>}
      {roles.length === 0 && !isMentor && <span className="text-[10px] text-muted-foreground">User</span>}
    </div>
  );

  const openConfirm = () => {
    if (!confirm) return;
    const { type, user } = confirm;
    if (type === "ban") run({ action: "ban", user_id: user.id, ban: true }, "User banned.");
    if (type === "unban") run({ action: "ban", user_id: user.id, ban: false }, "Ban lifted.");
    if (type === "reset") run({ action: "send_password_reset", user_id: user.id }, "Password-reset email sent.");
    if (type === "delete") {
      run({ action: "delete_user", user_id: user.id }, "User permanently deleted.");
      setSelectedId(null);
    }
    setConfirm(null);
    setDeleteText("");
  };

  const saveProfile = () => {
    if (!selectedId || !edit) return;
    run({ action: "update_profile", user_id: selectedId, updates: edit }, "Profile updated.");
    setEdit(null);
  };

  if (isLoading) return <p className="text-center py-12 text-muted-foreground text-sm">Loading users…</p>;
  if (error) return <p className="text-center py-12 text-destructive text-sm">{(error as Error).message}</p>;

  const p = detail?.profile;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-muted border-border" />
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground whitespace-nowrap">
          <span><strong className="text-foreground">{users.length}</strong> total</span>
          <span><strong className="text-foreground">{users.filter((u) => u.roles.includes("admin")).length}</strong> admins</span>
          <span><strong className="text-foreground">{users.filter((u) => isBanned(u)).length}</strong> banned</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Subs</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last active</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">No users found.</TableCell></TableRow>
            ) : filtered.map((u) => (
              <TableRow key={u.id} className="cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => { setSelectedId(u.id); setEdit(null); }}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {(u.display_name || u.email || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate max-w-[180px]">{u.display_name || "—"}</p>
                      <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">{u.email || "no email"}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{roleBadges(u.roles, u.is_mentor)}</TableCell>
                <TableCell className="text-xs">{u.active_subs > 0 ? <span className="text-foreground font-medium">{u.active_subs} active</span> : <span className="text-muted-foreground">{u.total_subs || 0}</span>}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{format(new Date(u.created_at), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{u.last_sign_in_at ? format(new Date(u.last_sign_in_at), "MMM d, yyyy") : "never"}</TableCell>
                <TableCell>
                  {isBanned(u)
                    ? <Badge variant="destructive" className="text-[10px]"><Ban className="h-2.5 w-2.5 mr-0.5" />Banned</Badge>
                    : <Badge className="text-[10px] bg-emerald-500/15 text-emerald-500 border-emerald-500/30"><CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Active</Badge>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selectedId} onOpenChange={(open) => { if (!open) { setSelectedId(null); setEdit(null); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              {detail?.profile?.display_name || detail?.email || "User"}
            </DialogTitle>
          </DialogHeader>

          {detailLoading || !detail ? (
            <p className="text-center py-10 text-muted-foreground text-sm">Loading…</p>
          ) : (
            <div className="space-y-6">
              {/* Account facts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" /><span className="truncate">{detail.email || "—"}</span>
                  {detail.email_confirmed_at
                    ? <Badge variant="outline" className="text-[9px] text-emerald-500 border-emerald-500/30">verified</Badge>
                    : <Badge variant="outline" className="text-[9px] text-amber-500 border-amber-500/30">unverified</Badge>}
                </div>
                <div className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />Joined {format(new Date(detail.created_at), "MMM d, yyyy")}</div>
                <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-muted-foreground" />Last active {detail.last_sign_in_at ? format(new Date(detail.last_sign_in_at), "MMM d, yyyy 'at' HH:mm") : "never"}</div>
                <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-muted-foreground" />{detail.providers?.join(", ") || "email"}</div>
                <div className="flex items-center gap-2 col-span-full font-mono text-[11px] text-muted-foreground">ID: {detail.id}</div>
              </div>

              {/* Roles / access */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Roles &amp; access</Label>
                <div className="flex flex-wrap items-center gap-2">
                  {(["admin", "moderator"] as const).map((role) => {
                    const has = detail.roles?.includes(role);
                    return (
                      <Button
                        key={role}
                        size="sm"
                        variant={has ? "default" : "outline"}
                        className="h-7 text-[11px] capitalize"
                        disabled={action.isPending}
                        onClick={() => run(
                          { action: has ? "remove_role" : "set_role", user_id: detail.id, role },
                          has ? `${role} role revoked.` : `${role} role granted.`,
                        )}
                      >
                        {role === "admin" ? <Crown className="h-3 w-3 mr-1" /> : <ShieldCheck className="h-3 w-3 mr-1" />}
                        {has ? `Revoke ${role}` : `Make ${role}`}
                      </Button>
                    );
                  })}
                  {detail.mentor && (
                    <Badge variant="outline" className="text-[10px]">Mentor: {detail.mentor.name} ({detail.mentor.status})</Badge>
                  )}
                </div>
              </div>

              {/* Editable profile */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Profile</Label>
                  {edit
                    ? <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setEdit(null)}>Cancel</Button>
                        <Button size="sm" className="h-7 text-[11px]" onClick={saveProfile} disabled={action.isPending}><Save className="h-3 w-3 mr-1" />Save</Button>
                      </div>
                    : <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setEdit({
                        display_name: p?.display_name ?? "", country: p?.country ?? "", age: p?.age ?? "",
                        trading_experience: p?.trading_experience ?? "", timezone: p?.timezone ?? "", bio: p?.bio ?? "",
                      })}>Edit</Button>}
                </div>

                {edit ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><Label className="text-[11px]">Display name</Label><Input value={edit.display_name} onChange={(e) => setEdit({ ...edit, display_name: e.target.value })} className="h-8 text-sm" /></div>
                    <div><Label className="text-[11px]">Country</Label><Input value={edit.country} onChange={(e) => setEdit({ ...edit, country: e.target.value })} className="h-8 text-sm" /></div>
                    <div><Label className="text-[11px]">Age</Label><Input type="number" value={edit.age} onChange={(e) => setEdit({ ...edit, age: e.target.value === "" ? "" : Number(e.target.value) })} className="h-8 text-sm" /></div>
                    <div><Label className="text-[11px]">Trading experience</Label><Input value={edit.trading_experience} onChange={(e) => setEdit({ ...edit, trading_experience: e.target.value })} className="h-8 text-sm" /></div>
                    <div><Label className="text-[11px]">Timezone</Label><Input value={edit.timezone} onChange={(e) => setEdit({ ...edit, timezone: e.target.value })} className="h-8 text-sm" /></div>
                    <div className="sm:col-span-2"><Label className="text-[11px]">Bio</Label><Textarea rows={2} value={edit.bio} onChange={(e) => setEdit({ ...edit, bio: e.target.value })} className="text-sm" /></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                    <div><span className="text-[11px] text-muted-foreground block">Country</span>{p?.country || "—"}</div>
                    <div><span className="text-[11px] text-muted-foreground block">Age</span>{p?.age ?? "—"}</div>
                    <div><span className="text-[11px] text-muted-foreground block">Experience</span>{p?.trading_experience || "—"}</div>
                    <div><span className="text-[11px] text-muted-foreground block">Timezone</span>{p?.timezone || "—"}</div>
                    <div className="col-span-2 sm:col-span-3"><span className="text-[11px] text-muted-foreground block">Bio</span>{p?.bio || "—"}</div>
                    <div className="col-span-2 sm:col-span-3"><span className="text-[11px] text-muted-foreground block">Interests</span>
                      {p?.trading_interests?.length ? <div className="flex flex-wrap gap-1 mt-0.5">{p.trading_interests.map((i: string) => <Badge key={i} variant="secondary" className="text-[10px]">{i}</Badge>)}</div> : "—"}
                    </div>
                  </div>
                )}
              </div>

              {/* Subscriptions */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Subscriptions ({detail.subscriptions?.length || 0})</Label>
                {detail.subscriptions?.length ? (
                  <div className="rounded-lg border border-border divide-y divide-border">
                    {detail.subscriptions.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium">{s.mentors?.name || "Unknown mentor"}</p>
                          <p className="text-[11px] text-muted-foreground">Started {format(new Date(s.started_at), "MMM d, yyyy")}{s.expires_at ? ` · ends ${format(new Date(s.expires_at), "MMM d, yyyy")}` : ""}</p>
                        </div>
                        <Badge variant={s.status === "active" ? "default" : "destructive"} className="text-[10px] capitalize">
                          {s.status === "active" ? <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> : <XCircle className="h-2.5 w-2.5 mr-0.5" />}{s.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-muted-foreground">No subscriptions.</p>}
              </div>

              {/* Danger zone / account actions */}
              <div className="space-y-2 pt-2 border-t border-border">
                <Label className="text-xs text-muted-foreground flex items-center gap-1"><ShieldAlert className="h-3.5 w-3.5" />Account actions</Label>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="h-8 text-[11px]" disabled={action.isPending}
                    onClick={() => setConfirm({ type: "reset", user: { id: detail.id, display_name: detail.profile?.display_name, email: detail.email } })}>
                    <KeyRound className="h-3.5 w-3.5 mr-1" />Send password reset
                  </Button>
                  {isBanned(detail)
                    ? <Button size="sm" variant="outline" className="h-8 text-[11px] text-emerald-500" disabled={action.isPending}
                        onClick={() => setConfirm({ type: "unban", user: { id: detail.id, display_name: detail.profile?.display_name, email: detail.email } })}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Lift ban
                      </Button>
                    : <Button size="sm" variant="outline" className="h-8 text-[11px] text-amber-500" disabled={action.isPending}
                        onClick={() => setConfirm({ type: "ban", user: { id: detail.id, display_name: detail.profile?.display_name, email: detail.email } })}>
                        <Ban className="h-3.5 w-3.5 mr-1" />Ban login
                      </Button>}
                  <Button size="sm" variant="outline" className="h-8 text-[11px] text-destructive hover:bg-destructive hover:text-destructive-foreground" disabled={action.isPending}
                    onClick={() => { setDeleteText(""); setConfirm({ type: "delete", user: { id: detail.id, display_name: detail.profile?.display_name, email: detail.email } }); }}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" />Delete account
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm dialog (ban / unban / reset / delete) */}
      <AlertDialog open={!!confirm} onOpenChange={(open) => { if (!open) { setConfirm(null); setDeleteText(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.type === "ban" && "Ban this user's login?"}
              {confirm?.type === "unban" && "Lift the ban?"}
              {confirm?.type === "reset" && "Send a password-reset email?"}
              {confirm?.type === "delete" && "Permanently delete this account?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {confirm?.type === "ban" && <>They will be unable to sign in until you lift the ban. Existing sessions are revoked.</>}
                {confirm?.type === "unban" && <>They will be able to sign in again.</>}
                {confirm?.type === "reset" && <>A reset link will be emailed to <strong>{confirm.user.email}</strong>.</>}
                {confirm?.type === "delete" && (
                  <div className="space-y-3">
                    <p>This permanently deletes <strong>{confirm.user.display_name || confirm.user.email}</strong> and all their data (profile, subscriptions, roles, mentor listing). Active Stripe subscriptions are cancelled. This cannot be undone.</p>
                    <div>
                      <Label className="text-xs">Type <span className="font-mono">DELETE</span> to confirm</Label>
                      <Input value={deleteText} onChange={(e) => setDeleteText(e.target.value)} className="mt-1 h-8" placeholder="DELETE" />
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={openConfirm}
              disabled={confirm?.type === "delete" && deleteText !== "DELETE"}
              className={confirm?.type === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {confirm?.type === "ban" && "Ban"}
              {confirm?.type === "unban" && "Lift ban"}
              {confirm?.type === "reset" && "Send email"}
              {confirm?.type === "delete" && "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
