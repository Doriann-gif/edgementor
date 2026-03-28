import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Video, Link2, MessageCircle, Calendar, BookOpen,
  Plus, Trash2, ExternalLink, GripVertical,
} from "lucide-react";
import { toast } from "sonner";

interface MentorContentItem {
  id: string;
  mentor_id: string;
  title: string;
  description: string;
  content_type: string;
  content_url: string;
  display_order: number;
  created_at: string;
}

const CONTENT_TYPES = [
  { value: "video", label: "Video / Recording", icon: Video },
  { value: "link", label: "Resource / Link", icon: Link2 },
  { value: "discord", label: "Discord / Community", icon: MessageCircle },
  { value: "call", label: "Scheduled Call", icon: Calendar },
  { value: "resource", label: "Course Material", icon: BookOpen },
];

const TYPE_COLORS: Record<string, string> = {
  video: "text-red-400 bg-red-400/10",
  link: "text-blue-400 bg-blue-400/10",
  discord: "text-indigo-400 bg-indigo-400/10",
  call: "text-amber-400 bg-amber-400/10",
  resource: "text-primary bg-primary/10",
};

interface MentorContentManagerProps {
  mentorId: string;
}

const MentorContentManager = ({ mentorId }: MentorContentManagerProps) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState("link");
  const [contentUrl, setContentUrl] = useState("");

  const { data: content = [], isLoading } = useQuery({
    queryKey: ["mentor-content", mentorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentor_content")
        .select("*")
        .eq("mentor_id", mentorId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as MentorContentItem[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("mentor_content").insert({
        mentor_id: mentorId,
        title,
        description,
        content_type: contentType,
        content_url: contentUrl,
        display_order: content.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentor-content", mentorId] });
      toast.success("Content added!");
      setTitle("");
      setDescription("");
      setContentType("link");
      setContentUrl("");
      setShowForm(false);
    },
    onError: () => toast.error("Failed to add content."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mentor_content").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentor-content", mentorId] });
      toast.success("Content removed.");
    },
    onError: () => toast.error("Failed to delete content."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !contentUrl.trim()) {
      toast.error("Title and URL are required.");
      return;
    }
    addMutation.mutate();
  };

  const getTypeInfo = (type: string) => {
    return CONTENT_TYPES.find((t) => t.value === type) || CONTENT_TYPES[1];
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-semibold text-foreground">Exclusive Content</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Add videos, links, discord invites, and more for your subscribers.</p>
        </div>
        {!showForm && (
          <Button size="sm" className="text-xs" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Content
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-primary/20 bg-card p-5 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Title</Label>
              <Input
                placeholder="e.g. Discord Server Invite"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-muted border-border text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Content Type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger className="bg-muted border-border text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">
                        <t.icon className="h-3.5 w-3.5" /> {t.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">URL</Label>
            <Input
              placeholder="https://..."
              value={contentUrl}
              onChange={(e) => setContentUrl(e.target.value)}
              className="bg-muted border-border text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Description (optional)</Label>
            <Textarea
              placeholder="Brief description of what this content is about..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="bg-muted border-border text-sm resize-none"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="text-xs" disabled={addMutation.isPending}>
              {addMutation.isPending ? "Adding..." : "Add Content"}
            </Button>
            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading content...</p>
      ) : content.length === 0 && !showForm ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-1">No exclusive content yet.</p>
          <p className="text-xs text-muted-foreground">Add videos, discord links, call schedules, and resources for your subscribers.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {content.map((item) => {
            const typeInfo = getTypeInfo(item.content_type);
            const Icon = typeInfo.icon;
            const colorClass = TYPE_COLORS[item.content_type] || "text-primary bg-primary/10";

            return (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 group">
                <GripVertical className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground truncate">{item.title}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground capitalize">{typeInfo.label}</span>
                    {item.content_url && (
                      <a
                        href={item.content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5"
                      >
                        Open <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  onClick={() => deleteMutation.mutate(item.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MentorContentManager;
