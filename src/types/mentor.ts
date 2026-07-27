export type MentorTier = 'verified' | 'pro' | 'elite';

export interface Mentor {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  full_bio: string;
  experience: string;
  instruments: string[];
  concepts: string[];
  session: string;
  monthly_price: number;
  payment_type: 'monthly' | 'one_time';
  rating: number;
  students: number;
  highlights: string[];
  status: string;
  tier: MentorTier;
  banner_color: string;
  country?: string | null;
  user_id?: string | null;
  social_link?: string | null;
  /** Mentor-provided link to a verifiable track record (Myfxbook, broker statement, …) */
  proof_track_record_url?: string | null;
  /** Set by admins once the track record has been reviewed — drives the Verified Track Record badge */
  proof_verified_at?: string | null;
  response_time?: string | null;
  timezone?: string | null;
  languages?: string[] | null;
  /** One-line "who this mentorship is for" */
  ideal_for?: string | null;
  /** False when the mentor has paused taking new students */
  available?: boolean | null;
  created_at?: string | null;
}

export interface MentorReview {
  id: string;
  mentor_id: string;
  reviewer_name: string;
  rating: number;
  review_date: string;
  review_text: string;
}
