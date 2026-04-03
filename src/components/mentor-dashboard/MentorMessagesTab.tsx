import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Mail, MailOpen, Send } from "lucide-react";
import { toast } from "sonner";

const MentorMessagesTab = ({ mentorId, mentorName }: { mentorId: string; mentorName: string }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [replyTo, setReplyTo] = useState<{ userId: string; name: string } | null>(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("mentor-messages-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["mentor-messages"] });
          queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["mentor-messages", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`recipient_id.eq.${user!.id},sender_mentor_id.eq.${mentorId}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("messages").update({ is_read: true }).eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentor-messages"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
  });

  const sendReply = useMutation({
    mutationFn: async () => {
      if (!replyTo || !user) throw new Error("Missing data");
      const { error } = await supabase.from("messages").insert({
        recipient_id: replyTo.userId,
        sender_user_id: user.id,
        sender_mentor_id: mentorId,
        sender_name: mentorName,
        subject: replySubject.trim(),
        body: replyBody.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentor-messages"] });
      toast.success(`Reply sent to ${replyTo?.name}`);
      setReplyTo(null);
      setReplySubject("");
      setReplyBody("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to send reply"),
  });

  const unreadCount = messages.filter((m) => m.recipient_id === user?.id && !m.is_read).length;

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-2.5 text-sm text-primary font-medium">
          {unreadCount} unread message{unreadCount > 1 ? "s" : ""}
        </div>
      )}
      {messages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-foreground font-medium mb-1">No messages yet</p>
          <p className="text-xs text-muted-foreground">Student messages will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => {
            const isFromStudent = msg.recipient_id === user?.id;
            return (
              <div key={msg.id} className={`rounded-xl border bg-card p-4 ${isFromStudent && !msg.is_read ? "border-primary/20" : "border-border"}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${!isFromStudent ? "bg-primary/10" : msg.is_read ? "bg-muted" : "bg-primary/10"}`}>
                      {!isFromStudent ? <Send className="h-3.5 w-3.5 text-primary" /> : msg.is_read ? <MailOpen className="h-3.5 w-3.5 text-muted-foreground" /> : <Mail className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <div>
                      <span className="font-heading font-semibold text-sm text-foreground">
                        {isFromStudent ? msg.sender_name : `You → ${msg.sender_name}`}
                      </span>
                      {isFromStudent && !msg.is_read && <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5">NEW</span>}
                      {!isFromStudent && <span className="ml-2 inline-flex items-center rounded-full bg-muted text-muted-foreground text-[9px] font-bold px-1.5 py-0.5">SENT</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{new Date(msg.created_at).toLocaleDateString()}</span>
                    {isFromStudent && !msg.is_read && (
                      <button onClick={() => markRead.mutate(msg.id)} className="text-[10px] text-primary hover:underline font-medium">Mark read</button>
                    )}
                  </div>
                </div>
                <h4 className="text-sm font-medium text-foreground mb-1">{msg.subject}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{msg.body}</p>
                {isFromStudent && msg.sender_user_id && (
                  <Button variant="ghost" size="sm" className="text-xs mt-2 h-7" onClick={() => {
                    setReplyTo({ userId: msg.sender_user_id!, name: msg.sender_name });
                    setReplySubject(`Re: ${msg.subject}`);
                    setReplyBody("");
                  }}>
                    <Send className="h-3 w-3 mr-1" /> Reply
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!replyTo} onOpenChange={(open) => !open && setReplyTo(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Reply to {replyTo?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Subject</label>
              <Input value={replySubject} onChange={(e) => setReplySubject(e.target.value)} className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Message</label>
              <Textarea value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="Write your reply..." rows={4} className="text-sm" />
            </div>
            <Button className="w-full text-sm" disabled={!replySubject.trim() || !replyBody.trim() || sendReply.isPending} onClick={() => sendReply.mutate()}>
              {sendReply.isPending ? "Sending..." : <><Send className="h-3.5 w-3.5 mr-1.5" /> Send Reply</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MentorMessagesTab;
