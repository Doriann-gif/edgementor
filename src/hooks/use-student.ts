import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useSavedMentors = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["saved-mentors", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_mentors")
        .select("mentor_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set(data.map((s) => s.mentor_id));
    },
  });
};

export const useToggleSaveMentor = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mentorId, isSaved }: { mentorId: string; isSaved: boolean }) => {
      if (!user) throw new Error("Must be logged in");
      if (isSaved) {
        const { error } = await supabase
          .from("saved_mentors")
          .delete()
          .eq("user_id", user.id)
          .eq("mentor_id", mentorId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saved_mentors")
          .insert({ user_id: user.id, mentor_id: mentorId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-mentors"] });
    },
  });
};

export const useSubscriptions = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["subscriptions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, mentors(*)")
        .eq("user_id", user!.id)
        .eq("status", "active");
      if (error) throw error;
      return data;
    },
  });
};

export const useMessages = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["messages", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("recipient_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useMarkMessageRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
};
