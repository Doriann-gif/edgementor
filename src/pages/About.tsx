import { ArrowLeft, Zap, Users, Shield, Target, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import PageTransition from "@/components/PageTransition";
import { motion } from "framer-motion";

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const faqs = [
  { q: "How does EdgeMentor work?", a: "Browse our verified mentors, subscribe to the one that fits your trading style, and get access to their exclusive content, strategies, and community." },
  { q: "How much does it cost?", a: "Each mentor sets their own monthly price. Prices typically range from $5 to $100/month. You can cancel anytime." },
  { q: "Can I cancel my subscription?", a: "Yes, you can cancel at any time from your dashboard. You'll retain access until the end of your billing period." },
  { q: "How do I become a mentor?", a: "Apply through our mentor application page. We verify all mentors for trading experience and track record before approval." },
  { q: "Is my payment information secure?", a: "Absolutely. All payments are processed through Stripe, a PCI Level 1 certified payment processor. We never store your card details." },
  { q: "What kind of content do mentors provide?", a: "Mentors share trading strategies, market analysis, educational videos, live sessions, and community access. Content varies by mentor." },
  { q: "Do you guarantee trading profits?", a: "No. Trading involves significant risk of loss. EdgeMentor is an educational platform — we do not provide financial advice or guarantee results." },
  { q: "How do I contact support?", a: "Email us at support@edgementor.com and we'll get back to you within 24 hours." },
];

const About = () => (
  <PageTransition>
    <Helmet>
      <title>About EdgeMentor — Learn From Real Traders</title>
      <meta name="description" content="EdgeMentor connects aspiring traders with verified mentors. Learn about our mission, how the platform works, and find answers to common questions." />
      <link rel="canonical" href="https://edgementor.netlify.app/about" />
      <meta property="og:title" content="About EdgeMentor — Learn From Real Traders" />
      <meta property="og:description" content="Learn about our mission to connect aspiring traders with verified mentors who have proven track records." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://edgementor.netlify.app/about" />
      <meta property="og:image" content="https://edgementor.netlify.app/og-image.jpg" />
      <meta property="og:site_name" content="EdgeMentor" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="About EdgeMentor — Learn From Real Traders" />
      <meta name="twitter:description" content="Learn about our mission to connect aspiring traders with verified mentors." />
      <meta name="twitter:image" content="https://edgementor.netlify.app/og-image.jpg" />
      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(f => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a }
        }))
      })}</script>
    </Helmet>
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <motion.h1 variants={fade} initial="hidden" animate="show" className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-3">
          About EdgeMentor
        </motion.h1>
        <motion.p variants={fade} initial="hidden" animate="show" className="text-muted-foreground mb-12 leading-relaxed">
          We're building the #1 platform for trading mentorship — connecting aspiring traders with verified mentors who have real, proven track records.
        </motion.p>

        {/* Values */}
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16">
          {[
            { icon: Shield, title: "Verified Mentors", desc: "Every mentor is vetted for experience and trading track record before joining." },
            { icon: Target, title: "Real Strategies", desc: "No theory — only actionable strategies from traders who actively trade." },
            { icon: Users, title: "Community First", desc: "Join a community of like-minded traders learning and growing together." },
            { icon: Zap, title: "Simple & Transparent", desc: "Subscribe monthly, cancel anytime. No hidden fees, no long commitments." },
          ].map((v) => (
            <motion.div key={v.title} variants={fade} className="rounded-xl border border-border bg-card p-5">
              <v.icon className="h-5 w-5 text-primary mb-3" />
              <h3 className="font-heading font-semibold text-foreground text-sm mb-1">{v.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* FAQ */}
        <motion.div variants={fade} initial="hidden" animate="show">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-xl font-bold text-foreground">Frequently Asked Questions</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-xl px-4 bg-card/50">
                <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </div>
  </PageTransition>
);

export default About;
