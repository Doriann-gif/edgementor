import { useEffect, useState } from "react";
import { useIsMobile } from "./use-mobile";

const ANIM_KEY = "edgementor-animations";
const ANIM_EVENT = "edgementor-animations-change";

/** Site-level animation preference set in Settings → Appearance. Defaults to on. */
export const getAnimationsEnabled = () =>
  typeof window === "undefined" || localStorage.getItem(ANIM_KEY) !== "off";

export const setAnimationsEnabled = (enabled: boolean) => {
  localStorage.setItem(ANIM_KEY, enabled ? "on" : "off");
  window.dispatchEvent(new Event(ANIM_EVENT));
};

/**
 * Returns true when heavy animations should be disabled — on mobile devices
 * (where large animated blur/filter effects cause jank), when the user has
 * asked the OS for reduced motion, or when they turned animations off in
 * Settings → Appearance. Use this to skip infinite floating orbs, animated
 * SVG filters, backdrop-blur, etc.
 */
export function useReducedMotion() {
  const isMobile = useIsMobile();
  // Read the OS setting synchronously so the first render is already correct —
  // otherwise animated components mount their heavy variant for one frame.
  const [prefersReduced, setPrefersReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [animationsOn, setAnimationsOn] = useState(getAnimationsEnabled);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setPrefersReduced(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);

    const onAnimChange = () => setAnimationsOn(getAnimationsEnabled());
    window.addEventListener(ANIM_EVENT, onAnimChange);
    return () => {
      mql.removeEventListener("change", onChange);
      window.removeEventListener(ANIM_EVENT, onAnimChange);
    };
  }, []);

  return isMobile || prefersReduced || !animationsOn;
}
