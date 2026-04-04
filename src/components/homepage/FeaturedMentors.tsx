import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, Users, TrendingUp, ChevronRight, Sparkles } from "lucide-react";
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

const slideInLeft = {
  hidden: { opacity: 0, x: -40 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const FeaturedMentors = ({ mentors }: { mentors: Mentor[] }) => (
  <section className="py-28 sm:py-36 px-4 sm:px-6 relative">
    <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-pink-500/[0.03] rounded-full blur-[120px] pointer-events-none" />
    <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-primary/[0.03] rounded-full blur-[100px] pointer-events-none" />

    <div className="max-w-6xl mx-auto relative">
      <motion.div
        className="flex items-end justify-between mb-14"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={slideInLeft}
      >
        <div>
          <motion.span
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary mb-3 rounded-full bg-primary/5 border border-primary/20 px-3 py-1"
            animate={{ boxShadow: ["0 0 0 0 hsl(var(--primary) / 0)", "0 0 12px 2px hsl(var(--primary) / 0.08)", "0 0 0 0 hsl(var(--primary) / 0)"] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Star className="h-3 w-3 fill-current" /> Hand-picked
          </motion.span>
          <h2 className="font-heading text-2xl sm:text-4xl font-bold text-foreground tracking-tight">
            Featured <span className="bg-gradient-to-r from-primary to-pink-400 bg-clip-text text-transparent">Mentors</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">Top-rated traders with proven track records and active communities.</p>
        </div>
        <Link to="/mentors" className="hidden sm:flex items-center gap-1 text-sm text-primary hover:underline font-medium">
          View all <ChevronRight className="h-4 w-4" />
        </Link>
      </motion.div>

      {mentors.length === 0 ? (
        <motion.div className="text-center py-16 rounded-2xl border border-dashed border-border bg-card/30" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No mentors available yet. Check back soon!</p>
        </motion.div>
      ) : (
        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-7" initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer}>
          {mentors.map((mentor, idx) => (
            <motion.div key={mentor.id} variants={fadeUp} custom={idx}>
              <Link to={`/mentor/${mentor.id}`}>
                <motion.div
                  className="group relative rounded-2xl border border-border bg-card/80 p-6 transition-all duration-300 hover:border-pink-400/30 overflow-hidden"
                  whileHover={{ y: -8, boxShadow: "0 25px 60px -12px hsl(var(--primary) / 0.15), 0 0 40px -8px rgba(236,72,153,0.08)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-pink-400/[0.08] to-transparent rounded-bl-full pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-primary/[0.05] to-transparent rounded-tr-full pointer-events-none" />

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {idx === 0 && (
                      <motion.div
                        className="relative flex items-center gap-1 rounded-full bg-gradient-to-r from-pink-500/20 to-pink-400/10 border border-pink-400/30 px-2.5 py-0.5 text-[10px] font-bold text-pink-400 overflow-hidden"
                        initial={{ opacity: 0, scale: 0, rotate: -12 }}
                        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
                        animate={{ boxShadow: ["0 0 0 0 hsl(var(--pink) / 0)", "0 0 14px 2px hsl(var(--pink) / 0.15)", "0 0 0 0 hsl(var(--pink) / 0)"] }}
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[btn-shimmer_2s_ease-in-out_infinite]" />
                        <TrendingUp className="h-3 w-3" /> Most Popular
                      </motion.div>
                    )}
                    {idx === 2 && (
                      <motion.div
                        className="relative flex items-center gap-1 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 px-2.5 py-0.5 text-[10px] font-bold text-primary overflow-hidden"
                        initial={{ opacity: 0, scale: 0, rotate: 12 }}
                        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 400 }}
                        animate={{ scale: [1, 1.05, 1] }}
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-[btn-shimmer_2.5s_ease-in-out_infinite]" />
                        <Sparkles className="h-3 w-3" /> New
                      </motion.div>
                    )}
                    {idx < 3 && (
                      <motion.div
                        className="flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary"
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + idx * 0.1, type: "spring" }}
                      >
                        #{idx + 1}
                      </motion.div>
                    )}
                  </div>

                  <div className="flex items-start gap-4 mb-5">
                    <motion.div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 via-pink-400/10 to-primary/5 text-primary font-heading font-bold text-base shadow-inner"
                      whileHover={{ scale: 1.12, rotate: 8 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {mentor.avatar}
                    </motion.div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading font-semibold text-foreground text-lg group-hover:text-primary transition-colors">{mentor.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                          <Star className="h-3 w-3 fill-current" /> {mentor.rating}
                        </span>
                        <span className="text-xs text-muted-foreground">{mentor.students} students</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-2">{mentor.bio}</p>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {mentor.instruments.map((inst) => (
                      <motion.span key={inst} className="rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary" whileHover={{ scale: 1.08 }}>
                        {inst}
                      </motion.span>
                    ))}
                    {mentor.concepts.slice(0, 2).map((c) => (
                      <motion.span key={c} className="rounded-lg bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground" whileHover={{ scale: 1.08 }}>
                        {c}
                      </motion.span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div>
                      <span className="font-heading text-xl font-bold text-foreground">${mentor.monthly_price}</span>
                      <span className="text-xs text-muted-foreground">/mo</span>
                    </div>
                    <motion.span className="flex items-center gap-1 text-sm text-primary font-medium" whileHover={{ x: 4 }}>
                      View Profile
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </motion.span>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="sm:hidden mt-6 text-center">
        <Link to="/mentors" className="text-sm text-primary hover:underline font-medium">View all mentors →</Link>
      </div>
    </div>
  </section>
);

export default FeaturedMentors;
