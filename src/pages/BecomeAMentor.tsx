import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, ShieldCheck, Wallet, Banknote, Users, Video,
  MessageSquare, CreditCard, Tag, LayoutDashboard, LineChart,
  CheckCircle2, Percent, CalendarClock,
} from "lucide-react";
import { motion } from "framer-motion";
import MentorApplicationForm from "@/components/MentorApplicationForm";
import PageTransition from "@/components/PageTransition";

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const scrollToForm = () => document.getElementById("apply-form")?.scrollIntoView({ behavior: "smooth" });

// Mentors keep 80%: the Stripe Connect checkout applies a 20% platform fee
// (application_fee_percent = 20 in create-checkout).
const MENTOR_SHARE = "80%";

const payoutSteps = [
  {
    icon: CreditCard,
    title: "Students pay through EdgeMentor",
    desc: "Subscriptions and one-time mentorships are billed by Stripe — you never chase invoices or handle card data.",
  },
  {
    icon: Wallet,
    title: "Your share lands in your balance",
    desc: `You keep ${MENTOR_SHARE} of every payment. Your balance is visible in the Mentor Hub in real time.`,
  },
  {
    icon: Banknote,
    title: "Withdraw to your bank",
    desc: "Connect your bank once via Stripe, then withdraw anytime — or switch on automatic monthly payouts. Funds typically arrive in 2–7 business days via Stripe.",
  },
];

const platformTools = [
  { icon: Video, title: "Content hub", desc: "Host your videos, lessons, and posts behind your paywall — organized your way." },
  { icon: Users, title: "Your community", desc: "Every subscriber becomes part of your private student group." },
  { icon: MessageSquare, title: "Student messaging", desc: "DM individual students or broadcast announcements to everyone at once." },
  { icon: CreditCard, title: "Payments handled", desc: "Stripe checkout, subscriptions, refunds, and billing — fully managed." },
  { icon: Tag, title: "Discount codes", desc: "Create promo codes to run launches and win back churned students." },
  { icon: LayoutDashboard, title: "Mentor dashboard", desc: "Track students, revenue, ratings, and content performance in one place." },
];

const verificationRequirements = [
  "A verifiable track record: Myfxbook / broker-verified account, prop-firm payout certificates, or audited statements",
  "Your real identity — verified through Stripe payout onboarding (government ID)",
  "A clear description of what your mentorship includes and who it's for",
];

const BecomeAMentor = () => (
  <PageTransition>
    <Helmet>
      <title>Become a Mentor — EdgeMentor</title>
      <meta name="description" content={`Turn your trading edge into recurring revenue. Keep ${MENTOR_SHARE} of every subscription, get payments, community, and content tools out of the box.`} />
      <link rel="canonical" href="https://edgementor.net/apply" />
      <meta property="og:title" content="Become a Mentor — EdgeMentor" />
      <meta property="og:description" content="Turn your trading edge into recurring revenue with payments, community, and content tools out of the box." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://edgementor.net/apply" />
      <meta property="og:image" content="https://edgementor.net/og-image.jpg" />
      <meta property="og:site_name" content="EdgeMentor" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Become a Mentor — EdgeMentor" />
      <meta name="twitter:description" content="Turn your trading edge into recurring revenue." />
      <meta name="twitter:image" content="https://edgementor.net/og-image.jpg" />
    </Helmet>

    <div className="min-h-screen bg-background">
      {/* ===== HERO ===== */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-16 text-center">
        <motion.div variants={fade} initial="hidden" animate="show" className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
          <LineChart className="h-3.5 w-3.5" /> For profitable traders
        </motion.div>
        <motion.h1 variants={fade} initial="hidden" animate="show" className="font-heading text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-[1.1] mb-5">
          Turn your edge into{" "}
          <span className="bg-gradient-to-r from-primary via-pink-400 to-primary bg-clip-text text-transparent">recurring revenue</span>
        </motion.h1>
        <motion.p variants={fade} initial="hidden" animate="show" className="text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
          You already trade. EdgeMentor gives you the storefront: payments, community,
          content hosting, and students who found you because you're verified — not because you shout the loudest.
        </motion.p>
        <motion.div variants={fade} initial="hidden" animate="show" className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button variant="glow" size="lg" className="h-12 px-8 font-semibold" onClick={scrollToForm}>
            Start Your Application <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Link to="/verification">
            <Button variant="outline" size="lg" className="h-12 px-8 font-semibold">
              <ShieldCheck className="h-4 w-4 mr-2" /> How Verification Works
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* ===== THE SPLIT ===== */}
      <section className="border-y border-border/30 bg-card/40 py-14 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <motion.div variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-3">
              <Percent className="h-5 w-5 text-primary" />
            </div>
            <p className="font-heading text-3xl font-bold text-foreground">{MENTOR_SHARE}</p>
            <p className="text-xs text-muted-foreground mt-1">of every payment goes to you</p>
          </motion.div>
          <motion.div variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-3">
              <CalendarClock className="h-5 w-5 text-primary" />
            </div>
            <p className="font-heading text-3xl font-bold text-foreground">You</p>
            <p className="text-xs text-muted-foreground mt-1">set your own price and format</p>
          </motion.div>
          <motion.div variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-3">
              <Banknote className="h-5 w-5 text-primary" />
            </div>
            <p className="font-heading text-3xl font-bold text-foreground">$0</p>
            <p className="text-xs text-muted-foreground mt-1">listing fees or upfront costs</p>
          </motion.div>
        </div>
      </section>

      {/* ===== HOW PAYOUTS WORK ===== */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <motion.h2 variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} className="font-heading text-2xl font-bold text-foreground text-center mb-10">
          How you get paid
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {payoutSteps.map((s, i) => (
            <motion.div
              key={s.title}
              variants={fade}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-semibold text-foreground text-sm mb-2">{s.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== WHAT YOU GET ===== */}
      <section className="border-y border-border/30 bg-card/40 py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.h2 variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} className="font-heading text-2xl font-bold text-foreground text-center mb-3">
            Everything you need, out of the box
          </motion.h2>
          <motion.p variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-sm text-muted-foreground text-center max-w-xl mx-auto mb-10">
            No website to build, no payment processor to set up, no community software to duct-tape together.
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {platformTools.map((t) => (
              <motion.div key={t.title} variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} className="rounded-xl border border-border bg-card p-5">
                <t.icon className="h-5 w-5 text-primary mb-3" />
                <h3 className="font-heading font-semibold text-foreground text-sm mb-1">{t.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== VERIFICATION REQUIREMENTS ===== */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <motion.div variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-6 sm:p-8">
          <h2 className="font-heading text-xl font-bold text-foreground mb-2 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" /> What we'll ask you to prove
          </h2>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            Verification is what makes an EdgeMentor listing worth more than a Discord link in a bio.
            To get the badge, you'll need:
          </p>
          <div className="space-y-3">
            {verificationRequirements.map((r) => (
              <div key={r} className="flex items-start gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{r}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-5">
            Full details on the process: <Link to="/verification" className="text-primary hover:underline">How Verification Works</Link>
          </p>
        </motion.div>
      </section>

      {/* ===== APPLICATION FORM ===== */}
      <div id="apply-form">
        <MentorApplicationForm />
      </div>
    </div>
  </PageTransition>
);

export default BecomeAMentor;
