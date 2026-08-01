import { useState, useRef, useEffect, useMemo } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Search, Send, ArrowLeft, PenSquare, Loader2 } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useMentors } from "@/hooks/use-mentors";
import {
  useConversations, useConversation, useSendChatMessage,
  useMarkConversationRead, useStartMentorChat, type Conversation,
} from "@/hooks/use-chat";

const initialsOf = (name: string) =>
  name.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? "").join("") || "U";

/** Compact stamp for the conversation list: time today, "Yesterday", else date. */
const listStamp = (iso: string) => {
  const d = new Date(iso);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
};

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d, yyyy");
};

const ConversationRow = ({
  convo, active, onSelect,
}: { convo: Conversation; active: boolean; onSelect: () => void }) => (
  <button
    type="button"
    onClick={onSelect}
    className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-colors border-b border-border/40 last:border-0 ${
      active ? "bg-primary/10" : "hover:bg-muted/50"
    }`}
  >
    <Avatar className="h-10 w-10 shrink-0">
      <AvatarImage src={convo.counterpart_avatar || undefined} alt={convo.counterpart_name} />
      <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
        {initialsOf(convo.counterpart_name)}
      </AvatarFallback>
    </Avatar>
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium text-sm text-foreground truncate">{convo.counterpart_name}</span>
        <span className="text-[10px] text-muted-foreground shrink-0">{listStamp(convo.last_at)}</span>
      </div>
      <div className="flex items-center justify-between gap-2 mt-0.5">
        <p className={`text-xs truncate ${convo.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
          {convo.last_from_me && <span className="text-muted-foreground">You: </span>}
          {convo.last_body}
        </p>
        {convo.unread_count > 0 && (
          <span className="shrink-0 rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 min-w-[18px] text-center">
            {convo.unread_count > 9 ? "9+" : convo.unread_count}
          </span>
        )}
      </div>
    </div>
  </button>
);

const NewChatDialog = ({
  open, onOpenChange, onStarted,
}: { open: boolean; onOpenChange: (o: boolean) => void; onStarted: () => void }) => {
  const { data: mentors = [] } = useMentors();
  const startChat = useStartMentorChat();
  const [mentorId, setMentorId] = useState("");
  const [body, setBody] = useState("");

  const send = async () => {
    try {
      await startChat.mutateAsync({ mentorId, body: body.trim() });
      setMentorId("");
      setBody("");
      onOpenChange(false);
      onStarted();
    } catch (err: any) {
      toast.error(err?.message || "Couldn't start the chat.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New chat</DialogTitle>
          <DialogDescription>Pick a mentor and send your first message.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={mentorId} onValueChange={setMentorId}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Choose a mentor" /></SelectTrigger>
            <SelectContent>
              {mentors.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Write your message…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={5000}
            className="min-h-[110px] text-sm resize-none"
          />
          <Button className="w-full" disabled={!mentorId || !body.trim() || startChat.isPending} onClick={send}>
            <Send className="h-4 w-4 mr-2" /> {startChat.isPending ? "Sending…" : "Send message"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Messages = () => {
  const { user, loading } = useAuth();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [selectNewest, setSelectNewest] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");

  // Chat realtime is subscribed once, app-wide, in the Navbar — it keeps these
  // queries fresh here too, so we don't re-subscribe on this page.
  const { data: conversations = [], isLoading: convosLoading } = useConversations();
  const activeId = params.get("with");
  const { data: thread = [], isLoading: threadLoading } = useConversation(activeId);
  const sendMessage = useSendChatMessage();
  const markRead = useMarkConversationRead();

  const active = conversations.find((c) => c.counterpart_id === activeId) ?? null;

  const selectConversation = (id: string) => {
    setParams(id ? { with: id } : {}, { replace: true });
    setDraft("");
  };

  // Opening a thread clears its unread badge.
  useEffect(() => {
    if (activeId && active && active.unread_count > 0) markRead.mutate(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, active?.unread_count]);

  // After starting a chat the new thread is the most recent one.
  useEffect(() => {
    if (selectNewest && conversations.length > 0) {
      selectConversation(conversations[0].counterpart_id);
      setSelectNewest(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectNewest, conversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.length, activeId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) => c.counterpart_name.toLowerCase().includes(q) || c.last_body.toLowerCase().includes(q),
    );
  }, [conversations, search]);

  // Insert a divider whenever the calendar day changes.
  const grouped = useMemo(() => {
    const out: { day: string; items: typeof thread }[] = [];
    for (const m of thread) {
      const day = dayLabel(m.created_at);
      const last = out[out.length - 1];
      if (last && last.day === day) last.items.push(m);
      else out.push({ day, items: [m] });
    }
    return out;
  }, [thread]);

  const send = async () => {
    const body = draft.trim();
    if (!body || !activeId) return;
    setDraft("");
    try {
      await sendMessage.mutateAsync({ to: activeId, body });
    } catch (err: any) {
      setDraft(body); // put it back so nothing is lost
      toast.error(err?.message || "Couldn't send your message.");
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth?redirect=%2Fmessages" replace />;

  return (
    <div className="h-[calc(100vh-3.5rem)] bg-background">
      <Helmet><title>Chat — EdgeMentor</title></Helmet>

      <div className="max-w-6xl mx-auto h-full px-0 sm:px-6 sm:py-4">
        <div className="h-full flex rounded-none sm:rounded-2xl border-y sm:border border-border bg-card overflow-hidden">

          {/* ---- Conversation list ---- */}
          <aside className={`${activeId ? "hidden md:flex" : "flex"} w-full md:w-[320px] shrink-0 flex-col border-r border-border`}>
            <div className="p-3 border-b border-border space-y-3">
              <div className="flex items-center justify-between">
                <h1 className="font-heading font-semibold text-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" /> Chats
                </h1>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setNewChatOpen(true)}>
                  <PenSquare className="h-3.5 w-3.5 mr-1" /> New
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search chats"
                  className="h-9 pl-8 text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {convosLoading ? (
                <div className="p-6 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/25 mx-auto mb-3" />
                  <p className="text-sm text-foreground font-medium mb-1">
                    {search ? "No matches" : "No chats yet"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {search ? "Try a different search." : "Message a mentor to start a conversation."}
                  </p>
                  {!search && (
                    <Button size="sm" className="mt-4 text-xs" onClick={() => setNewChatOpen(true)}>
                      <PenSquare className="h-3.5 w-3.5 mr-1.5" /> New chat
                    </Button>
                  )}
                </div>
              ) : (
                filtered.map((c) => (
                  <ConversationRow
                    key={c.counterpart_id}
                    convo={c}
                    active={c.counterpart_id === activeId}
                    onSelect={() => selectConversation(c.counterpart_id)}
                  />
                ))
              )}
            </div>
          </aside>

          {/* ---- Thread ---- */}
          <section className={`${activeId ? "flex" : "hidden md:flex"} flex-1 flex-col min-w-0`}>
            {!activeId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="h-7 w-7 text-primary/60" />
                </div>
                <p className="font-heading font-semibold text-foreground">Your messages</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  Pick a conversation on the left, or start a new one with a mentor.
                </p>
              </div>
            ) : (
              <>
                <header className="flex items-center gap-3 p-3 border-b border-border">
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 md:hidden shrink-0"
                    onClick={() => selectConversation("")}
                    aria-label="Back to chats"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={active?.counterpart_avatar || undefined} alt={active?.counterpart_name || ""} />
                    <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                      {initialsOf(active?.counterpart_name || "U")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {active?.counterpart_name || "Conversation"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {thread.length} message{thread.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                  {threadLoading ? (
                    <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
                  ) : thread.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      No messages yet — say hello.
                    </p>
                  ) : (
                    grouped.map((group) => (
                      <div key={group.day} className="space-y-2">
                        <div className="flex justify-center">
                          <span className="rounded-full bg-muted px-3 py-1 text-[10px] text-muted-foreground">
                            {group.day}
                          </span>
                        </div>
                        {group.items.map((m) => (
                          <div key={m.id} className={`flex ${m.from_me ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                                m.from_me
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-muted text-foreground rounded-bl-md"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>
                              <p className={`text-[10px] mt-1 text-right ${m.from_me ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                {format(new Date(m.created_at), "HH:mm")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                  <div ref={bottomRef} />
                </div>

                <div className="border-t border-border p-3 flex items-end gap-2">
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); }
                    }}
                    placeholder="Write a message…  (Enter to send, Shift+Enter for a new line)"
                    maxLength={5000}
                    rows={1}
                    className="min-h-[40px] max-h-32 text-sm resize-none"
                  />
                  <Button
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    disabled={!draft.trim() || sendMessage.isPending}
                    onClick={send}
                    aria-label="Send message"
                  >
                    {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      <NewChatDialog open={newChatOpen} onOpenChange={setNewChatOpen} onStarted={() => setSelectNewest(true)} />
    </div>
  );
};

export default Messages;
