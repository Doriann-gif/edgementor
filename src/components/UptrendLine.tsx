/** Subtle blurred green uptrend line in the background */
const UptrendLine = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden>
    <svg
      viewBox="0 0 1200 600"
      fill="none"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full opacity-10"
      style={{ filter: "blur(6px)" }}
    >
      <path
        d="M0 520 Q150 480 300 420 Q450 340 500 300 Q600 220 700 260 Q800 200 900 140 Q1000 90 1100 60 L1200 30"
        stroke="hsl(var(--primary))"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M0 520 Q150 480 300 420 Q450 340 500 300 Q600 220 700 260 Q800 200 900 140 Q1000 90 1100 60 L1200 30 L1200 600 L0 600 Z"
        fill="url(#uptrendGrad)"
      />
      <defs>
        <linearGradient id="uptrendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.08" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

export default UptrendLine;
