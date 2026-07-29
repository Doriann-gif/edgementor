import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Banknote, Bitcoin, Landmark, Wallet, Copy, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

type PayoutRequest = {
  id: string;
  mentor_id: string;
  amount: number;
  currency: string;
  method: string;
  method_details: Record<string, string>;
  status: string;
  admin_note: string | null;
  tx_reference: string | null;
  requested_at: string;
  processed_at: string | null;
  mentors?: { name: string; avatar: string; country: string | null };
};

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

const METHOD_ICON: Record<string, typeof Wallet> = { crypto: Bitcoin, bank: Landmark, paypal: Wallet };
const METHOD_LABEL: Record<string, string> = { crypto: "Crypto", bank: "Bank transfer", paypal: "PayPal" };

const AdminPayouts = () => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<PayoutRequest | null>(null);
  const [txRef, setTxRef] = useState("");
  const [note, setNote] = useState("");

  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ["admin-payout-requests"],
    queryFn: async () => (await callPayouts<{ requests: PayoutRequest[] }>({ action: "admin_list" })).requests,
  });

  const resolve = useMutation({
    mutationFn: (vars: { request_id: string; status: string; tx_reference?: string; admin_note?: string }) =>
      callPayouts({ action: "admin_resolve", ...vars }),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-payout-requests"] });
      setSelected(null);
      setTxRef("");
      setNote("");
      toast.success(vars.status === "paid" ? "Marked as paid — mentor balance updated." : `Request ${vars.status}.`);
    },
    onError: (e: any) => toast.error(e?.message || "Action failed"),
  });

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  const pending = requests.filter((r) => r.status === "pending" || r.status === "processing");
  const pendingTotal = pending.reduce((s, r) => s + Number(r.amount), 0);

  const statusBadge = (status: string) => {
    if (status === "paid") return <Badge className="text-[10px] bg-emerald-500/15 text-emerald-500 border-emerald-500/30"><CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Paid</Badge>;
    if (status === "rejected") return <Badge variant="destructive" className="text-[10px]"><XCircle className="h-2.5 w-2.5 mr-0.5" />Rejected</Badge>;
    return <Badge className="text-[10px] bg-amber-400/15 text-amber-400 border-amber-400/30"><Clock className="h-2.5 w-2.5 mr-0.5" />{status}</Badge>;
  };

  if (isLoading) return <p className="text-center py-12 text-muted-foreground text-sm">Loading payout requests…</p>;
  if (error) return <p className="text-center py-12 text-destructive text-sm">{(error as Error).message}</p>;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Pending requests</p>
            <p className="text-2xl font-heading font-bold">{pending.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Owed to mentors</p>
            <p className="text-2xl font-heading font-bold">${pendingTotal.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Total requests</p>
            <p className="text-2xl font-heading font-bold">{requests.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mentor</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">No payout requests yet.</TableCell></TableRow>
            ) : requests.map((r) => {
              const Icon = METHOD_ICON[r.method] ?? Banknote;
              return (
                <TableRow key={r.id} className={r.status === "paid" || r.status === "rejected" ? "opacity-60" : ""}>
                  <TableCell className="font-medium text-sm">{r.mentors?.name || "Unknown"}</TableCell>
                  <TableCell className="font-semibold text-sm">${Number(r.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-xs">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {METHOD_LABEL[r.method] ?? r.method}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(r.requested_at), "MMM d, yyyy")}</TableCell>
                  <TableCell>{statusBadge(r.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant={r.status === "pending" ? "default" : "outline"} className="h-7 text-[11px]"
                      onClick={() => { setSelected(r); setTxRef(r.tx_reference ?? ""); setNote(r.admin_note ?? ""); }}>
                      {r.status === "pending" ? "Pay out" : "View"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Fulfilment dialog — shows the exact details needed to send the money */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pay {selected?.mentors?.name} ${Number(selected?.amount ?? 0).toFixed(2)}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {METHOD_LABEL[selected.method] ?? selected.method} details
                </p>
                {Object.entries(selected.method_details || {}).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground capitalize shrink-0">{k.replace(/_/g, " ")}</span>
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-xs font-mono truncate">{String(v)}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => copy(String(v))}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {selected.status === "pending" || selected.status === "processing" ? (
                <>
                  <div>
                    <Label className="text-xs">Transaction reference (optional)</Label>
                    <Input value={txRef} onChange={(e) => setTxRef(e.target.value)} placeholder="tx hash / transfer id" className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Note (optional)</Label>
                    <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note" className="h-9 text-sm" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Send the money manually first, then mark it paid — that debits the mentor's balance.
                  </p>
                </>
              ) : (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Status: <span className="capitalize text-foreground">{selected.status}</span></p>
                  {selected.tx_reference && <p>Reference: <span className="font-mono">{selected.tx_reference}</span></p>}
                  {selected.processed_at && <p>Processed {format(new Date(selected.processed_at), "MMM d, yyyy 'at' HH:mm")}</p>}
                </div>
              )}
            </div>
          )}
          {(selected?.status === "pending" || selected?.status === "processing") && (
            <DialogFooter className="gap-2">
              <Button variant="outline" className="text-destructive"
                disabled={resolve.isPending}
                onClick={() => resolve.mutate({ request_id: selected.id, status: "rejected", admin_note: note })}>
                Reject
              </Button>
              <Button disabled={resolve.isPending}
                onClick={() => resolve.mutate({ request_id: selected.id, status: "paid", tx_reference: txRef, admin_note: note })}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                {resolve.isPending ? "Saving…" : "Mark as paid"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayouts;
