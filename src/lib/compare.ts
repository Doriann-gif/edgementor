// Trader comparison scoring — powers the "Compare Traders" side-by-side view.
// Normalizes each mentor's public stats across the compared set and blends them
// into a single "fit" score (0–100). The blend re-weights based on what the
// viewer says matters most, so the recommended "best fit" adapts to the student.

import type { Mentor } from "@/types/mentor";

export const MAX_COMPARE = 4;

export type FitPriority = "balanced" | "rating" | "value" | "experience" | "community";

export const FIT_PRIORITIES: { value: FitPriority; label: string; hint: string }[] = [
  { value: "balanced", label: "Balanced", hint: "A bit of everything" },
  { value: "rating", label: "Top Rated", hint: "Highest student ratings" },
  { value: "value", label: "Best Value", hint: "Most rating per dollar" },
  { value: "experience", label: "Most Experienced", hint: "Longest time trading" },
  { value: "community", label: "Big Community", hint: "Most active students" },
];

// Weights per metric for each priority (each row sums to 1).
const WEIGHTS: Record<FitPriority, { rating: number; experience: number; students: number; value: number; proof: number }> = {
  balanced:   { rating: 0.30, experience: 0.20, students: 0.18, value: 0.22, proof: 0.10 },
  rating:     { rating: 0.55, experience: 0.13, students: 0.10, value: 0.12, proof: 0.10 },
  value:      { rating: 0.22, experience: 0.10, students: 0.08, value: 0.55, proof: 0.05 },
  experience: { rating: 0.20, experience: 0.52, students: 0.08, value: 0.10, proof: 0.10 },
  community:  { rating: 0.22, experience: 0.10, students: 0.52, value: 0.06, proof: 0.10 },
};

/** Pull a representative number of years out of free-text experience.
 *  Handles ranges ("3-5 years" → 4), open-ended ("10+ years" → 10) and
 *  free text ("15 years, self-taught" → 15) by averaging every number found. */
export const parseExperienceYears = (experience?: string | null): number => {
  if (!experience) return 0;
  const nums = experience.match(/\d+(\.\d+)?/g);
  if (!nums || nums.length === 0) return 0;
  const parsed = nums.map(Number);
  return parsed.reduce((a, b) => a + b, 0) / parsed.length;
};

// "Value" = student rating earned per dollar spent — higher is a better deal.
// Free mentorships (price 0) fall back to raw rating so they aren't divided by 0.
const valueMetric = (m: Mentor): number => (m.monthly_price > 0 ? m.rating / m.monthly_price : m.rating);

export interface CompareAnalysis {
  /** mentorId → overall fit score, 0–100 */
  scores: Record<string, number>;
  bestFitId: string | null;
  cheapestId: string | null;
  topRatedId: string | null;
  mostStudentsId: string | null;
  mostExperiencedId: string | null;
}

const EMPTY: CompareAnalysis = {
  scores: {},
  bestFitId: null,
  cheapestId: null,
  topRatedId: null,
  mostStudentsId: null,
  mostExperiencedId: null,
};

export const analyzeMentors = (mentors: Mentor[], priority: FitPriority = "balanced"): CompareAnalysis => {
  if (mentors.length === 0) return EMPTY;

  const w = WEIGHTS[priority];
  const years = (m: Mentor) => parseExperienceYears(m.experience);

  // Min-max normalizer → maps a metric onto [0,1] across the compared set.
  // When every mentor ties (or there's only one), everyone scores full marks
  // on that metric so it stops being a differentiator.
  const normalizer = (values: number[]) => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    return (v: number) => (max === min ? 1 : (v - min) / (max - min));
  };

  const normRating = normalizer(mentors.map((m) => m.rating));
  const normExp = normalizer(mentors.map(years));
  const normStudents = normalizer(mentors.map((m) => m.students));
  const normValue = normalizer(mentors.map(valueMetric));

  const scores: Record<string, number> = {};
  for (const m of mentors) {
    const proof = m.proof_verified_at ? 1 : 0;
    const blended =
      w.rating * normRating(m.rating) +
      w.experience * normExp(years(m)) +
      w.students * normStudents(m.students) +
      w.value * normValue(valueMetric(m)) +
      w.proof * proof;
    scores[m.id] = Math.round(blended * 100);
  }

  // dir: 1 → higher wins, -1 → lower wins. Ties keep the first (already
  // rating-sorted) mentor, which is a sensible default.
  const bestBy = (metric: (m: Mentor) => number, dir: 1 | -1 = 1) =>
    mentors.reduce((best, m) => (metric(m) * dir > metric(best) * dir ? m : best), mentors[0]).id;

  return {
    scores,
    bestFitId: mentors.reduce((best, m) => (scores[m.id] > scores[best.id] ? m : best), mentors[0]).id,
    cheapestId: bestBy((m) => m.monthly_price, -1),
    topRatedId: bestBy((m) => m.rating, 1),
    mostStudentsId: bestBy((m) => m.students, 1),
    mostExperiencedId: bestBy((m) => years(m), 1),
  };
};

/** One-line reason we recommend the best-fit mentor, tuned to the chosen priority. */
export const bestFitReason = (priority: FitPriority): string => {
  switch (priority) {
    case "rating": return "Highest-rated pick for the strongest student reviews.";
    case "value": return "Best bang for your buck — top rating for the price.";
    case "experience": return "Most seasoned trader of the ones you're comparing.";
    case "community": return "Biggest, most active student community.";
    default: return "Best all-round balance of rating, value, experience & proof.";
  }
};
