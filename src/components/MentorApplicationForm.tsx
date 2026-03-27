import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MultiSelect from "@/components/MultiSelect";
import { Upload, TrendingUp, DollarSign, User, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const INSTRUMENTS = ["Futures", "Forex", "Crypto", "Equities"];
const CONCEPTS = ["ICT", "Order Flow", "Supply & Demand", "Price Action", "VWAP"];
const SESSIONS = ["London", "New York", "Asian"];

const MentorApplicationForm = () => {
  const [fullName, setFullName] = useState("");
  const [experience, setExperience] = useState("");
  const [instruments, setInstruments] = useState<string[]>([]);
  const [concepts, setConcepts] = useState<string[]>([]);
  const [session, setSession] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (showSuccess) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
    }
  }, [showSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !experience || instruments.length === 0 || concepts.length === 0 || !session || !monthlyPrice || !bio) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("mentor_applications").insert({
        full_name: fullName,
        experience,
        instruments,
        concepts,
        session,
        monthly_price: parseInt(monthlyPrice, 10),
        bio,
      });

      if (error) throw error;

      setShowSuccess(true);
      setFullName("");
      setExperience("");
      setInstruments([]);
      setConcepts([]);
      setSession("");
      setProofFile(null);
      setMonthlyPrice("");
      setBio("");
    } catch (err) {
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-8">
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(hsl(160 84% 39% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(160 84% 39% / 0.3) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />
      <div className="w-full max-w-2xl relative">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6">
            <TrendingUp className="h-3.5 w-3.5" /> Mentor Application
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground tracking-tight">Share Your Edge</h1>
          <p className="mt-3 text-muted-foreground text-sm max-w-md mx-auto">Apply to become a verified mentor on the marketplace. Prove your track record and start earning.</p>
        </div>
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-7 shadow-xl shadow-black/20">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium flex items-center gap-2"><User className="h-3.5 w-3.5 text-primary" /> Full Name</Label>
            <Input id="fullName" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-muted border-border focus:border-primary/50 transition-colors" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="experience" className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5 text-primary" /> Years of Trading Experience</Label>
            <Select value={experience} onValueChange={setExperience}>
              <SelectTrigger className="bg-muted border-border focus:border-primary/50"><SelectValue placeholder="Select experience" /></SelectTrigger>
              <SelectContent>
                {["1-2 years", "3-5 years", "5-8 years", "8-10 years", "10+ years"].map((yr) => <SelectItem key={yr} value={yr}>{yr}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <MultiSelect label="Instruments Traded" options={INSTRUMENTS} selected={instruments} onChange={setInstruments} />
          <MultiSelect label="Concepts / Methodologies" options={CONCEPTS} selected={concepts} onChange={setConcepts} />
          <div className="space-y-2">
            <Label className="text-sm font-medium">Primary Trading Session</Label>
            <div className="flex gap-3">
              {SESSIONS.map((s) => (
                <button key={s} type="button" onClick={() => setSession(s)}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${session === s ? "border-primary/50 bg-primary/10 text-primary shadow-[var(--glow-primary)]" : "border-border bg-secondary text-muted-foreground hover:border-primary/30 hover:text-foreground"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-primary" /> Proof of Profitability</Label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50 p-8 transition-colors hover:border-primary/30 hover:bg-muted">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm font-medium text-foreground">{proofFile ? proofFile.name : "Upload statement or screenshot"}</span>
              <span className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG up to 10MB</span>
              <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setProofFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm font-medium flex items-center gap-2"><DollarSign className="h-3.5 w-3.5 text-primary" /> Desired Monthly Price (USD)</Label>
            <Input id="price" type="number" placeholder="e.g. 199" value={monthlyPrice} onChange={(e) => setMonthlyPrice(e.target.value)} className="bg-muted border-border focus:border-primary/50 transition-colors" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-medium">Short Bio</Label>
            <Textarea id="bio" placeholder="Describe your trading journey, edge, and what students can expect..." rows={4} value={bio} onChange={(e) => setBio(e.target.value)} className="bg-muted border-border focus:border-primary/50 transition-colors resize-none" />
          </div>
          <Button type="submit" className="w-full h-12 text-sm font-semibold tracking-wide" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Application"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">Applications are reviewed within 48 hours. You'll receive an email notification.</p>
        </form>
      </div>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader className="items-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-xl">Application Submitted! 🎉</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              Thanks for applying! Our team will review your application shortly — you'll receive an email once it's been approved. Hang tight!
            </DialogDescription>
          </DialogHeader>
          <DialogClose asChild>
            <Button className="mt-4 w-full">Got it</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MentorApplicationForm;
