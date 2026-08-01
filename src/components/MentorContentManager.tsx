import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { safeExternalUrl } from "@/lib/safeUrl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Plus, Trash2, ExternalLink, Upload, Pencil, ArrowUp, ArrowDown,
  Check, ArrowLeft, Eye, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { CONTENT_TYPES, CONTENT_SECTION_ORDER, getContentType } from "@/lib/content-types";

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

interface MentorContentManagerProps {
  mentorId: string;
}

// Guided posting flow: pick what you're sharing first (big visual cards),
// then fill a short type-specific form. The list mirrors the sections
// students see on their content page.
const MentorContentManager = ({ mentorId }: MentorContentManagerProps) => {
  const queryClient = useQueryClient();
  // view: "list" | "pick" | "form"
  const [view, setView] = useState<"list" | "pick" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState("link");
  const [contentUrl, setContentUrl] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const contentFileRef = useRef<HTMLInputElement>(null);

  const typeDef = getContentType(contentType);

  const resetForm = () => {
    setTitle(""); setDescription(""); setContentType("link"); setContentUrl("");
    setEditingId(null); setView("list");
  };

  const openTypeForm = (type: string) => {
    setContentType(type);
    setEditingId(null);
    setTitle("");
    setDescription("");
    setContentUrl("");
    setView("form");
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File too large. Max 50MB.");
      return;
    }
    setUploadingFile(true);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${mentorId}/${fileName}`;
      const { error } = await supabase.storage
        .from("mentor-content")
        .upload(filePath, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from("mentor-content")
        .getPublicUrl(filePath);
      setContentUrl(publicUrl);
      if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
      toast.success("File uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed.");
    } finally {
      setUploadingFile(false);
    }
  };

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

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const { error } = await supabase.from("mentor_content").update({
          title, description, content_type: contentType, content_url: contentUrl,
        }).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("mentor_content").insert({
          mentor_id: mentorId, title, description, content_type: contentType,
          content_url: contentUrl, display_order: content.length,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentor-content", mentorId] });
      toast.success(editingId ? "Content updated!" : "Posted! Your subscribers can see it now.");
      resetForm();
    },
    onError: () => toast.error("Failed to save content."),
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

  // Reorder within a section by swapping display_order with the neighbour
  const reorderMutation = useMutation({
    mutationFn: async ({ a, b }: { a: MentorContentItem; b: MentorContentItem }) => {
      const [r1, r2] = await Promise.all([
        supabase.from("mentor_content").update({ display_order: b.display_order }).eq("id", a.id),
        supabase.from("mentor_content").update({ display_order: a.display_order }).eq("id", b.id),
      ]);
      if (r1.error) throw r1.error;
      if (r2.error) throw r2.error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mentor-content", mentorId] }),
    onError: () => toast.error("Failed to reorder."),
  });

  const startEdit = (item: MentorContentItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description || "");
    setContentType(item.content_type);
    setContentUrl(item.content_url);
    setView("form");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !contentUrl.trim()) {
      toast.error(typeDef.allowUpload ? "Title and a link or file are required." : "Title and link are required.");
      return;
    }
    saveMutation.mutate();
  };

  // Group content into the same sections students see
  const grouped = CONTENT_SECTION_ORDER
    .map((type) => ({ type, def: getContentType(type), items: content.filter((c) => (c.content_type || "link") === type) }))
    .filter((g) => g.items.length > 0);

  return (
    <div>
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-semibold text-foreground">Your Content Hub</h2>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <Eye className="h-3 w-3" />
            Subscribers see everything below, grouped exactly like this.
          </p>
        </div>
        {view === "list" && (
          <Button size="sm" className="text-xs font-semibold" onClick={() => setView("pick")}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Post Content
          </Button>
        )}
      </div>

      {/* ===== STEP 1: TYPE PICKER ===== */}
      {view === "pick" && (
        <div className="rounded-2xl border border-primary/20 bg-card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-foreground">What are you sharing?</p>
            <Button variant="ghost" size="sm" className="text-xs h-8" onClick={resetForm}>Cancel</Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CONTENT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => openTypeForm(t.value)}
                className="group rounded-xl border border-border bg-muted/30 p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5 hover:-translate-y-0.5"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg mb-2.5 ${t.color}`}>
                  <t.icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{t.label}</p>
                <p className="text-[11px] text-muted-foreground leading-snug mt-1">{t.hint}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== STEP 2: FOCUSED FORM ===== */}
      {view === "form" && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-primary/20 bg-card p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {!editingId && (
                <button type="button" onClick={() => setView("pick")} className="text-muted-foreground hover:text-foreground" aria-label="Back to type picker">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${typeDef.color}`}>
                <typeDef.icon className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                {editingId ? `Edit ${typeDef.label}` : `Add ${/^[AEIOU]/i.test(typeDef.label) ? "an" : "a"} ${typeDef.label}`}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" className="text-xs h-8" onClick={resetForm}>Cancel</Button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Title</Label>
            <Input
              placeholder={typeDef.titlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-muted border-border text-sm"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">{typeDef.urlLabel}</Label>
            <div className="flex gap-2">
              <Input
                placeholder={typeDef.urlPlaceholder}
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                className="bg-muted border-border text-sm flex-1"
              />
              {typeDef.allowUpload && (
                <Button type="button" variant="outline" size="sm" className="text-xs shrink-0 h-10" onClick={() => contentFileRef.current?.click()} disabled={uploadingFile}>
                  <Upload className="h-3.5 w-3.5 mr-1" /> {uploadingFile ? "Uploading…" : "Upload"}
                </Button>
              )}
              <input ref={contentFileRef} type="file" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
                e.target.value = '';
              }} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Description <span className="text-muted-foreground/60 font-normal">(optional)</span></Label>
            <Textarea
              placeholder="One line about what this is…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="bg-muted border-border text-sm resize-none"
            />
          </div>

          <Button type="submit" size="sm" className="text-xs font-semibold" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving…" : editingId ? (<><Check className="h-3.5 w-3.5 mr-1" /> Save Changes</>) : (<><Plus className="h-3.5 w-3.5 mr-1" /> Post to Subscribers</>)}
          </Button>
        </form>
      )}

      {/* ===== CONTENT LIST — sectioned like the student page ===== */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading content…</p>
      ) : content.length === 0 && view === "list" ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
          <Sparkles className="h-8 w-8 text-primary/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Nothing posted yet</p>
          <p className="text-xs text-muted-foreground mb-5 max-w-sm mx-auto">
            Most mentors start with these three — takes about two minutes:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
            {["discord", "video", "file"].map((v) => {
              const t = getContentType(v);
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => openTypeForm(v)}
                  className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:-translate-y-0.5"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg mx-auto mb-2 ${t.color}`}>
                    <t.icon className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    {v === "discord" ? "Post your Discord invite" : v === "video" ? "Add your first video" : "Share a PDF guide"}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ type, def, items }) => (
            <div key={type}>
              <div className="flex items-center gap-2 mb-2.5">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${def.color}`}>
                  <def.icon className="h-3.5 w-3.5" />
                </div>
                <h3 className="font-heading text-sm font-semibold text-foreground">{def.sectionLabel}</h3>
                <span className="text-xs text-muted-foreground">({items.length})</span>
              </div>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 group">
                    <div className="flex flex-col shrink-0 -my-1">
                      <button
                        onClick={() => reorderMutation.mutate({ a: items[idx], b: items[idx - 1] })}
                        disabled={idx === 0 || reorderMutation.isPending}
                        className="text-muted-foreground/50 hover:text-foreground disabled:opacity-20 disabled:hover:text-muted-foreground/50"
                        aria-label="Move up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => reorderMutation.mutate({ a: items[idx], b: items[idx + 1] })}
                        disabled={idx === items.length - 1 || reorderMutation.isPending}
                        className="text-muted-foreground/50 hover:text-foreground disabled:opacity-20 disabled:hover:text-muted-foreground/50"
                        aria-label="Move down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground truncate">{item.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.description && <span className="text-[10px] text-muted-foreground truncate max-w-[240px]">{item.description}</span>}
                        {item.content_url && (
                          <a
                            href={safeExternalUrl(item.content_url) ?? undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5 shrink-0"
                          >
                            Open <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => startEdit(item)}
                        aria-label="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(item.id)}
                        disabled={deleteMutation.isPending}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentorContentManager;
