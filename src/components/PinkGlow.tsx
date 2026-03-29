import { motion } from "framer-motion";

/** Ambient animated background — subtle hue-shifting orbs with glow */
const PinkGlow = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden>
    {/* Primary pink orb — top right, slow drift */}
    <motion.div
      className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full blur-[120px]"
      style={{ background: "radial-gradient(circle, hsl(330 80% 60% / 0.06), hsl(280 60% 55% / 0.03), transparent 70%)" }}
      animate={{ x: [0, 30, -10, 0], y: [0, -20, 15, 0], scale: [1, 1.08, 0.96, 1] }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
    />
    {/* Deep purple orb — bottom left, slow pulse */}
    <motion.div
      className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full blur-[140px]"
      style={{ background: "radial-gradient(circle, hsl(290 50% 50% / 0.04), hsl(330 80% 60% / 0.025), transparent 70%)" }}
      animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
    />
    {/* Warm accent orb — center right, floating */}
    <motion.div
      className="absolute top-1/3 right-[5%] w-[300px] h-[300px] rounded-full blur-[100px]"
      style={{ background: "radial-gradient(circle, hsl(340 70% 55% / 0.035), hsl(20 80% 55% / 0.02), transparent 70%)" }}
      animate={{ y: [0, -25, 8, 0], x: [0, 15, -8, 0] }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
    />
    {/* Cool teal whisp — center left, slow hue shift feel */}
    <motion.div
      className="absolute top-[60%] left-[10%] w-[250px] h-[250px] rounded-full blur-[90px]"
      style={{ background: "radial-gradient(circle, hsl(180 60% 45% / 0.025), hsl(220 50% 50% / 0.015), transparent 70%)" }}
      animate={{ y: [0, 18, -12, 0], scale: [1, 1.04, 0.98, 1] }}
      transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
    />
    {/* Tiny hot accent — top center, subtle */}
    <motion.div
      className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[180px] h-[180px] rounded-full blur-[80px]"
      style={{ background: "radial-gradient(circle, hsl(350 75% 60% / 0.03), transparent 70%)" }}
      animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.95, 1.05, 0.95] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
    />
  </div>
);

export default PinkGlow;
