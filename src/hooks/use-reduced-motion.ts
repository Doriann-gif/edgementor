import { useIsMobile } from "./use-mobile";

/**
 * Returns true when heavy animations should be disabled (mobile devices).
 * Use this to skip backdrop-blur, infinite floating orbs, etc.
 */
export function useReducedMotion() {
  const isMobile = useIsMobile();
  return isMobile;
}
