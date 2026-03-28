import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>

      <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-2">Terms and Conditions</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: March 28, 2026</p>

      <div className="prose prose-sm prose-invert max-w-none space-y-8 text-muted-foreground [&_h2]:text-foreground [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-3 [&_p]:leading-relaxed">
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using EdgeMentor ("Platform"), you agree to be bound by these Terms and Conditions. If you do not agree, you may not use the Platform.</p>
        </section>

        <section>
          <h2>2. Eligibility</h2>
          <p>You must be at least 18 years old to use EdgeMentor. By creating an account, you represent that you meet this requirement and that all information you provide is accurate and complete.</p>
        </section>

        <section>
          <h2>3. Account Responsibilities</h2>
          <p>You are responsible for maintaining the confidentiality of your login credentials. You agree to notify us immediately of any unauthorized use of your account. EdgeMentor is not liable for any loss arising from unauthorized access to your account.</p>
        </section>

        <section>
          <h2>4. Mentor Applications</h2>
          <p>All mentor applications are subject to review and approval by EdgeMentor. Submitting an application does not guarantee acceptance. You confirm that all information and documents submitted are genuine and accurate. Providing false or misleading information may result in permanent removal from the Platform.</p>
        </section>

        <section>
          <h2>5. Subscriptions & Payments</h2>
          <p>Mentorship subscriptions are billed on a monthly basis. Prices are set by individual mentors and may change with notice. Refunds are handled on a case-by-case basis at EdgeMentor's discretion. By subscribing, you authorize recurring charges until you cancel.</p>
        </section>

        <section>
          <h2>6. Content & Conduct</h2>
          <p>Users and mentors must not post content that is illegal, misleading, defamatory, or harmful. EdgeMentor reserves the right to remove any content and suspend or terminate accounts that violate these guidelines without prior notice.</p>
        </section>

        <section>
          <h2>7. Intellectual Property</h2>
          <p>All content, branding, and materials on EdgeMentor are the property of EdgeMentor or its licensors. You may not reproduce, distribute, or create derivative works without prior written consent.</p>
        </section>

        <section>
          <h2>8. Disclaimer of Warranties</h2>
          <p>EdgeMentor is provided "as is" without warranties of any kind. We do not guarantee trading results, mentor performance, or financial outcomes. All trading involves risk, and mentorship content is for educational purposes only — it does not constitute financial advice.</p>
        </section>

        <section>
          <h2>9. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, EdgeMentor and its affiliates shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform, including but not limited to financial losses from trading.</p>
        </section>

        <section>
          <h2>10. Termination</h2>
          <p>EdgeMentor reserves the right to suspend or terminate your account at any time for violation of these Terms or for any reason at our sole discretion. Upon termination, your right to use the Platform ceases immediately.</p>
        </section>

        <section>
          <h2>11. Changes to Terms</h2>
          <p>We may update these Terms at any time. Continued use of EdgeMentor after changes are posted constitutes acceptance of the revised Terms. We encourage you to review this page periodically.</p>
        </section>

        <section>
          <h2>12. Contact</h2>
          <p>If you have questions about these Terms, please contact us at <a href="mailto:support@edgementor.com" className="text-primary hover:underline">support@edgementor.com</a>.</p>
        </section>
      </div>
    </div>
  </div>
);

export default Terms;
