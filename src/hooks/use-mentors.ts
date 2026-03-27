import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Mentor, MentorReview } from "@/types/mentor";

export const useMentors = () =>
  useQuery({
    queryKey: ["mentors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentors")
        .select("*")
        .order("rating", { ascending: false });
      if (error) throw error;
      return data as Mentor[];
    },
  });

export const useMentor = (id: string | undefined) =>
  useQuery({
    queryKey: ["mentor", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentors")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Mentor;
    },
  });

export const useMentorReviews = (mentorId: string | undefined) =>
  useQuery({
    queryKey: ["mentor-reviews", mentorId],
    enabled: !!mentorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentor_reviews")
        .select("*")
        .eq("mentor_id", mentorId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MentorReview[];
    },
  });

export const useFeaturedMentors = () =>
  useQuery({
    queryKey: ["featured-mentors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentors")
        .select("*")
        .order("rating", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data as Mentor[];
    },
  });
