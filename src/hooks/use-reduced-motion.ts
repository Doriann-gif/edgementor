import { useEffect, useState } from "react";
import { useIsMobile } from "./use-mobile";

/**
 * Returns true when heavy animations should be disabled — on mobile devices
 * (where large animated blur/filter effects cause jank) or when the user has
 * asked the OS for reduced motion. Use this to skip infinite floating orbs,
 * animated SVG filters, backdrop-blur, etc.
 */
export function useReducedMotion() {
  const isMobile = useIsMobile();
  // Read the OS setting synchronously so the first render is already correct —
  // otherwise animated components mount their heavy variant for one frame.
  const [prefersReduced, setPrefersReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setPrefersReduced(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile || prefersReduced;
}
