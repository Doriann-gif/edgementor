import { Users, Award, Star, Globe } from "lucide-react";
import { motion } from "framer-motion";
import type { Mentor } from "@/types/mentor";

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const StatsSection = ({ allMentors }: { allMentors: Mentor[] }) => (
  <section className="border-y border-border/30 bg-card/20 backdrop-blur-sm py-16 px-4 sm:px-6 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-500/[0.03] to-transparent pointer-events-none" />
    <motion.div
      className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-12 relative"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      variants={staggerContainer}
    >
      {[
        { label: "Active Traders", value: allMentors.reduce((sum, m) => sum + m.students, 0), suffix: "+", icon: Users },
        { label: "Verified Mentors", value: allMentors.length, suffix: "", icon: Award },
        { label: "Avg. Rating", value: allMentors.length ? +(allMentors.reduce((sum, m) => sum + Number(m.rating), 0) / allMentors.length).toFixed(1) : 0, suffix: "", icon: Star },
        { label: "Countries", value: 40, suffix: "+", icon: Globe },
      ].map((stat) => (
        <motion.div key={stat.label} className="text-center group" variants={fadeUp}>
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-3 group-hover:bg-primary/15 transition-colors"
            whileHover={{ scale: 1.15, rotate: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <stat.icon className="h-5 w-5 text-primary" />
          </motion.div>
          <motion.div
            className="font-heading text-3xl sm:text-4xl font-bold text-foreground"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {stat.value}{stat.suffix}
          </motion.div>
          <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
        </motion.div>
      ))}
    </motion.div>
  </section>
);

export default StatsSection;
