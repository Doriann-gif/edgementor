import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GitCompareArrows, X } from "lucide-react";
import { useCompare } from "@/contexts/CompareContext";
import CompareDialog from "@/components/compare/CompareDialog";

// Routes that own the bottom of the screen with their own sticky bar — the
// floating tray would collide with them, so we keep it out of their way.
const HIDDEN_PREFIXES = ["/mentor/", "/subscribe/", "/mentorship/"];

const CompareBar = () => {
  const { selected, count, remove, clear, setOpen } = useCompare();
  const { pathname } = useLocation();

  const hidden = HIDDEN_PREFIXES.some((p) => pathname.startsWith(p));
  const show = count > 0 && !hidden;

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-2xl"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/95 backdrop-blur-xl px-3 py-2.5 shadow-2xl shadow-background/50">
              {/* Selected avatars */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {selected.map((m) => (
                  <div key={m.id} className="relative shrink-0 group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-heading font-bold text-xs">
                      {m.avatar}
                    </div>
                    <button
                      onClick={() => remove(m.id)}
                      aria-label={`Remove ${m.name}`}
                      className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="ml-auto flex items-center gap-2 shrink-0">
                <button
                  onClick={clear}
                  className="hidden sm:block text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-2"
                >
                  Clear
                </button>
                <button
                  onClick={() => setOpen(true)}
                  disabled={count < 2}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 disabled:opacity-50 disabled:shadow-none"
                >
                  <GitCompareArrows className="h-4 w-4" />
                  {count < 2 ? "Add 1+ to compare" : `Compare ${count}`}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The dialog lives here so it's mounted app-wide regardless of the tray. */}
      <CompareDialog />
    </>
  );
};

export default CompareBar;
