import type { Mentor } from "@/types/mentor";

// Single source of truth for marketplace-wide headline stats.
// Every surface (homepage, mentor listing, etc.) must derive its numbers
// from here — never hardcode marketplace stats in a component.
export interface MarketplaceStats {
  mentorCount: number;
  totalStudents: number;
  /** Average rating across mentors that have at least one review — null when nobody is rated yet */
  avgRating: number | null;
  /** Distinct countries mentors operate from */
  countryCount: number;
}

export const computeMarketplaceStats = (mentors: Mentor[]): MarketplaceStats => {
  // Unrated mentors (rating 0 = no reviews yet) are excluded from the average
  // so new mentors don't drag the marketplace rating down.
  const rated = mentors.filter((m) => Number(m.rating) > 0);
  return {
    mentorCount: mentors.length,
    totalStudents: mentors.reduce((sum, m) => sum + (m.students || 0), 0),
    avgRating: rated.length
      ? +(rated.reduce((sum, m) => sum + Number(m.rating), 0) / rated.length).toFixed(1)
      : null,
    countryCount: new Set(mentors.map((m) => m.country).filter(Boolean)).size,
  };
};

export const formatStatCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K+` : `${n}`);
