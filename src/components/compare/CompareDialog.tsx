import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Star, Users, Clock, X, Crown, Check, Minus, ChevronRight,
  ShieldCheck, GitCompareArrows, Sparkles, PauseCircle,
} from "lucide-react";
import TierBadge from "@/components/TierBadge";
import { useCompare } from "@/contexts/CompareContext";
import { priceSuffix } from "@/lib/pricing";
import {
  analyzeMentors, bestFitReason, FIT_PRIORITIES, type FitPriority,
} from "@/lib/compare";
import type { Mentor } from "@/types/mentor";

/** Highlight styling for the winning cell in a numeric row. */
const winnerCell = "bg-primary/[0.07] ring-1 ring-inset ring-primary/25";

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">{children}</span>
);

const CompareDialog = () => {
  const { selected, open, setOpen, remove, clear } = useCompare();
  const [priority, setPriority] = useState<FitPriority>("balanced");

  const analysis = useMemo(() => analyzeMentors(selected, priority), [selected, priority]);
  const bestFit = selected.find((m) => m.id === analysis.bestFitId) || null;
  const maxScore = Math.max(1, ...selected.map((m) => analysis.scores[m.id] ?? 0));

  // Row helper: renders one attribute across every column, tinting the winner.
  const rows: { label: string; render: (m: Mentor) => React.ReactNode; winnerId?: string | null }[] = [
    {
      label: "Price",
      winnerId: analysis.cheapestId,
      render: (m) => (
        <span className="font-heading font-bold text-foreground">
          ${m.monthly_price}
          <span className="text-[10px] font-normal text-muted-foreground">{priceSuffix(m)}</span>
        </span>
      ),
    },
    {
      label: "Rating",
      winnerId: analysis.topRatedId,
      render: (m) => (
        <span className="inline-flex items-center gap-1 font-semibold text-foreground">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {m.rating}
        </span>
      ),
    },
    {
      label: "Students",
      winnerId: analysis.mostStudentsId,
      render: (m) => (
        <span className="inline-flex items-center gap-1 font-semibold text-foreground">
          <Users className="h-3.5 w-3.5 text-muted-foreground" /> {m.students}
        </span>
      ),
    },
    {
      label: "Experience",
      winnerId: analysis.mostExperiencedId,
      render: (m) => (
        <span className="inline-flex items-center gap-1 text-foreground">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" /> {m.experience}
        </span>
      ),
    },
    {
      label: "Verified track record",
      render: (m) => m.proof_verified_at
        ? <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold"><ShieldCheck className="h-4 w-4" /> Verified</span>
        : <span className="inline-flex items-center gap-1 text-muted-foreground/60"><Minus className="h-4 w-4" /> —</span>,
    },
    {
      label: "Availability",
      render: (m) => m.available === false
        ? <span className="inline-flex items-center gap-1 text-amber-400 font-medium"><PauseCircle className="h-3.5 w-3.5" /> Paused</span>
        : <span className="inline-flex items-center gap-1 text-emerald-400 font-medium"><Check className="h-3.5 w-3.5" /> Accepting</span>,
    },
    {
      label: "Session format",
      render: (m) => <span className="text-foreground">{m.session}</span>,
    },
    {
      label: "Response time",
      render: (m) => <span className="text-muted-foreground">{m.response_time || "—"}</span>,
    },
    {
      label: "Instruments",
      render: (m) => (
        <div className="flex flex-wrap gap-1">{m.instruments.map((i) => <Chip key={i}>{i}</Chip>)}</div>
      ),
    },
    {
      label: "Concepts",
      render: (m) => (
        <div className="flex flex-wrap gap-1">{m.concepts.map((c) => <Chip key={c}>{c}</Chip>)}</div>
      ),
    },
  ];

  const colWidth = "min-w-[150px] w-[150px] sm:min-w-[190px] sm:w-[190px]";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[min(96vw,980px)] max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 sm:px-6 pt-5 pb-4 border-b border-border">
          <DialogTitle className="font-heading flex items-center gap-2 text-lg">
            <GitCompareArrows className="h-5 w-5 text-primary" /> Compare Traders
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            See {selected.length} mentors side by side and get the best match for your goals.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-auto px-5 sm:px-6 py-4">
          {/* Priority selector — re-weights the fit score */}
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              What matters most to you?
            </p>
            <div className="flex flex-wrap gap-1.5">
              {FIT_PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  title={p.hint}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                    priority === p.value
                      ? "border-primary/50 bg-primary/15 text-primary shadow-sm shadow-primary/10"
                      : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Best fit banner */}
          {bestFit && selected.length >= 2 && (
            <motion.div
              key={bestFit.id + priority}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 flex items-center gap-3 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 to-primary/[0.03] p-3.5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Your best fit</p>
                <p className="text-sm font-heading font-bold text-foreground truncate">
                  {bestFit.name} <span className="text-muted-foreground font-normal">· {analysis.scores[bestFit.id]}/100</span>
                </p>
                <p className="text-xs text-muted-foreground truncate">{bestFitReason(priority)}</p>
              </div>
              <Link to={`/mentor/${bestFit.id}`} onClick={() => setOpen(false)} className="ml-auto shrink-0">
                <span className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
                  View <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </motion.div>
          )}

          {/* Comparison grid */}
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="border-separate border-spacing-x-2 border-spacing-y-0">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-background" />
                  {selected.map((m) => {
                    const isBest = m.id === analysis.bestFitId && selected.length >= 2;
                    const score = analysis.scores[m.id] ?? 0;
                    return (
                      <th key={m.id} className={`${colWidth} align-bottom pb-3`}>
                        <div className={`relative rounded-2xl border p-3 text-center ${
                          isBest ? "border-primary/40 bg-primary/[0.05]" : "border-border bg-card"
                        }`}>
                          <button
                            onClick={() => remove(m.id)}
                            aria-label={`Remove ${m.name}`}
                            className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>

                          <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-heading font-bold">
                            {m.avatar}
                            {isBest && (
                              <span className="absolute -top-2 left-1/2 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 shadow-lg">
                                <Crown className="h-3 w-3 text-slate-900" />
                              </span>
                            )}
                          </div>

                          <p className="mt-2 font-heading text-sm font-bold text-foreground truncate">{m.name}</p>
                          <div className="mt-1 flex justify-center">
                            <TierBadge tier={m.tier || "verified"} size="sm" />
                          </div>

                          {/* Fit score + animated bar */}
                          <div className="mt-3">
                            <div className="flex items-baseline justify-center gap-0.5">
                              <span className={`font-heading text-2xl font-bold ${isBest ? "text-primary" : "text-foreground"}`}>{score}</span>
                              <span className="text-[10px] text-muted-foreground">/100</span>
                            </div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Fit score</p>
                            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                              <motion.div
                                className={`h-full rounded-full ${isBest ? "bg-primary" : "bg-primary/50"}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${(score / maxScore) * 100}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="group">
                    <td className="sticky left-0 z-10 bg-background py-2 pr-3 align-top text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                      {row.label}
                    </td>
                    {selected.map((m) => {
                      const isWinner = row.winnerId != null && row.winnerId === m.id && selected.length >= 2;
                      return (
                        <td key={m.id} className={`${colWidth} align-top py-2`}>
                          <div className={`min-h-[36px] rounded-lg px-2.5 py-1.5 text-xs ${isWinner ? winnerCell : ""}`}>
                            {row.render(m)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Action row */}
                <tr>
                  <td className="sticky left-0 z-10 bg-background" />
                  {selected.map((m) => (
                    <td key={m.id} className={`${colWidth} pt-3`}>
                      <Link to={`/mentor/${m.id}`} onClick={() => setOpen(false)}>
                        <span className="flex items-center justify-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                          View Profile <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border px-5 sm:px-6 py-3">
          <p className="text-[11px] text-muted-foreground">
            Scores are relative to the traders you're comparing.
          </p>
          <button onClick={clear} className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
            Clear all
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompareDialog;
