import { ArrowLeft, ArrowRight, ShieldCheck, FileCheck2, UserCheck, LineChart, BadgeCheck, Star, Crown, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";
import { motion } from "framer-motion";

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const steps = [
  {
    icon: FileCheck2,
    title: "1. Application review",
    desc: "Every mentor starts with a detailed application: trading experience, markets, methodology, and what their mentorship includes. Most applications are rejected at this stage.",
  },
  {
    icon: UserCheck,
    title: "2. Identity verification",
    desc: "We confirm the mentor is a real, reachable person — through application review and their public trading presence.",
  },
  {
    icon: LineChart,
    title: "3. Track record proof",
    desc: "Mentors submit verifiable evidence of profitability: a Myfxbook or broker-verified account, prop-firm payout certificates, or audited statements. Screenshots alone don't count.",
  },
  {
    icon: ShieldCheck,
    title: "4. Ongoing standards",
    desc: "Verification isn't one-and-done. Ratings come only from real, paying students, and mentors who stop meeting our standards lose their badge and their listing.",
  },
];

const badges = [
  {
    icon: BadgeCheck,
    color: "text-emerald-400",
    name: "Verified",
    desc: "Identity confirmed and application vetted. If the profile also shows a Verified Track Record, we have reviewed proof of profitability.",
  },
  {
    icon: Star,
    color: "text-amber-400",
    name: "Pro",
    desc: "Everything in Verified, plus a consistent student rating and an established teaching history on the platform.",
  },
  {
    icon: Crown,
    color: "text-slate-300",
    name: "Elite",
    desc: "Our highest tier — invite-only, reserved for mentors with an exceptional verified track record and top student outcomes.",
  },
];

const Verification = () => (
  <PageTransition>
    <Helmet>
      <title>How Verification Works — EdgeMentor</title>
      <meta name="description" content="Every EdgeMentor badge is earned, not bought. See exactly how we vet mentor identities and trading track records before they can teach." />
      <link rel="canonical" href="https://edgementor.net/verification" />
      <meta property="og:title" content="How Verification Works — EdgeMentor" />
      <meta property="og:description" content="See exactly how we vet mentor identities and trading track records." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://edgementor.net/verification" />
      <meta property="og:image" content="https://edgementor.net/og-image.jpg" />
      <meta property="og:site_name" content="EdgeMentor" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="How Verification Works — EdgeMentor" />
      <meta name="twitter:description" content="Every badge is earned, not bought." />
      <meta name="twitter:image" content="https://edgementor.net/og-image.jpg" />
    </Helmet>
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <motion.div variants={fade} initial="hidden" animate="show" className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400 mb-6">
          <ShieldCheck className="h-3.5 w-3.5" /> Trust &amp; Verification
        </motion.div>

        <motion.h1 variants={fade} initial="hidden" animate="show" className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-3">
          How Verification Works
        </motion.h1>
        <motion.p variants={fade} initial="hidden" animate="show" className="text-muted-foreground mb-12 leading-relaxed">
          The trading education space is full of unverified claims. We built EdgeMentor around one rule:
          a badge means we checked. Here's exactly what we verify before a mentor can teach — in plain language.
        </motion.p>

        {/* Vetting steps */}
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="space-y-4 mb-16">
          {steps.map((s) => (
            <motion.div key={s.title} variants={fade} className="flex gap-4 rounded-xl border border-border bg-card p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground text-sm mb-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* What the badges mean */}
        <motion.div variants={fade} initial="hidden" animate="show" className="mb-16">
          <h2 className="font-heading text-xl font-bold text-foreground mb-6">What each badge means</h2>
          <div className="space-y-3">
            {badges.map((b) => (
              <div key={b.name} className="flex gap-4 rounded-xl border border-border bg-card/50 p-5 items-start">
                <b.icon className={`h-5 w-5 shrink-0 mt-0.5 ${b.color}`} />
                <div>
                  <h3 className="font-heading font-semibold text-foreground text-sm mb-1">{b.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Honest limits */}
        <motion.div variants={fade} initial="hidden" animate="show" className="rounded-xl border border-border bg-muted/30 p-5 mb-16">
          <h3 className="font-heading font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" /> What verification is not
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Verification confirms a mentor's identity and reviewed evidence of their past trading results.
            It is not a guarantee of future performance — theirs or yours. Trading involves significant risk,
            and nothing on EdgeMentor is financial advice.
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div variants={fade} initial="hidden" animate="show" className="flex flex-col sm:flex-row gap-3">
          <Link to="/mentors">
            <Button variant="glow" className="w-full sm:w-auto font-semibold">
              Browse Verified Mentors <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
          <Link to="/apply">
            <Button variant="outline" className="w-full sm:w-auto font-semibold">
              Apply as a Mentor
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  </PageTransition>
);

export default Verification;
