import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import PageTransition from "@/components/PageTransition";
import { motion } from "framer-motion";

const sectionFade = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const Terms = () => (
  <PageTransition>
  <Helmet>
    <title>Terms & Conditions — EdgeMentor</title>
    <meta name="description" content="EdgeMentor's Terms & Conditions — covering accounts, subscriptions, billing, refunds, and use of the trading mentorship marketplace." />
    <link rel="canonical" href="https://edgementor.net/terms" />
  </Helmet>
  <div className="min-h-screen bg-background">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>

      <motion.h1 variants={sectionFade} initial="hidden" animate="show" className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-2">Terms and Conditions</motion.h1>
      <motion.p variants={sectionFade} initial="hidden" animate="show" className="text-sm text-muted-foreground mb-10">Last updated: July 27, 2026</motion.p>

      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        className="prose prose-sm prose-invert max-w-none space-y-8 text-muted-foreground [&_h2]:text-foreground [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-3 [&_p]:leading-relaxed"
      >
        {[
          { title: "1. Acceptance of Terms", body: 'By accessing or using EdgeMentor ("Platform"), you agree to be bound by these Terms and Conditions. If you do not agree, you may not use the Platform.' },
          { title: "2. Eligibility (18+)", body: "You must be at least 18 years old to create an account, subscribe, or purchase a mentorship. By using the Platform you represent and warrant that you are 18 or older. EdgeMentor is not directed to anyone under 18, and we do not knowingly collect information from minors. If we learn that an account belongs to someone under 18, we may suspend or remove it." },
          { title: "3. Platform Description", body: "EdgeMentor connects aspiring traders with experienced mentors for subscription-based and one-time mentorship. Mentors provide educational content, resources, and guidance through the Platform. EdgeMentor is a marketplace and is not a party to the mentorship relationship beyond providing the Platform and processing payments." },
          { title: "4. User Accounts", body: "You must create an account to access most features. You are responsible for maintaining the confidentiality of your credentials and for all activities under your account. Notify us immediately of any unauthorized use." },
          { title: "5. Subscriptions, Billing & Auto-Renewal", body: "Monthly mentorships are recurring subscriptions. When you subscribe, you authorize EdgeMentor and our payment processor, Stripe, to charge your payment method the mentor's listed monthly price plus any applicable taxes on a recurring monthly basis. Your subscription automatically renews each month at the then-current price until you cancel, and the same payment method on file will be charged for each renewal. Some mentorships are sold as a single one-time payment rather than a subscription; these are charged once and are clearly labeled as one-time at checkout. Prices are set by individual mentors and may change; any price change applies to your next renewal, not the period you have already paid for." },
          { title: "6. Cancellations", body: "You may cancel a monthly subscription at any time from your Dashboard or the secure Stripe billing portal. When you cancel, your access remains active through the end of the current paid billing period and you will not be charged again. Cancelling does not retroactively refund the current period. One-time purchases are not recurring and grant the access described at the time of purchase." },
          { title: "7. Refunds", body: "Because mentorship content and access are delivered digitally and become available immediately, all sales are generally final and payments are non-refundable, except where required by law or granted at EdgeMentor's discretion. If you were charged in error, were charged after cancelling, or did not receive the access you paid for, contact support@edgementor.net within 14 days of the charge and we will investigate and issue a refund where appropriate. Approved refunds are returned to your original payment method via Stripe." },
          { title: "8. Mentor Responsibilities & Payouts", body: "Mentors agree to provide the content and guidance described in their profiles and to hold the qualifications they represent. Mentors receive 80% of each payment; EdgeMentor retains a 20% platform fee. Payouts are handled through Stripe Connect and require identity verification. EdgeMentor does not guarantee any mentor's availability, quality, trading results, or financial outcomes." },
          { title: "9. Prohibited Conduct", body: "Users may not: share account credentials, redistribute or resell paid content, harass other users, post false or misleading reviews, impersonate others, submit fraudulent payment information, or use the Platform for any illegal activity." },
          { title: "10. Intellectual Property", body: "All content on EdgeMentor, including mentor materials, is protected by copyright and other laws. Users may not reproduce, distribute, publicly share, or create derivative works from paid content without permission. Access is granted for your personal use only." },
          { title: "11. Risk Disclosure & No Financial Advice", body: "EdgeMentor is an educational platform. Nothing on the Platform is financial, investment, legal, or tax advice, and no content should be relied upon as such. Trading and investing involve substantial risk, including the possible loss of your entire capital. Past performance — including any mentor's stated or verified track record — is not indicative of future results. You are solely responsible for your own trading and financial decisions and should consult a licensed professional before acting." },
          { title: "12. Limitation of Liability", body: "To the maximum extent permitted by law, EdgeMentor and its operators are not liable for any trading or investment losses, lost profits, or indirect, incidental, special, or consequential damages arising from your use of the Platform or any mentorship. Our total aggregate liability for any claim is limited to the amount you paid to EdgeMentor in the three months preceding the event giving rise to the claim." },
          { title: "13. Termination", body: "We reserve the right to suspend or terminate accounts that violate these Terms. You may delete your account at any time through Account Settings; deletion is permanent and removes your data as described in our Privacy Policy." },
          { title: "14. Changes to Terms", body: "We may update these Terms at any time. Material changes will be reflected by the “Last updated” date above. Continued use of the Platform after changes take effect constitutes acceptance of the updated Terms." },
          { title: "15. Contact", body: "For questions about these Terms, contact us at support@edgementor.net." },
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
