import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import TierBadge from "@/components/TierBadge";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useMentorReviews } from "@/hooks/use-mentors";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Star, Clock, Users, MapPin, TrendingUp, CheckCircle2,
  MessageSquare, Sparkles, Award, Pencil, Save, X, Plus, Trash2,
} from "lucide-react";

interface MentorProfileEditorProps {
  mentor: any;
  onUpdate: (updates: any) => Promise<void>;
  isUpdating: boolean;
  onToggleAvailability: () => void;
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} className={`h-4 w-4 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
    ))}
  </div>
);

const MentorProfileEditor = ({ mentor, onUpdate, isUpdating, onToggleAvailability }: MentorProfileEditorProps) => {
  const { data: reviews = [] } = useMentorReviews(mentor.id);
  const queryClient = useQueryClient();
  const tier = mentor.tier || "verified";

  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState(mentor.bio);
  const [editFullBio, setEditFullBio] = useState(mentor.full_bio);
  const [editPrice, setEditPrice] = useState(String(mentor.monthly_price));
  const [editHighlights, setEditHighlights] = useState<string[]>([...mentor.highlights]);
  const [newHighlight, setNewHighlight] = useState("");


  const startEditing = () => {
    setEditBio(mentor.bio);
    setEditFullBio(mentor.full_bio);
    setEditPrice(String(mentor.monthly_price));
    setEditHighlights([...mentor.highlights]);
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      await onUpdate({
        bio: editBio,
        full_bio: editFullBio,
        monthly_price: parseInt(editPrice, 10),
        highlights: editHighlights.filter(Boolean),
      });
      setEditing(false);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile.");
    }
  };


  const addHighlight = () => {
    if (newHighlight.trim()) {
      setEditHighlights([...editHighlights, newHighlight.trim()]);
      setNewHighlight("");
    }
  };

  const removeHighlight = (idx: number) => {
    setEditHighlights(editHighlights.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5">
        <div className="flex items-center gap-3">
          <Switch
            checked={mentor.available}
            onCheckedChange={onToggleAvailability}
            disabled={isUpdating}
          />
          <span className="text-sm font-medium text-foreground">
            {mentor.available ? "Accepting students" : "Hidden from listing"}
          </span>
        </div>
        {!editing ? (
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={startEditing}>
            <Pencil className="h-3 w-3 mr-1" /> Edit Profile
          </Button>
        ) : (
          <div className="flex gap-1.5">
            <Button size="sm" className="text-xs h-8" onClick={handleSave} disabled={isUpdating}>
              <Save className="h-3 w-3 mr-1" /> Save Changes
            </Button>
            <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => setEditing(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>


      {/* Main Card — mirrors public profile */}
      <div className="relative rounded-2xl border border-border bg-card p-6 sm:p-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pink-400/[0.08] to-transparent rounded-bl-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/[0.06] to-transparent rounded-tr-full pointer-events-none" />

        {/* Avatar & Info */}
        <div className="flex items-start gap-5 mb-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 via-pink-400/10 to-primary/5 text-primary font-heading font-bold text-xl shadow-lg shadow-primary/10">
            {mentor.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-heading text-2xl font-bold text-foreground">{mentor.name}</h1>
              <TierBadge tier={tier} size="md" showLabel={false} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <TierBadge tier={tier} size="sm" />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{mentor.experience}</span>
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{mentor.students} students</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{mentor.session} session</span>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <StarRating rating={Math.round(mentor.rating)} />
              <span className="text-sm font-semibold text-foreground">{mentor.rating}</span>
              <span className="text-xs text-muted-foreground">({reviews.length} reviews)</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {mentor.instruments.map((i: string) => (
            <span key={i} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary">{i}</span>
          ))}
          {mentor.concepts.map((c: string) => (
            <span key={c} className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">{c}</span>
          ))}
        </div>

        {/* Bio — editable */}
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Short Bio</label>
              <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={2} className="bg-muted border-border text-sm resize-none" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Full Bio</label>
              <Textarea value={editFullBio} onChange={(e) => setEditFullBio(e.target.value)} rows={4} className="bg-muted border-border text-sm resize-none" />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed">{mentor.full_bio}</p>
        )}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Students", value: mentor.students, icon: Users, color: "text-primary bg-primary/10" },
          { label: "Rating", value: mentor.rating, icon: Star, color: "text-amber-400 bg-amber-400/10" },
          { label: "Experience", value: mentor.experience, icon: Award, color: "text-pink-400 bg-pink-400/10" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-card p-4 text-center">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.color} mx-auto mb-2`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <p className="font-heading text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* What's Included — editable */}
      <div className="relative rounded-2xl border border-border bg-card p-6 sm:p-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-pink-400/[0.06] to-transparent rounded-bl-full pointer-events-none" />
        <h2 className="font-heading text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" /> What's Included
        </h2>

        {editing ? (
          <div className="space-y-3">
            {editHighlights.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <Input
                  value={h}
                  onChange={(e) => {
                    const updated = [...editHighlights];
                    updated[i] = e.target.value;
                    setEditHighlights(updated);
                  }}
                  className="bg-muted border-border text-sm flex-1"
                />
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => removeHighlight(i)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-muted-foreground shrink-0" />
              <Input
                placeholder="Add a highlight…"
                value={newHighlight}
                onChange={(e) => setNewHighlight(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addHighlight()}
                className="bg-muted border-border text-sm flex-1"
              />
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={addHighlight} disabled={!newHighlight.trim()}>
                Add
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mentor.highlights.map((h: string) => (
              <div key={h} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-foreground">{h}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Price — editable */}
      {editing && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <label className="text-[11px] font-medium text-muted-foreground mb-2 block">Monthly Price (USD)</label>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-heading font-bold text-foreground">$</span>
            <Input
              type="number"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              className="bg-muted border-border text-lg font-heading font-bold w-32"
            />
            <span className="text-sm text-muted-foreground">/month</span>
          </div>
        </div>
      )}

      {/* Reviews — read-only */}
      <div className="relative rounded-2xl border border-border bg-card p-6 sm:p-8 overflow-hidden">
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-pink-400/[0.06] to-transparent rounded-tr-full pointer-events-none" />
        <h2 className="font-heading text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" /> Reviews
          <span className="text-sm font-normal text-muted-foreground">({reviews.length})</span>
        </h2>
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {reviews.map((review: any, idx: number) => (
              <div key={review.id} className={idx < reviews.length - 1 ? "pb-5 border-b border-border" : ""}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/10 to-pink-400/10 flex items-center justify-center text-[10px] font-bold text-primary">
                      {review.reviewer_name.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <span className="text-sm font-medium text-foreground">{review.reviewer_name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{review.review_date}</span>
                </div>
                <StarRating rating={review.rating} />
                <p className="text-sm text-muted-foreground leading-relaxed mt-2">{review.review_text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscribe bar preview (non-interactive) */}
      <div className="rounded-2xl border border-border/80 bg-card/95 p-5 flex items-center justify-between">
        <div>
          <span className="font-heading text-3xl font-bold text-foreground">
            ${editing ? editPrice || mentor.monthly_price : mentor.monthly_price}
          </span>
          <span className="text-sm text-muted-foreground">/month</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-12 w-12 border-pink-400/20" disabled>
            <span className="h-5 w-5 text-muted-foreground">♡</span>
          </Button>
          <Button variant="glow" className="h-12 px-8 font-semibold text-base shadow-xl shadow-primary/25" disabled>
            Subscribe Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MentorProfileEditor;
