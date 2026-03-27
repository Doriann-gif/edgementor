import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const MultiSelect = ({ label, options, selected, onChange }: MultiSelectProps) => {
  const toggle = (option: string) => {
    onChange(
      selected.includes(option)
        ? selected.filter((s) => s !== option)
        : [...selected, option]
    );
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-200",
                isSelected
                  ? "border-primary/50 bg-primary/10 text-primary shadow-[var(--glow-primary)]"
                  : "border-border bg-secondary text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}
            >
              {option}
              {isSelected && <X className="h-3 w-3" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MultiSelect;
