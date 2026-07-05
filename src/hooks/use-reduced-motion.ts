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
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setPrefersReduced(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile || prefersReduced;
}
