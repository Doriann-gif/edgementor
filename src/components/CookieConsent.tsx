import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const respond = (choice: "accepted" | "dismissed") => {
    localStorage.setItem("cookie-consent", choice);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50"
        >
          <div className="rounded-xl border border-border bg-card p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <Cookie className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We use cookies for essential functionality and analytics.{" "}
                  <Link to="/privacy" className="text-primary hover:underline">Learn more</Link>
                </p>
                <div className="flex gap-2">
                  <Button size="sm" className="text-xs h-7 px-3" onClick={() => respond("accepted")}>
                    Accept
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs h-7 px-3" onClick={() => respond("dismissed")}>
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
