import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-card/50 mt-auto">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="col-span-2 sm:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-heading font-bold text-foreground text-lg">EdgeMentor</span>
          </Link>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Learn from traders who actually trade. Real strategies, real results.
          </p>
        </div>

        {/* Platform */}
        <div>
          <h4 className="font-heading text-sm font-semibold text-foreground mb-3">Platform</h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li><Link to="/mentors" className="hover:text-foreground transition-colors">Browse Mentors</Link></li>
            <li><Link to="/learn" className="hover:text-foreground transition-colors">Free Content</Link></li>
            <li><Link to="/apply" className="hover:text-foreground transition-colors">Become a Mentor</Link></li>
            <li><Link to="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
          </ul>
        </div>

        {/* Account */}
        <div>
          <h4 className="font-heading text-sm font-semibold text-foreground mb-3">Account</h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li><Link to="/auth" className="hover:text-foreground transition-colors">Sign In</Link></li>
            <li><Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
            <li><Link to="/settings" className="hover:text-foreground transition-colors">Settings</Link></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="font-heading text-sm font-semibold text-foreground mb-3">Legal</h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms & Conditions</Link></li>
            <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} EdgeMentor. All rights reserved.
        </p>
        <p className="text-[11px] text-muted-foreground">
          Trading involves risk. Past performance is not indicative of future results.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
