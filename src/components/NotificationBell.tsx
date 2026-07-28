import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

const NotificationBell = () => {
  const { user, isMentor } = useAuth();
  const navigate = useNavigate();
  const inboxPath = isMentor ? "/mentor-dashboard" : "/dashboard";
  const queryClient = useQueryClient();
  const [hasNew, setHasNew] = useState(false);

  const { data: unreadMessages = [] } = useQuery({
    queryKey: ["unread-notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, subject, sender_name, created_at, is_read")
        .eq("recipient_id", user!.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` },
        () => {
          setHasNew(true);
          queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
          queryClient.invalidateQueries({ queryKey: ["messages"] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  const count = unreadMessages.length;

  if (!user) return null;

  return (
    <Popover onOpenChange={(open) => { if (open) setHasNew(false); }}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-muted/50 transition-colors">
          <motion.div animate={hasNew ? { rotate: [0, 15, -15, 10, -10, 0] } : {}} transition={{ duration: 0.5 }}>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </motion.div>
          <AnimatePresence>
            {count > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow-lg shadow-primary/30"
              >
                {count > 9 ? "9+" : count}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <h4 className="font-heading font-semibold text-sm text-foreground">Notifications</h4>
          <p className="text-[11px] text-muted-foreground">{count} unread message{count !== 1 ? "s" : ""}</p>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {unreadMessages.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">All caught up!</p>
            </div>
          ) : (
            unreadMessages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => navigate(inboxPath)}
                className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  <span className="text-xs font-semibold text-foreground truncate">{msg.sender_name}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                    {new Date(msg.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate pl-4">{msg.subject}</p>
              </button>
            ))
          )}
        </div>
        {count > 0 && (
          <button
            onClick={() => navigate(inboxPath)}
            className="w-full text-center py-2.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors border-t border-border"
          >
            View all messages
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
