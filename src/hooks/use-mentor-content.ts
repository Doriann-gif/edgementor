import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MentorContent {
  id: string;
  mentor_id: string;
  title: string;
  description: string;
  content_type: string;
  content_url: string;
  display_order: number;
  created_at: string;
}

export const useMentorContent = (mentorId: string | undefined) => {
  return useQuery({
    queryKey: ["mentor-content", mentorId],
    queryFn: async () => {
      if (!mentorId) return [];
      const { data, error } = await supabase
        .from("mentor_content")
        .select("*")
        .eq("mentor_id", mentorId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as MentorContent[];
    },
    enabled: !!mentorId,
  });
};

export const useIsSubscribed = (mentorId: string | undefined) => {
  return useQuery({
    queryKey: ["is-subscribed", mentorId],
    queryFn: async () => {
      if (!mentorId) return false;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("mentor_id", mentorId)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!mentorId,
  });
};
