import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const path = "M0 520 Q150 480 300 420 Q450 340 500 300 Q600 220 700 260 Q800 200 900 140 Q1000 90 1100 60 L1200 30";

const UptrendLine = () => {
  const reduced = useReducedMotion();

  // On mobile / reduced-motion: render a cheap static line with no SVG
  // filters and no animation. Animated feGaussianBlur is very expensive to
  // rasterize every frame on phones and was a main source of scroll jank.
  if (reduced) {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden>
        <svg
          viewBox="0 0 1200 600"
          fill="none"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full opacity-20"
        >
          <defs>
            <linearGradient id="uptrendGradStatic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.08" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${path} L1200 600 L0 600 Z`} fill="url(#uptrendGradStatic)" />
          <path d={path} stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5" />
        </svg>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden>
      <svg
        viewBox="0 0 1200 600"
        fill="none"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full opacity-20"
        style={{ filter: "blur(6px)" }}
      >
        <defs>
          <linearGradient id="uptrendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.08" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Glow layer behind the line */}
        <motion.path
          d={path}
          stroke="hsl(var(--primary))"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          filter="url(#glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 0.4, 0.4] }}
          transition={{ duration: 3, ease: "easeInOut" }}
        />
        <motion.path
          d={path}
          stroke="hsl(var(--primary))"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          filter="url(#glow)"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 0.5, 0.25, 0.5] }}
          transition={{ duration: 4, delay: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Main line */}
        <motion.path
          d={path}
          stroke="hsl(var(--primary))"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, ease: "easeInOut" }}
        />

        {/* Gradient fill */}
        <motion.path
          d={`${path} L1200 600 L0 600 Z`}
          fill="url(#uptrendGrad)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 1.5, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
};

export default UptrendLine;
