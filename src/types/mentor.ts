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
}

export interface MentorReview {
  id: string;
  mentor_id: string;
  reviewer_name: string;
  rating: number;
  review_date: string;
  review_text: string;
}
