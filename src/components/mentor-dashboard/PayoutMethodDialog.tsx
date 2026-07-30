import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bitcoin, Landmark, Wallet } from "lucide-react";

export type PayoutMethod = "crypto" | "bank" | "paypal";

type Field = { key: string; label: string; placeholder: string; options?: string[] };

// Crypto and PayPal rails have a fixed shape. Bank rails vary by country
// (see BANK_SCHEMES) so they're built dynamically below.
const SIMPLE_FIELDS: Record<"crypto" | "paypal", Field[]> = {
  crypto: [{ key: "wallet_address", label: "Wallet address", placeholder: "0x… or T…" }],
  paypal: [{ key: "paypal_email", label: "PayPal email", placeholder: "you@example.com" }],
};

// Every bank submission carries the account holder + bank name; the country
// then decides which scheme-specific fields are asked for.
const BANK_COMMON_FIELDS: Field[] = [
  { key: "account_holder", label: "Account holder", placeholder: "Full name on the account" },
  { key: "bank_name", label: "Bank name", placeholder: "Your bank" },
];

// Banking schemes keyed by an internal id. Mirrors BANK_SCHEME_FIELDS in the
// mentor-payouts function — keep the field keys in sync with it.
const BANK_SCHEMES: Record<string, { fields: Field[] }> = {
  iban: {
    fields: [
      { key: "iban", label: "IBAN", placeholder: "HR12 3456 7890 1234 5678 9" },
      { key: "swift", label: "SWIFT / BIC", placeholder: "ZABAHR2X" },
    ],
  },
  us: {
    fields: [
      { key: "routing_number", label: "Routing number (ABA)", placeholder: "021000021" },
      { key: "account_number", label: "Account number", placeholder: "1234567890" },
      { key: "account_type", label: "Account type", placeholder: "Checking or savings", options: ["Checking", "Savings"] },
    ],
  },
  uk: {
    fields: [
      { key: "sort_code", label: "Sort code", placeholder: "12-34-56" },
      { key: "account_number", label: "Account number", placeholder: "12345678" },
    ],
  },
  canada: {
    fields: [
      { key: "institution_number", label: "Institution number", placeholder: "001" },
      { key: "transit_number", label: "Transit (branch) number", placeholder: "12345" },
      { key: "account_number", label: "Account number", placeholder: "1234567" },
    ],
  },
  australia: {
    fields: [
      { key: "bsb", label: "BSB code", placeholder: "062-000" },
      { key: "account_number", label: "Account number", placeholder: "12345678" },
    ],
  },
  india: {
    fields: [
      { key: "ifsc", label: "IFSC code", placeholder: "HDFC0001234" },
      { key: "account_number", label: "Account number", placeholder: "12345678901234" },
    ],
  },
  other: {
    fields: [
      { key: "swift", label: "SWIFT / BIC", placeholder: "AAAABBCCDDD" },
      { key: "account_number", label: "Account number / IBAN", placeholder: "Account number or IBAN" },
    ],
  },
};

// Country → banking scheme. Countries not on this list use the "Other /
// not listed" option, which falls back to the international SWIFT format.
const BANK_COUNTRIES: { name: string; scheme: keyof typeof BANK_SCHEMES }[] = [
  { name: "Albania", scheme: "iban" },
  { name: "Andorra", scheme: "iban" },
  { name: "Argentina", scheme: "other" },
  { name: "Australia", scheme: "australia" },
  { name: "Austria", scheme: "iban" },
  { name: "Belgium", scheme: "iban" },
  { name: "Bosnia and Herzegovina", scheme: "iban" },
  { name: "Brazil", scheme: "other" },
  { name: "Bulgaria", scheme: "iban" },
  { name: "Canada", scheme: "canada" },
  { name: "Chile", scheme: "other" },
  { name: "China", scheme: "other" },
  { name: "Colombia", scheme: "other" },
  { name: "Croatia", scheme: "iban" },
  { name: "Cyprus", scheme: "iban" },
  { name: "Czechia", scheme: "iban" },
  { name: "Denmark", scheme: "iban" },
  { name: "Egypt", scheme: "other" },
  { name: "Estonia", scheme: "iban" },
  { name: "Finland", scheme: "iban" },
  { name: "France", scheme: "iban" },
  { name: "Georgia", scheme: "iban" },
  { name: "Germany", scheme: "iban" },
  { name: "Greece", scheme: "iban" },
  { name: "Hong Kong", scheme: "other" },
  { name: "Hungary", scheme: "iban" },
  { name: "Iceland", scheme: "iban" },
  { name: "India", scheme: "india" },
  { name: "Indonesia", scheme: "other" },
  { name: "Ireland", scheme: "iban" },
  { name: "Israel", scheme: "iban" },
  { name: "Italy", scheme: "iban" },
  { name: "Japan", scheme: "other" },
  { name: "Kenya", scheme: "other" },
  { name: "Latvia", scheme: "iban" },
  { name: "Liechtenstein", scheme: "iban" },
  { name: "Lithuania", scheme: "iban" },
  { name: "Luxembourg", scheme: "iban" },
  { name: "Malaysia", scheme: "other" },
  { name: "Malta", scheme: "iban" },
  { name: "Mexico", scheme: "other" },
  { name: "Monaco", scheme: "iban" },
  { name: "Montenegro", scheme: "iban" },
  { name: "Morocco", scheme: "other" },
  { name: "Netherlands", scheme: "iban" },
  { name: "New Zealand", scheme: "other" },
  { name: "Nigeria", scheme: "other" },
  { name: "North Macedonia", scheme: "iban" },
  { name: "Norway", scheme: "iban" },
  { name: "Pakistan", scheme: "other" },
  { name: "Peru", scheme: "other" },
  { name: "Philippines", scheme: "other" },
  { name: "Poland", scheme: "iban" },
  { name: "Portugal", scheme: "iban" },
  { name: "Qatar", scheme: "iban" },
  { name: "Romania", scheme: "iban" },
  { name: "Saudi Arabia", scheme: "iban" },
  { name: "Serbia", scheme: "iban" },
  { name: "Singapore", scheme: "other" },
  { name: "Slovakia", scheme: "iban" },
  { name: "Slovenia", scheme: "iban" },
  { name: "South Africa", scheme: "other" },
  { name: "South Korea", scheme: "other" },
  { name: "Spain", scheme: "iban" },
  { name: "Sweden", scheme: "iban" },
  { name: "Switzerland", scheme: "iban" },
  { name: "Taiwan", scheme: "other" },
  { name: "Thailand", scheme: "other" },
  { name: "Turkey", scheme: "iban" },
  { name: "Ukraine", scheme: "iban" },
  { name: "United Arab Emirates", scheme: "iban" },
  { name: "United Kingdom", scheme: "uk" },
  { name: "United States", scheme: "us" },
  { name: "Vietnam", scheme: "other" },
];

const OTHER_COUNTRY = "__other__";

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

// Recover the country dropdown selection from a saved bank method.
function initialCountryChoice(initial?: Props["initial"]): string {
  if (initial?.method !== "bank") return "";
  const country = initial.details.country ?? "";
  if (BANK_COUNTRIES.some((c) => c.name === country)) return country;
  return initial.details.bank_scheme ? OTHER_COUNTRY : "";
}

const PayoutMethodDialog = ({ open, onOpenChange, initial, onSave, saving }: Props) => {
  const [method, setMethod] = useState<PayoutMethod>(initial?.method ?? "crypto");
  const [values, setValues] = useState<Record<string, string>>(initial?.details ?? { asset: "USDT", network: "TRC20" });
  const [countryChoice, setCountryChoice] = useState<string>(() => initialCountryChoice(initial));

  const set = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }));

  const pickMethod = (next: PayoutMethod) => {
    setMethod(next);
    setCountryChoice("");
    // Seed the crypto dropdowns so the mentor can save without touching them.
    setValues(next === "crypto" ? { asset: "USDT", network: "TRC20" } : {});
  };

  // Picking a country resolves the banking scheme and stores the country name.
  // "Other" clears the country so the mentor can type one in.
  const pickCountry = (choice: string) => {
    setCountryChoice(choice);
    if (choice === OTHER_COUNTRY) {
      setValues((v) => ({ ...v, bank_scheme: "other", country: "" }));
    } else {
      const found = BANK_COUNTRIES.find((c) => c.name === choice);
      setValues((v) => ({ ...v, bank_scheme: found?.scheme ?? "other", country: choice }));
    }
  };

  const bankFields = method === "bank" && values.bank_scheme
    ? [...BANK_COMMON_FIELDS, ...(BANK_SCHEMES[values.bank_scheme]?.fields ?? [])]
    : [];

  let required: string[] = [];
  if (method === "crypto") required = ["asset", "network", "wallet_address"];
  else if (method === "paypal") required = ["paypal_email"];
  else if (method === "bank") required = ["bank_scheme", "country", ...bankFields.map((f) => f.key)];
  const complete = required.length > 0 && required.every((k) => (values[k] ?? "").trim().length > 0);

  const renderField = (f: Field) => (
    <div key={f.key}>
      <Label className="text-xs">{f.label}</Label>
      {f.options ? (
        <Select value={values[f.key] ?? ""} onValueChange={(v) => set(f.key, v)}>
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={f.placeholder} /></SelectTrigger>
          <SelectContent>{f.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
      ) : (
        <Input
          value={values[f.key] ?? ""}
          onChange={(e) => set(f.key, e.target.value)}
          placeholder={f.placeholder}
          className="h-9 text-sm"
        />
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How do you want to get paid?</DialogTitle>
          <DialogDescription>
            Pick a payout rail and fill in the details we'll send your earnings to. You can change this at any time.
          </DialogDescription>
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

          {/* Crypto / PayPal fields */}
          {(method === "crypto" || method === "paypal") && (
            <div className="space-y-3">{SIMPLE_FIELDS[method].map(renderField)}</div>
          )}

          {/* Bank fields — country decides which scheme's fields are shown */}
          {method === "bank" && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Bank country</Label>
                <Select value={countryChoice} onValueChange={pickCountry}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select your country" /></SelectTrigger>
                  <SelectContent>
                    {BANK_COUNTRIES.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                    <SelectItem value={OTHER_COUNTRY}>Other / not listed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {countryChoice === OTHER_COUNTRY && (
                <div>
                  <Label className="text-xs">Country name</Label>
                  <Input
                    value={values.country ?? ""}
                    onChange={(e) => set("country", e.target.value)}
                    placeholder="Your country"
                    className="h-9 text-sm"
                  />
                </div>
              )}

              {values.bank_scheme && (
                <>
                  {bankFields.map(renderField)}
                  <p className="text-[11px] text-muted-foreground">
                    Enter the details exactly as your bank lists them so your payout isn't delayed.
                  </p>
                </>
              )}
            </div>
          )}

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
