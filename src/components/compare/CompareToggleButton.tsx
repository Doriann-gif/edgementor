import { GitCompareArrows, Check } from "lucide-react";
import { toast } from "sonner";
import { useCompare } from "@/contexts/CompareContext";
import type { Mentor } from "@/types/mentor";

/** Small "Compare" toggle designed to sit next to a "View Profile" CTA.
 *  Cards are usually wrapped in a <Link>, so we stop the click from
 *  bubbling up into a navigation. */
const CompareToggleButton = ({ mentor, className = "" }: { mentor: Mentor; className?: string }) => {
  const { isSelected, toggle, max } = useCompare();
  const active = isSelected(mentor.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = toggle(mentor);
    if (result === "full") {
      toast.error(`You can compare up to ${max} traders at once.`, {
        description: "Remove one from the compare tray to add another.",
      });
    } else if (result === "added") {
      toast.success(`${mentor.name} added to compare`, { duration: 1800 });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={active ? `Remove ${mentor.name} from comparison` : `Add ${mentor.name} to comparison`}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all duration-300 border ${
        active
          ? "border-primary/50 bg-primary/15 text-primary"
          : "border-border bg-secondary/60 text-muted-foreground hover:text-foreground hover:border-primary/30"
      } ${className}`}
    >
      {active ? <Check className="h-3.5 w-3.5" /> : <GitCompareArrows className="h-3.5 w-3.5" />}
      {active ? "Added" : "Compare"}
    </button>
  );
};

export default CompareToggleButton;
