import type { Mentor } from "@/types/mentor";

// Social-proof display rules. A brand-new mentor with no students and no
// rating should never render a hollow "★ 0 · 0 students" — that reads as
// "zero traction" and quietly kills conversion. Show each metric only when
// it's real, and a clean "New" badge when there's nothing to show yet.
type Stats = Pick<Mentor, "rating" | "students">;

export const hasRating = (m: Stats) => (m.rating ?? 0) > 0;
export const hasStudents = (m: Stats) => (m.students ?? 0) > 0;
export const isNewMentor = (m: Stats) => !hasRating(m) && !hasStudents(m);
