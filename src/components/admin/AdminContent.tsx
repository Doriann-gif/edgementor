import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { safeExternalUrl } from "@/lib/safeUrl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Video, Link2, MessageCircle, Calendar, BookOpen,
  Plus, Trash2, ExternalLink, Crown,
} from "lucide-react";
import { toast } from "sonner";

const CONTENT_TYPES = [
  { value: "video", label: "Video", icon: Video },
  { value: "link", label: "Link", icon: Link2 },
  { value: "discord", label: "Discord", icon: MessageCircle },
  { value: "call", label: "Call", icon: Calendar },
  { value: "resource", label: "Resource", icon: BookOpen },
];

const TYPE_COLORS: Record<string, string> = {
  video: "text-red-400 bg-red-400/10",
  link: "text-blue-400 bg-blue-400/10",
  discord: "text-indigo-400 bg-indigo-400/10",
  call: "text-amber-400 bg-amber-400/10",
  resource: "text-primary bg-primary/10",
};

interface Mentor {
  id: string;
  name: string;
}

interface ContentItem {
  id: string;
  mentor_id: string;
  title: string;
  description: string;
  content_type: string;
  content_url: string;
  display_order: number;
  created_at: string;
}

const AdminContent = () => {
  const queryClient = useQueryClient();
  const [selectedMentor, setSelectedMentor] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState("link");
  const [contentUrl, setContentUrl] = useState("");

  // Fetch all approved mentors
  const { data: mentors = [] } = useQuery({
    queryKey: ["admin-mentors-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentors")
        .select("id, name")
        .eq("status", "approved")
        .order("name");
      if (error) throw error;
      return data as Mentor[];
    },
  });

  // Fetch content for selected mentor
  const { data: content = [], isLoading } = useQuery({
    queryKey: ["admin-mentor-content", selectedMentor],
    queryFn: async () => {
      if (!selectedMentor) return [];
      const { data, error } = await supabase
        .from("mentor_content")
        .select("*")
        .eq("mentor_id", selectedMentor)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as ContentItem[];
    },
    enabled: !!selectedMentor,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("mentor_content").insert({
        mentor_id: selectedMentor,
        title,
        description,
        content_type: contentType,
        content_url: contentUrl,
        display_order: content.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-mentor-content", selectedMentor] });
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
      queryClient.invalidateQueries({ queryKey: ["admin-mentor-content", selectedMentor] });
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

  const selectedMentorName = mentors.find((m) => m.id === selectedMentor)?.name;

  return (
    <div>
      {/* Mentor Selector */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 max-w-xs">
          <Label className="text-xs mb-1.5 block">Select Mentor</Label>
          <Select value={selectedMentor} onValueChange={setSelectedMentor}>
            <SelectTrigger className="bg-muted border-border text-sm">
              <SelectValue placeholder="Choose a mentor..." />
            </SelectTrigger>
            <SelectContent>
              {mentors.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedMentor && (
          <Button size="sm" className="text-xs mt-5" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Content
          </Button>
        )}
      </div>

      {!selectedMentor ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <Crown className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Select a mentor to manage their exclusive content.</p>
        </div>
      ) : (
        <>
          {/* Add content form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="rounded-2xl border border-primary/20 bg-card p-5 mb-6 space-y-4">
              <h3 className="font-heading font-semibold text-sm text-foreground">
                Add content for {selectedMentorName}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Title</Label>
                  <Input placeholder="e.g. Discord Server" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-muted border-border text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Type</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger className="bg-muted border-border text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">URL</Label>
                  <Input placeholder="https://..." value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} className="bg-muted border-border text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Description (optional)</Label>
                <Textarea placeholder="Brief description..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="bg-muted border-border text-sm resize-none" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="text-xs" disabled={addMutation.isPending}>
                  {addMutation.isPending ? "Adding..." : "Add"}
                </Button>
                <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          )}

          {/* Content table */}
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : content.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">No content for {selectedMentorName} yet.</p>
              <p className="text-xs text-muted-foreground">Click "Add Content" to create exclusive resources.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {content.map((item) => {
                    const typeInfo = CONTENT_TYPES.find((t) => t.value === item.content_type);
                    const Icon = typeInfo?.icon || Link2;
                    const colorClass = TYPE_COLORS[item.content_type] || "text-primary bg-primary/10";
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-sm">{item.title}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <Icon className="h-3 w-3" /> {typeInfo?.label || item.content_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <a href={safeExternalUrl(item.content_url) ?? undefined} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs inline-flex items-center gap-1">
                            Open <ExternalLink className="h-3 w-3" />
                          </a>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {item.description || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[11px] text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate(item.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3 mr-1" /> Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminContent;
