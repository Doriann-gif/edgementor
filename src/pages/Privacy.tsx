import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import PageTransition from "@/components/PageTransition";
import { motion } from "framer-motion";

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const sections = [
  { title: "1. Information We Collect", body: "We collect information you provide directly: name, email address, and payment details (processed securely by Stripe). We also collect usage data such as pages visited, device type, and IP address through standard analytics." },
  { title: "2. How We Use Your Information", body: "We use your information to: provide and maintain the Platform, process payments, send account notifications, improve our services, and comply with legal obligations. We do not sell your personal data." },
  { title: "3. Data Sharing", body: "We share data only with: Stripe (payment processing), mentors you subscribe to (your display name only), and service providers who help us operate the Platform. We never sell personal data to third parties." },
  { title: "4. Cookies & Tracking", body: "We use essential cookies to keep you logged in and remember your preferences. We may use analytics cookies to understand how the Platform is used. You can manage cookie preferences through your browser settings." },
  { title: "5. Data Security", body: "We implement industry-standard security measures including encryption in transit (TLS), secure password hashing, and regular security audits. Payment data is handled entirely by Stripe and never stored on our servers." },
  { title: "6. Your Rights", body: "You have the right to: access your personal data, request corrections, delete your account and data, export your data, and opt out of marketing emails. Contact us at support@edgementor.com to exercise these rights." },
  { title: "7. Data Retention", body: "We retain your data for as long as your account is active. After account deletion, we remove personal data within 30 days, except where retention is required by law (e.g., financial records)." },
  { title: "8. Children's Privacy", body: "EdgeMentor is not intended for users under 18. We do not knowingly collect data from minors. If you believe a minor has provided us with personal data, please contact us." },
  { title: "9. International Data", body: "Your data may be processed in countries outside your own. We ensure appropriate safeguards are in place for international data transfers in compliance with applicable regulations." },
  { title: "10. Changes to This Policy", body: "We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a notice on the Platform." },
  { title: "11. Contact Us", body: "For privacy-related questions, contact us at support@edgementor.com." },
];

const Privacy = () => (
  <PageTransition>
    <Helmet>
      <title>Privacy Policy — EdgeMentor</title>
      <meta name="description" content="Learn how EdgeMentor collects, uses, and protects your personal data. Read our full privacy policy." />
    </Helmet>
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <motion.h1 variants={fade} initial="hidden" animate="show" className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-2">Privacy Policy</motion.h1>
        <motion.p variants={fade} initial="hidden" animate="show" className="text-sm text-muted-foreground mb-10">Last updated: March 28, 2026</motion.p>

        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          className="prose prose-sm prose-invert max-w-none space-y-8 text-muted-foreground [&_h2]:text-foreground [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-3 [&_p]:leading-relaxed"
        >
          {sections.map((section) => (
            <motion.section key={section.title} variants={fade}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </motion.section>
          ))}
        </motion.div>
      </div>
    </div>
  </PageTransition>
);

export default Privacy;
