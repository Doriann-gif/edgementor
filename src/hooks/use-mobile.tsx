import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/** Synchronously read the viewport width so the first render is already correct.
 *  Returning the wrong value on frame 0 caused heavy animated blur effects to
 *  mount-then-tear-down on phones, producing load-time jank. */
function readIsMobile() {
  if (typeof window === "undefined") return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(readIsMobile);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    mql.addEventListener("change", onChange);
    onChange();
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
