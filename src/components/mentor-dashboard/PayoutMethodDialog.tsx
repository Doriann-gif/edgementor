import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bitcoin, Landmark, Wallet } from "lucide-react";

export type PayoutMethod = "crypto" | "bank" | "paypal";

/** Field definitions per rail — mirrors METHOD_FIELDS in the mentor-payouts function. */
const FIELDS: Record<PayoutMethod, { key: string; label: string; placeholder: string }[]> = {
  crypto: [
    { key: "wallet_address", label: "Wallet address", placeholder: "0x… or T…" },
  ],
  bank: [
    { key: "account_holder", label: "Account holder", placeholder: "Full name on the account" },
    { key: "iban", label: "IBAN / account number", placeholder: "HR12 3456 …" },
    { key: "swift", label: "SWIFT / BIC", placeholder: "ZABAHR2X" },
    { key: "bank_name", label: "Bank name", placeholder: "Zagrebačka Banka" },
    { key: "country", label: "Bank country", placeholder: "Croatia" },
  ],
  paypal: [
    { key: "paypal_email", label: "PayPal email", placeholder: "you@example.com" },
  ],
};

const OPTIONS: { value: PayoutMethod; label: string; hint: string; icon: typeof Wallet }[] = [
  { value: "crypto", label: "Crypto", hint: "USDT, USDC or BTC", icon: Bitcoin },
  { value: "bank", label: "Bank transfer", hint: "Direct to your bank", icon: Landmark },
  { value: "paypal", label: "PayPal", hint: "Paid to your PayPal", icon: Wallet },
];

const ASSETS = ["USDT", "USDC", "BTC", "ETH"];
const NETWORKS = ["TRC20", "ERC20", "BEP20", "Solana", "Bitcoin", "Lightning"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: { method: PayoutMethod; details: Record<string, string> } | null;
  onSave: (method: PayoutMethod, details: Record<string, string>) => void;
  saving?: boolean;
};

const PayoutMethodDialog = ({ open, onOpenChange, initial, onSave, saving }: Props) => {
  const [method, setMethod] = useState<PayoutMethod>(initial?.method ?? "crypto");
  const [values, setValues] = useState<Record<string, string>>(initial?.details ?? { asset: "USDT", network: "TRC20" });

  const set = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }));

  const pickMethod = (next: PayoutMethod) => {
    setMethod(next);
    // Seed the crypto dropdowns so the mentor can save without touching them.
    setValues(next === "crypto" ? { asset: "USDT", network: "TRC20" } : {});
  };

  const required = FIELDS[method].map((f) => f.key).concat(method === "crypto" ? ["asset", "network"] : []);
  const complete = required.every((k) => (values[k] ?? "").trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How do you want to get paid?</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Rail picker */}
          <div className="grid grid-cols-3 gap-2">
            {OPTIONS.map((o) => {
              const Icon = o.icon;
              const active = method === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => pickMethod(o.value)}
                  className={`rounded-xl border p-3 text-center transition-colors ${
                    active ? "border-primary bg-primary/10" : "border-border bg-muted/40 hover:bg-muted"
                  }`}
                >
                  <Icon className={`h-5 w-5 mx-auto mb-1.5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="text-xs font-medium text-foreground">{o.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{o.hint}</p>
                </button>
              );
            })}
          </div>

          {/* Crypto asset/network pickers */}
          {method === "crypto" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Asset</Label>
                <Select value={values.asset ?? "USDT"} onValueChange={(v) => set("asset", v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{ASSETS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Network</Label>
                <Select value={values.network ?? "TRC20"} onValueChange={(v) => set("network", v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{NETWORKS.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Per-rail fields */}
          <div className="space-y-3">
            {FIELDS[method].map((f) => (
              <div key={f.key}>
                <Label className="text-xs">{f.label}</Label>
                <Input
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="h-9 text-sm"
                />
              </div>
            ))}
          </div>

          {method === "crypto" && (
            <p className="text-[11px] text-amber-400">
              Double-check the address and network — crypto sent to a wrong address can't be recovered.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave(method, values)} disabled={!complete || saving}>
            {saving ? "Saving…" : "Save payout method"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PayoutMethodDialog;
