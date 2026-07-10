import { Link } from "react-router-dom";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import TierBadge from "@/components/TierBadge";
import type { Mentor, MentorTier } from "@/types/mentor";

interface VerifiedBadgePopoverProps {
  mentor: Mentor;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

// A badge that means nothing is worse than no badge: clicking any tier badge
// explains exactly what EdgeMentor verified for this mentor.
const VerifiedBadgePopover = ({ mentor, size = "md", showLabel = true }: VerifiedBadgePopoverProps) => {
  const tier = (mentor.tier || "verified") as MentorTier;
  const trackRecordVerified = !!mentor.proof_verified_at;
  const verifiedDate = mentor.proof_verified_at
    ? new Date(mentor.proof_verified_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

  const checks = [
    { done: true, label: "Identity confirmed", detail: "Real person, vetted application" },
    {
      done: trackRecordVerified,
      label: trackRecordVerified ? `Track record reviewed${verifiedDate ? ` (${verifiedDate})` : ""}` : "Track record not yet verified",
      detail: trackRecordVerified
        ? "Proof of profitability reviewed by EdgeMentor"
        : "This mentor hasn't completed track-record verification",
    },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="cursor-pointer hover:opacity-80 transition-opacity" aria-label="What does this badge mean?">
          <TierBadge tier={tier} size={size} showLabel={showLabel} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="center">
        <p className="font-heading text-sm font-semibold text-foreground mb-3">What we verified</p>
        <div className="space-y-2.5 mb-3">
          {checks.map((c) => (
            <div key={c.label} className="flex items-start gap-2.5">
              {c.done ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`text-xs font-medium ${c.done ? "text-foreground" : "text-muted-foreground"}`}>{c.label}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{c.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <Link
          to="/verification"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          How verification works <ArrowRight className="h-3 w-3" />
        </Link>
      </PopoverContent>
    </Popover>
  );
};

export default VerifiedBadgePopover;
