import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Mentor } from "@/types/mentor";

export const useMyMentorProfile = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-mentor-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentors")
        .select("id, name, avatar, bio, full_bio, experience, instruments, concepts, session, monthly_price, payment_type, rating, students, highlights, status, tier, banner_color, country, social_link, available, user_id, created_at")
        .eq("user_id", user!.id)
        .eq("status", "approved")
        .maybeSingle();
      if (error) throw error;
      return data as Mentor & { available: boolean; user_id: string } | null;
    },
  });
};

export const useUpdateMentorProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("mentors").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-mentor-profile"] });
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
    },
  });
};

export const useMentorStudents = (mentorId: string | undefined) => {
  return useQuery({
    queryKey: ["mentor-students", mentorId],
    enabled: !!mentorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, profiles:user_id(id, display_name, avatar_url, country, age, trading_experience, timezone, bio, trading_interests)")
        .eq("mentor_id", mentorId!)
        .eq("status", "active")
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useMentorEarnings = (mentorId: string | undefined, monthlyPrice: number) => {
  return useQuery({
    queryKey: ["mentor-earnings", mentorId],
    enabled: !!mentorId,
    queryFn: async () => {
      // Active subs (current students) and all-time count (any status)
      const [activeRes, allRes] = await Promise.all([
        supabase.from("subscriptions").select("id", { count: "exact", head: true })
          .eq("mentor_id", mentorId!).eq("status", "active"),
        supabase.from("subscriptions").select("id", { count: "exact", head: true })
          .eq("mentor_id", mentorId!),
      ]);
      if (activeRes.error) throw activeRes.error;
      if (allRes.error) throw allRes.error;
      const activeCount = activeRes.count ?? 0;
      return {
        activeStudents: activeCount,
        monthlyRevenue: activeCount * monthlyPrice,        // gross, before 20% platform fee
        monthlyNet: Math.round(activeCount * monthlyPrice * 0.8),
        allTimeSubs: allRes.count ?? 0,
      };
    },
  });
};
