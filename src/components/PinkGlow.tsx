/** Subtle ambient pink orbs — drop into any page's background layer */
const PinkGlow = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden>
    {/* Top-right pink orb */}
    <div className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-pink/[0.04] blur-3xl animate-pink-pulse" />
    {/* Bottom-left pink orb */}
    <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-pink/[0.03] blur-3xl animate-pink-pulse" style={{ animationDelay: "3s" }} />
    {/* Center-right subtle glow */}
    <div className="absolute top-1/2 right-0 w-[300px] h-[300px] rounded-full bg-pink/[0.02] blur-3xl animate-float-slow" />
  </div>
);

export default PinkGlow;
