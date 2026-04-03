import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { CheckCircle, Mail } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MultiSelect from "@/components/MultiSelect";
import { Upload, TrendingUp, DollarSign, User, FileText, Instagram, Sparkles, ArrowRight, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const INSTRUMENTS = ["Futures", "Forex", "Crypto", "Equities"];
const CONCEPTS = ["ICT", "Order Flow", "Supply & Demand", "Price Action", "SMC"];
const SESSIONS = ["London", "New York", "Asian"];
const EXPERIENCE_OPTIONS = ["1-2 years", "3-5 years", "5-8 years", "8-10 years", "10+ years"];

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany", "France",
  "Netherlands", "Sweden", "Switzerland", "Norway", "Denmark", "Finland",
  "Spain", "Italy", "Portugal", "Austria", "Belgium", "Ireland",
  "Japan", "South Korea", "Singapore", "Hong Kong", "India", "Indonesia",
  "Malaysia", "Philippines", "Thailand", "Vietnam", "Taiwan",
  "Brazil", "Mexico", "Argentina", "Colombia", "Chile",
  "South Africa", "Nigeria", "Kenya", "Egypt", "Ghana",
  "United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Israel",
  "Poland", "Czech Republic", "Romania", "Hungary", "Greece",
  "Turkey", "Russia", "Ukraine", "New Zealand", "Pakistan",
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: "easeOut" as const },
  }),
};

const STEPS = [
  { label: "Personal Info", icon: User },
  { label: "Trading Details", icon: TrendingUp },
  { label: "Uploads & Bio", icon: FileText },
  { label: "Review & Submit", icon: Shield },
];

const MentorApplicationForm = () => {
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [socialLink, setSocialLink] = useState("");
  const [country, setCountry] = useState("");
  const [confirmGenuine, setConfirmGenuine] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [experience, setExperience] = useState("");
  const [instruments, setInstruments] = useState<string[]>([]);
  const [concepts, setConcepts] = useState<string[]>([]);
  const [session, setSession] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [paymentType, setPaymentType] = useState<"monthly" | "one_time">("monthly");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSessionOther, setShowSessionOther] = useState(false);
  const [sessionOtherValue, setSessionOtherValue] = useState("");
  const [expOtherMode, setExpOtherMode] = useState(false);

  useEffect(() => {
    if (showSuccess) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
    }
  }, [showSuccess]);

  const addCustomSession = () => {
    const trimmed = sessionOtherValue.trim();
    if (!trimmed) { toast.error("Please enter a session name."); return; }
    const isDuplicate = SESSIONS.some((s) => s.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) { toast.error(`"${trimmed}" is already in the list.`); return; }
    setSession(trimmed);
    setSessionOtherValue("");
    setShowSessionOther(false);
  };

  const canProceed = () => {
    if (step === 0) return fullName && email && country;
    if (step === 1) return experience && instruments.length > 0 && concepts.length > 0 && session;
    if (step === 2) return monthlyPrice && bio;
    if (step === 3) return confirmGenuine && agreeTerms;
    return false;
  };

  const handleSubmit = async () => {
    if (!fullName || !email || !country || !experience || instruments.length === 0 || concepts.length === 0 || !session || !monthlyPrice || !bio) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("mentor_applications").insert({
        full_name: fullName,
        email,
        social_link: socialLink || null,
        experience,
        instruments,
        concepts,
        session,
        monthly_price: parseInt(monthlyPrice, 10),
        payment_type: paymentType,
        bio,
        country: country || null,
        user_id: user?.id || null,
      });
      if (error) throw error;
      setShowSuccess(true);
      setStep(0);
      setFullName(""); setEmail(""); setSocialLink(""); setCountry(""); setConfirmGenuine(false); setAgreeTerms(false);
      setExperience(""); setInstruments([]); setConcepts([]); setSession("");
      setProofFile(null); setProfilePhoto(null); setMonthlyPrice(""); setBio("");
    } catch {
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <motion.div key="step0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium flex items-center gap-2"><User className="h-3.5 w-3.5 text-primary" /> Full Name *</Label>
              <Input id="fullName" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-muted border-border focus:border-primary/50 transition-all duration-300 focus:shadow-[0_0_20px_hsl(var(--primary)/0.15)]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-primary" /> Email Address *</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-muted border-border focus:border-primary/50 transition-all duration-300 focus:shadow-[0_0_20px_hsl(var(--primary)/0.15)]" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2"><User className="h-3.5 w-3.5 text-primary" /> Country *</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="bg-muted border-border focus:border-primary/50"><SelectValue placeholder="Select your country" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {COUNTRIES.sort().map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="socialLink" className="text-sm font-medium flex items-center gap-2"><Instagram className="h-3.5 w-3.5 text-primary" /> Social Link <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input id="socialLink" placeholder="https://instagram.com/yourhandle" value={socialLink} onChange={(e) => setSocialLink(e.target.value)} className="bg-muted border-border focus:border-primary/50 transition-all duration-300 focus:shadow-[0_0_20px_hsl(var(--primary)/0.15)]" />
            </div>
          </motion.div>
        );
      case 1:
        return (
          <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5 text-primary" /> Years of Trading Experience *</Label>
              <Select value={expOtherMode ? "__other__" : experience} onValueChange={(val) => { if (val === "__other__") { setExpOtherMode(true); setExperience(""); } else { setExpOtherMode(false); setExperience(val); } }}>
                <SelectTrigger className="bg-muted border-border focus:border-primary/50"><SelectValue placeholder="Select experience" /></SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_OPTIONS.map((yr) => <SelectItem key={yr} value={yr}>{yr}</SelectItem>)}
                  <SelectItem value="__other__">Other</SelectItem>
                </SelectContent>
              </Select>
              {expOtherMode && (
                <Input
                  autoFocus
                  placeholder="e.g. 15 years, self-taught..."
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="bg-muted border-border focus:border-primary/50 transition-all duration-300 focus:shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
                />
              )}
            </div>
            <MultiSelect label="Instruments Traded *" options={INSTRUMENTS} selected={instruments} onChange={setInstruments} />
            <MultiSelect label="Concepts / Methodologies *" options={CONCEPTS} selected={concepts} onChange={setConcepts} />
            <div className="space-y-2">
              <Label className="text-sm font-medium">Primary Trading Session *</Label>
              <div className="flex flex-wrap gap-3">
                {SESSIONS.map((s) => (
                  <motion.button
                    key={s} type="button" onClick={() => setSession(s)}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className={`flex-1 min-w-[80px] rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${session === s ? "border-primary/50 bg-primary/10 text-primary shadow-[0_0_20px_hsl(var(--primary)/0.2)]" : "border-border bg-secondary text-muted-foreground hover:border-primary/30 hover:text-foreground"}`}
                  >
                    {s}
                  </motion.button>
                ))}
                {!SESSIONS.includes(session) && session && (
                  <motion.button
                    type="button" onClick={() => setSession(session)}
                    whileHover={{ scale: 1.04, y: -2 }}
                    className="flex-1 min-w-[80px] rounded-lg border border-primary/50 bg-primary/10 text-primary px-4 py-2.5 text-sm font-medium shadow-[0_0_20px_hsl(var(--primary)/0.2)]"
                  >
                    {session} <span className="ml-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); setSession(""); }}>×</span>
                  </motion.button>
                )}
                {showSessionOther ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      autoFocus
                      value={sessionOtherValue}
                      onChange={(e) => setSessionOtherValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); addCustomSession(); }
                        if (e.key === "Escape") setShowSessionOther(false);
                      }}
                      placeholder="Type session..."
                      className="h-9 w-32 text-sm bg-muted border-border"
                    />
                    <button type="button" onClick={addCustomSession} className="rounded-lg border border-primary/50 bg-primary/10 text-primary px-2.5 py-2 text-sm font-medium hover:bg-primary/20 transition-colors">Add</button>
                  </div>
                ) : (
                  <motion.button
                    type="button" onClick={() => setShowSessionOther(true)}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="rounded-lg border border-dashed border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all duration-200"
                  >
                    + Other
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2"><User className="h-3.5 w-3.5 text-primary" /> Profile Photo</Label>
              <motion.label whileHover={{ scale: 1.01, borderColor: "hsl(var(--primary) / 0.4)" }} className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-border bg-muted/50 p-4 transition-colors hover:bg-muted">
                {profilePhoto ? (
                  <img src={URL.createObjectURL(profilePhoto)} alt="Preview" className="h-12 w-12 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-foreground block">{profilePhoto ? profilePhoto.name : "Upload profile photo"}</span>
                  <span className="text-xs text-muted-foreground">PNG, JPG up to 5MB</span>
                </div>
                <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.webp" onChange={(e) => setProfilePhoto(e.target.files?.[0] ?? null)} />
              </motion.label>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-primary" /> Proof of Profitability</Label>
              <motion.label whileHover={{ scale: 1.01, borderColor: "hsl(var(--primary) / 0.4)" }} className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50 p-8 transition-colors hover:bg-muted">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium text-foreground">{proofFile ? proofFile.name : "Upload statement or screenshot"}</span>
                <span className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG up to 10MB</span>
                <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setProofFile(e.target.files?.[0] ?? null)} />
              </motion.label>
            </div>
            {/* Payment Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2"><DollarSign className="h-3.5 w-3.5 text-primary" /> Payment Type *</Label>
              <div className="flex gap-3">
                <motion.button
                  type="button" onClick={() => setPaymentType("monthly")}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all duration-200 ${paymentType === "monthly" ? "border-primary/50 bg-primary/10 text-primary shadow-[0_0_20px_hsl(var(--primary)/0.2)]" : "border-border bg-secondary text-muted-foreground hover:border-primary/30 hover:text-foreground"}`}
                >
                  <span className="block font-semibold">Monthly</span>
                  <span className="block text-xs mt-0.5 opacity-70">Recurring subscription</span>
                </motion.button>
                <motion.button
                  type="button" onClick={() => setPaymentType("one_time")}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all duration-200 ${paymentType === "one_time" ? "border-primary/50 bg-primary/10 text-primary shadow-[0_0_20px_hsl(var(--primary)/0.2)]" : "border-border bg-secondary text-muted-foreground hover:border-primary/30 hover:text-foreground"}`}
                >
                  <span className="block font-semibold">One-Time</span>
                  <span className="block text-xs mt-0.5 opacity-70">Single payment</span>
                </motion.button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-medium flex items-center gap-2"><DollarSign className="h-3.5 w-3.5 text-primary" /> {paymentType === "monthly" ? "Monthly Price" : "One-Time Price"} (USD) *</Label>
              <Input id="price" type="number" placeholder="e.g. 199" value={monthlyPrice} onChange={(e) => setMonthlyPrice(e.target.value)} className="bg-muted border-border focus:border-primary/50 transition-all duration-300 focus:shadow-[0_0_20px_hsl(var(--primary)/0.15)]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium">Short Bio *</Label>
              <Textarea id="bio" placeholder="Describe your trading journey, edge, and what students can expect..." rows={5} value={bio} onChange={(e) => setBio(e.target.value)} className="bg-muted border-border focus:border-primary/50 transition-all duration-300 focus:shadow-[0_0_20px_hsl(var(--primary)/0.15)] resize-none" />
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }} className="space-y-6">
            {/* Summary */}
            <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground mb-3">Application Summary</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Name:</span> <span className="text-foreground font-medium">{fullName}</span></div>
                <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground font-medium">{email}</span></div>
                <div><span className="text-muted-foreground">Country:</span> <span className="text-foreground font-medium">{country}</span></div>
                <div><span className="text-muted-foreground">Experience:</span> <span className="text-foreground font-medium">{experience}</span></div>
                <div><span className="text-muted-foreground">Session:</span> <span className="text-foreground font-medium">{session}</span></div>
                <div><span className="text-muted-foreground">Price:</span> <span className="text-foreground font-medium">${monthlyPrice}{paymentType === "monthly" ? "/mo" : " one-time"}</span></div>
                <div><span className="text-muted-foreground">Type:</span> <span className="text-foreground font-medium">{paymentType === "monthly" ? "Monthly Subscription" : "One-Time Payment"}</span></div>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {instruments.map(i => <span key={i} className="rounded-md bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">{i}</span>)}
                {concepts.map(c => <span key={c} className="rounded-md bg-secondary text-secondary-foreground px-2 py-0.5 text-xs font-medium">{c}</span>)}
              </div>
            </div>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" checked={confirmGenuine} onChange={(e) => setConfirmGenuine(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-border accent-primary" />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">I confirm all information and documents submitted are genuine and accurate</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-border accent-primary" />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">I agree to EdgeMentor's <a href="/terms" className="text-primary hover:underline">Terms and Conditions</a></span>
              </label>
            </div>
          </motion.div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-8">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(160 84% 39% / 0.3) 1px, transparent 0)',
          backgroundSize: '48px 48px'
        }} />
        <motion.div
          className="absolute top-[-80px] left-1/4 w-[450px] h-[450px] bg-primary/[0.04] rounded-full blur-[130px]"
          animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-80px] right-1/4 w-[350px] h-[350px] bg-pink-400/[0.03] rounded-full blur-[100px]"
          animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="w-full max-w-2xl relative">
        {/* Header */}
        <motion.div className="text-center mb-8" initial="hidden" animate="show">
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-5">
            <Sparkles className="h-3.5 w-3.5" /> Mentor Application
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="font-heading text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Share Your <span className="bg-gradient-to-r from-primary via-pink-400 to-primary bg-clip-text text-transparent">Edge</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="mt-3 text-muted-foreground text-sm max-w-md mx-auto">
            Apply to become a verified mentor. Prove your track record and start earning.
          </motion.p>
        </motion.div>

        {/* Step Indicator */}
        <motion.div
          className="flex items-center justify-between mb-6 px-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === i;
            const isDone = step > i;
            return (
              <div key={s.label} className="flex items-center gap-2 flex-1">
                <motion.button
                  type="button"
                  onClick={() => { if (isDone) setStep(i); }}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-primary/15 text-primary border border-primary/30 shadow-[0_0_16px_hsl(var(--primary)/0.2)]"
                      : isDone
                        ? "bg-primary/10 text-primary border border-primary/20 cursor-pointer"
                        : "bg-muted text-muted-foreground border border-transparent"
                  }`}
                  whileHover={isDone ? { scale: 1.05 } : {}}
                  whileTap={isDone ? { scale: 0.97 } : {}}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{i + 1}</span>
                </motion.button>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-1 transition-colors duration-500 ${isDone ? "bg-primary/40" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </motion.div>

        {/* Form Card */}
        <motion.div
          className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl shadow-black/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
        >
          <form onSubmit={(e) => { e.preventDefault(); if (step === 3) handleSubmit(); }}>
            {renderStep()}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                {step > 0 ? (
                  <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="h-11">
                    Back
                  </Button>
                ) : <div />}
              </motion.div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
                <motion.div whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                  {step < 3 ? (
                    <Button type="button" onClick={() => setStep(step + 1)} disabled={!canProceed()} className="h-11 px-6 font-semibold shadow-lg shadow-primary/20">
                      Continue <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={submitting || !confirmGenuine || !agreeTerms} className="h-11 px-6 font-semibold shadow-lg shadow-primary/20">
                      {submitting ? "Submitting..." : "Submit Application"}
                    </Button>
                  )}
                </motion.div>
              </div>
            </div>
          </form>
        </motion.div>

        <motion.p
          className="text-center text-xs text-muted-foreground mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Applications are reviewed within 48 hours. You'll receive an email notification.
        </motion.p>
      </div>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader className="items-center">
            <motion.div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <CheckCircle className="h-8 w-8 text-primary" />
            </motion.div>
            <DialogTitle className="text-xl">Application Submitted! 🎉</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              Thanks for applying! Our team will review your application shortly — you'll receive an email once it's been approved.
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
