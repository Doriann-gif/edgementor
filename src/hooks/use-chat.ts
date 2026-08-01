import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Conversation = {
  counterpart_id: string;
  counterpart_name: string;
  counterpart_avatar: string | null;
  last_body: string;
  last_at: string;
  last_from_me: boolean;
  unread_count: number;
};

export type ChatMessage = {
  id: string;
  body: string;
  subject: string;
  created_at: string;
  from_me: boolean;
  is_read: boolean;
};

/** Keeps chat queries fresh when a message lands in either direction.
 *  `messages` is already in the supabase_realtime publication. */
export const useChatRealtime = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["conversation"] });
      queryClient.invalidateQueries({ queryKey: ["chat-unread"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
    };
    const channel = supabase
      .channel(`chat:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `sender_user_id=eq.${user.id}` }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);
};

export const useConversations = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_conversations");
      if (error) throw error;
      return (data ?? []) as Conversation[];
    },
  });
};

export const useConversation = (counterpartId: string | null) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conversation", user?.id, counterpartId],
    enabled: !!user && !!counterpartId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_conversation", { _with: counterpartId!, _limit: 200 });
      if (error) throw error;
      return (data ?? []) as ChatMessage[];
    },
  });
};

/** Total unread across every conversation — drives the navbar badge.
 *  Plain select: RLS already limits reads to your own inbox. */
export const useChatUnreadCount = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["chat-unread", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
      return count ?? 0;
    },
  });
};

export const useSendChatMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ to, body }: { to: string; body: string }) => {
      const { data, error } = await supabase.rpc("send_chat_message", { _to: to, _body: body });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["conversation"] });
    },
  });
};

/** Start a thread with a mentor from their mentor id — the mentor's user_id is
 *  never exposed publicly, so this resolves the recipient server-side. */
export const useStartMentorChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ mentorId, body }: { mentorId: string; body: string }) => {
      const { data, error } = await supabase.rpc("message_mentor", {
        _mentor_id: mentorId,
        _subject: "Chat message",
        _body: body,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useMarkConversationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (counterpartId: string) => {
      const { error } = await supabase.rpc("mark_conversation_read", { _with: counterpartId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["chat-unread"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
  });
};
