import { CheckCircle2, Star, Crown } from "lucide-react";
import type { MentorTier } from "@/types/mentor";

interface TierBadgeProps {
  tier: MentorTier;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const TIER_CONFIG = {
  verified: {
    label: "Verified",
    icon: CheckCircle2,
    className: "text-emerald-400",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    glowClass: "",
  },
  pro: {
    label: "Pro",
    icon: Star,
    className: "text-amber-400 fill-amber-400",
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    glowClass: "",
  },
  elite: {
    label: "Elite",
    icon: Crown,
    className: "text-slate-200 drop-shadow-[0_0_6px_rgba(203,213,225,0.5)]",
    badgeClass: "border-slate-300/30 bg-slate-900 text-slate-200 shadow-[0_0_12px_rgba(203,213,225,0.15)]",
    glowClass: "drop-shadow-[0_0_8px_rgba(203,213,225,0.4)]",
  },
};

const SIZES = {
  sm: { icon: "h-3.5 w-3.5", text: "text-[10px]", padding: "px-1.5 py-0.5", gap: "gap-1" },
  md: { icon: "h-4 w-4", text: "text-xs", padding: "px-2 py-0.5", gap: "gap-1.5" },
  lg: { icon: "h-5 w-5", text: "text-sm", padding: "px-2.5 py-1", gap: "gap-1.5" },
};

const TierBadge = ({ tier, size = "md", showLabel = true }: TierBadgeProps) => {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.verified;
  const sizeConfig = SIZES[size];
  const Icon = config.icon;

  if (!showLabel) {
    return <Icon className={`${sizeConfig.icon} ${config.className} ${config.glowClass}`} />;
  }

  return (
    <span className={`inline-flex items-center ${sizeConfig.gap} rounded-full border font-medium ${sizeConfig.padding} ${sizeConfig.text} ${config.badgeClass}`}>
      <Icon className={`${sizeConfig.icon} ${config.className} ${config.glowClass}`} />
      {config.label}
    </span>
  );
};

export default TierBadge;
export { TIER_CONFIG };
