import { ArrowLeft, ArrowRight, Search, ShieldCheck, CalendarClock, GraduationCap, Compass, LineChart, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";
import { motion } from "framer-motion";

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const studentSteps = [
  {
    icon: Search,
    title: "1. Browse verified mentors",
    desc: "Filter by market (futures, forex, crypto, options), methodology, price, and country. Every listing went through our vetting process before it appeared here.",
  },
  {
    icon: ShieldCheck,
    title: "2. Check their proof",
    desc: "Open any profile and look at the Proof of Profitability section and the badge — it tells you exactly what we verified: identity, track record, or both.",
  },
  {
    icon: CalendarClock,
    title: "3. Start with a free intro",
    desc: "Not sure yet? Request a free 15-minute intro call from the mentor's profile. No card, no commitment — just a conversation.",
  },
  {
    icon: GraduationCap,
    title: "4. Subscribe and learn",
    desc: "Subscribe monthly or buy one-time access. You get the mentor's private content, community, and direct messaging. Cancel anytime from your dashboard.",
  },
];

const mentorSteps = [
  { icon: LineChart, title: "Prove your edge", desc: "Apply with a verifiable track record — Myfxbook, broker statements, or prop-firm payouts." },
  { icon: Compass, title: "Build your hub", desc: "Set your price, upload content, and shape your community — we handle payments and hosting." },
  { icon: Wallet, title: "Earn recurring revenue", desc: "Keep the majority of every subscription and withdraw your balance through Stripe." },
];

const HowItWorks = () => (
  <PageTransition>
    <Helmet>
      <title>How It Works — EdgeMentor</title>
      <meta name="description" content="How EdgeMentor works: browse verified trading mentors, check their proof, start with a free intro call, and subscribe only when it fits." />
      <link rel="canonical" href="https://edgementor.pages.dev/how-it-works" />
      <meta property="og:title" content="How It Works — EdgeMentor" />
      <meta property="og:description" content="Browse verified mentors, check their proof, start with a free intro." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://edgementor.pages.dev/how-it-works" />
      <meta property="og:image" content="https://edgementor.pages.dev/og-image.jpg" />
      <meta property="og:site_name" content="EdgeMentor" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="How It Works — EdgeMentor" />
      <meta name="twitter:description" content="Browse verified mentors, check their proof, start with a free intro." />
      <meta name="twitter:image" content="https://edgementor.pages.dev/og-image.jpg" />
    </Helmet>
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <motion.h1 variants={fade} initial="hidden" animate="show" className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-3">
          How It Works
        </motion.h1>
        <motion.p variants={fade} initial="hidden" animate="show" className="text-muted-foreground mb-12 leading-relaxed">
          Four steps from "who do I trust?" to learning from a mentor whose results we actually checked.
        </motion.p>

        {/* Student flow */}
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="space-y-4 mb-16">
          {studentSteps.map((s) => (
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

        {/* Mentor flow */}
        <motion.div variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} className="mb-16">
          <h2 className="font-heading text-xl font-bold text-foreground mb-6">And if you're the mentor?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {mentorSteps.map((s) => (
              <div key={s.title} className="rounded-xl border border-border bg-card/50 p-5">
                <s.icon className="h-5 w-5 text-primary mb-3" />
                <h3 className="font-heading font-semibold text-foreground text-sm mb-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} className="flex flex-col sm:flex-row gap-3">
          <Link to="/mentors">
            <Button variant="glow" className="w-full sm:w-auto font-semibold">
              Browse Mentors <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
          <Link to="/verification">
            <Button variant="outline" className="w-full sm:w-auto font-semibold">
              <ShieldCheck className="h-4 w-4 mr-1.5" /> How Verification Works
            </Button>
          </Link>
          <Link to="/apply">
            <Button variant="outline" className="w-full sm:w-auto font-semibold">
              Become a Mentor
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  </PageTransition>
);

export default HowItWorks;
