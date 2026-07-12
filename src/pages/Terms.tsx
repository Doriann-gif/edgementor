import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import PageTransition from "@/components/PageTransition";
import { motion } from "framer-motion";

const sectionFade = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const Terms = () => (
  <PageTransition>
  <div className="min-h-screen bg-background">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>

      <motion.h1 variants={sectionFade} initial="hidden" animate="show" className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-2">Terms and Conditions</motion.h1>
      <motion.p variants={sectionFade} initial="hidden" animate="show" className="text-sm text-muted-foreground mb-10">Last updated: March 28, 2026</motion.p>

      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        className="prose prose-sm prose-invert max-w-none space-y-8 text-muted-foreground [&_h2]:text-foreground [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-3 [&_p]:leading-relaxed"
      >
        {[
          { title: "1. Acceptance of Terms", body: 'By accessing or using EdgeMentor ("Platform"), you agree to be bound by these Terms and Conditions. If you do not agree, you may not use the Platform.' },
          { title: "2. Platform Description", body: "EdgeMentor connects aspiring traders with experienced mentors for subscription-based mentorship. Mentors provide educational content, resources, and guidance through the Platform." },
          { title: "3. User Accounts", body: "You must create an account to access most features. You are responsible for maintaining the confidentiality of your credentials and for all activities under your account." },
          { title: "4. Subscriptions & Payments", body: "Mentorship subscriptions are billed monthly. Prices are set by individual mentors and may change. All payments are processed securely through Stripe. Refund policies vary by mentor." },
          { title: "5. Mentor Responsibilities", body: "Mentors agree to provide content and guidance as described in their profiles. EdgeMentor does not guarantee trading results or financial outcomes from mentorship." },
          { title: "6. Prohibited Conduct", body: "Users may not: share account credentials, redistribute paid content, harass other users, post false reviews, or use the Platform for illegal activities." },
          { title: "7. Intellectual Property", body: "All content on EdgeMentor, including mentor materials, is protected by copyright. Users may not reproduce, distribute, or create derivative works without permission." },
          { title: "8. Limitation of Liability", body: "EdgeMentor is an educational platform. We do not provide financial advice. Trading involves significant risk of loss. We are not liable for any trading losses." },
          { title: "9. Termination", body: "We reserve the right to suspend or terminate accounts that violate these Terms. Users may delete their accounts at any time through Account Settings." },
          { title: "10. Changes to Terms", body: "We may update these Terms at any time. Continued use of the Platform constitutes acceptance of the updated Terms." },
          { title: "11. Contact", body: "For questions about these Terms, contact us at support@edgementor.net." },
        ].map((section) => (
          <motion.section key={section.title} variants={sectionFade}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </motion.section>
        ))}
      </motion.div>
    </div>
  </div>
  </PageTransition>
);

export default Terms;
