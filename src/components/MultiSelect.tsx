import { useState } from "react";
import { cn } from "@/lib/utils";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const MultiSelect = ({ label, options, selected, onChange }: MultiSelectProps) => {
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherValue, setOtherValue] = useState("");

  const customValues = selected.filter((s) => !options.includes(s));

  const toggle = (option: string) => {
    onChange(
      selected.includes(option)
        ? selected.filter((s) => s !== option)
        : [...selected, option]
    );
  };

  const addOther = () => {
    const trimmed = otherValue.trim();
    if (!trimmed) {
      toast.error("Please enter a value.");
      return;
    }
    const isDuplicate = [...options, ...selected].some(
      (v) => v.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      toast.error(`"${trimmed}" is already in the list.`);
      return;
    }
    onChange([...selected, trimmed]);
    setOtherValue("");
    setShowOtherInput(false);
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

        {/* Custom "Other" values */}
        {customValues.map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => toggle(val)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/50 bg-primary/10 text-primary px-3 py-1.5 text-sm font-medium transition-all duration-200 shadow-[var(--glow-primary)]"
          >
            {val}
            <X className="h-3 w-3" />
          </button>
        ))}

        {/* Other button / input */}
        {showOtherInput ? (
          <div className="inline-flex items-center gap-1.5">
            <Input
              autoFocus
              value={otherValue}
              onChange={(e) => setOtherValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addOther(); }
                if (e.key === "Escape") setShowOtherInput(false);
              }}
              placeholder="Type here..."
              className="h-8 w-32 text-sm bg-muted border-border"
            />
            <button
              type="button"
              onClick={addOther}
              className="rounded-lg border border-primary/50 bg-primary/10 text-primary px-2.5 py-1.5 text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              Add
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowOtherInput(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all duration-200"
          >
            <Plus className="h-3 w-3" /> Other
          </button>
        )}
      </div>
    </div>
  );
};

export default MultiSelect;
