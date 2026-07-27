import { useState, useEffect, useRef } from "react";
import { Navigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMyMentorProfile } from "@/hooks/use-mentor-dashboard";
import { useMentorContent } from "@/hooks/use-mentor-content";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TwoFactorSettings from "@/components/TwoFactorSettings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { COUNTRIES, TIMEZONES, TRADING_MARKETS } from "@/lib/profile-options";
import {
  ArrowLeft, User, Lock, Bell, CreditCard, Trash2, Save, LogOut,
  Camera, Upload, BookOpen, Plus, GripVertical, Pencil, Trash, X,
  Shield, CalendarDays, Star, Award, CheckCircle2, Mail, Sparkles,
  Eye, EyeOff, BadgeCheck, Activity, Palette, ShieldCheck, Moon, Sun, Monitor,
  Clock, TrendingUp, Download, Globe, Heart, Loader2, ChevronsUpDown, Check,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const AccountSettings = () => {
  const { user, loading: authLoading, signOut, isMentor } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "profile";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [connectLoading, setConnectLoading] = useState(false);

  // Profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["my-profile"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Mentor profile
  const { data: mentorProfile } = useMyMentorProfile();
  const { data: mentorContent = [], isLoading: contentLoading } = useMentorContent(mentorProfile?.id);

  // Subscriptions
  const { data: subscriptions = [] } = useQuery({
    queryKey: ["my-subscriptions-history"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, mentors(name, monthly_price)")
        .eq("user_id", user!.id)
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Connect balance for mentors
  const { data: connectBalance } = useQuery({
    queryKey: ["connect-balance"],
    enabled: !!user && !!isMentor,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("connect-balance");
      if (error) throw error;
      return data as {
        onboarded: boolean;
        available: number;
        pending: number;
        total_earned: number;
        payouts_enabled: boolean;
        auto_payout: boolean;
      };
    },
  });

  // Saved mentors count
  const { data: savedCount = 0 } = useQuery({
    queryKey: ["saved-mentors-count"],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("saved_mentors")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      if (error) throw error;
      return count || 0;
    },
  });

  // Messages count
  const { data: messageStats = { total: 0, unread: 0 } } = useQuery({
    queryKey: ["message-stats"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, is_read")
        .eq("recipient_id", user!.id);
      if (error) throw error;
      const total = data?.length || 0;
      const unread = data?.filter((m) => !m.is_read).length || 0;
      return { total, unread };
    },
  });

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [country, setCountry] = useState("");
  const [age, setAge] = useState("");
  const [tradingExperience, setTradingExperience] = useState("");
  const [bio, setBio] = useState("");
  const [timezone, setTimezone] = useState("");
  const [tradingInterests, setTradingInterests] = useState<string[]>([]);
  const [countryOpen, setCountryOpen] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [uploading, setUploading] = useState(false);
  const [bannerColor, setBannerColor] = useState("");
  const [showBannerPicker, setShowBannerPicker] = useState(false);

  // Content editing state
  const [editingContent, setEditingContent] = useState<any | null>(null);
  const [newContent, setNewContent] = useState({ title: "", description: "", content_type: "link", content_url: "" });
  const [showAddContent, setShowAddContent] = useState(false);
  const [savingContent, setSavingContent] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const contentFileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  const uploadContentFile = async (file: File): Promise<string> => {
    if (!mentorProfile) throw new Error("No mentor profile");
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${mentorProfile.id}/${fileName}`;
    const { error } = await supabase.storage.from("mentor-content").upload(filePath, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from("mentor-content").getPublicUrl(filePath);
    return publicUrl;
  };

  const handleContentFileUpload = async (file: File, target: 'new' | 'edit') => {
    if (file.size > 50 * 1024 * 1024) { toast.error("File too large. Max 50MB."); return; }
    setUploadingFile(true);
    try {
      const url = await uploadContentFile(file);
      if (target === 'new') setNewContent(prev => ({ ...prev, content_url: url }));
      else if (editingContent) setEditingContent((prev: any) => ({ ...prev, content_url: url }));
      toast.success("File uploaded!");
    } catch (err: any) { toast.error(err.message || "Upload failed."); }
    finally { setUploadingFile(false); }
  };

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setAvatarUrl(profile.avatar_url || "");
      setCountry((profile as any).country || "");
      setAge((profile as any).age ? String((profile as any).age) : "");
      setTradingExperience((profile as any).trading_experience || "");
      setBio((profile as any).bio || "");
      setTimezone((profile as any).timezone || "");
      setTradingInterests((profile as any).trading_interests || []);
      setEmailNotifications(profile.email_notifications ?? true);
      setMarketingEmails(profile.marketing_emails ?? false);
    }
  }, [profile]);

  useEffect(() => {
    if (mentorProfile) {
      setBannerColor((mentorProfile as any).banner_color || "#6d28d9");
    }
  }, [mentorProfile]);

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const url = `${publicUrl}?t=${Date.now()}`;
      setAvatarUrl(url);
      await supabase.from("profiles").update({ avatar_url: url, updated_at: new Date().toISOString() }).eq("id", user.id);
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Profile picture updated!");
    } catch (err: any) { toast.error(err.message || "Failed to upload avatar."); }
    finally { setUploading(false); }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({
        display_name: displayName, avatar_url: avatarUrl || null,
        country: country || null,
        age: age ? parseInt(age, 10) : null,
        trading_experience: tradingExperience || null,
        bio: bio.trim() || null,
        timezone: timezone || null,
        trading_interests: tradingInterests,
        email_notifications: emailNotifications, marketing_emails: marketingEmails,
        updated_at: new Date().toISOString(),
      } as any).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["my-profile"] }); toast.success("Profile updated!"); },
    onError: () => toast.error("Failed to update profile."),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) throw new Error("Passwords don't match.");
      if (newPassword.length < 8) throw new Error("Password must be at least 8 characters.");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    onSuccess: () => { setNewPassword(""); setConfirmPassword(""); toast.success("Password updated!"); },
    onError: (err: any) => toast.error(err.message || "Failed to change password."),
  });

  const changeEmailMutation = useMutation({
    mutationFn: async () => {
      const email = newEmail.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
      if (email === user!.email?.toLowerCase()) throw new Error("That's already your email.");
      // Supabase sends a confirmation link to the NEW address; the change
      // only takes effect once that link is clicked.
      const { error } = await supabase.auth.updateUser(
        { email },
        { emailRedirectTo: `${window.location.origin}/settings` }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      setNewEmail("");
      toast.success("Confirmation sent — check your new inbox to finish the change.");
    },
    onError: (err: any) => toast.error(err.message || "Failed to update email."),
  });

  // Mentors can pause/resume taking new students (mentors.available).
  // Not blocked by the protect_mentor_columns trigger.
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async (next: boolean) => {
      if (!mentorProfile) throw new Error("No mentor profile");
      const { error } = await supabase.from("mentors").update({ available: next }).eq("id", mentorProfile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-mentor-profile"] });
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
      toast.success("Availability updated.");
    },
    onError: (err: any) => toast.error(err.message || "Failed to update availability."),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: async () => {
      toast.success("Your account and all data have been permanently deleted.");
      await supabase.auth.signOut();
      window.location.href = "/";
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete account. Please contact support."),
  });

  const addContent = async () => {
    if (!mentorProfile || !newContent.title.trim()) return;
    setSavingContent(true);
    try {
      const { error } = await supabase.from("mentor_content").insert({
        mentor_id: mentorProfile.id, title: newContent.title, description: newContent.description,
        content_type: newContent.content_type, content_url: newContent.content_url, display_order: mentorContent.length,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["mentor-content"] });
      setNewContent({ title: "", description: "", content_type: "link", content_url: "" });
      setShowAddContent(false);
      toast.success("Content added!");
    } catch (err: any) { toast.error(err.message || "Failed to add content."); }
    finally { setSavingContent(false); }
  };

  const updateContent = async () => {
    if (!editingContent) return;
    setSavingContent(true);
    try {
      const { error } = await supabase.from("mentor_content").update({
        title: editingContent.title, description: editingContent.description,
        content_type: editingContent.content_type, content_url: editingContent.content_url,
      }).eq("id", editingContent.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["mentor-content"] });
      setEditingContent(null);
      toast.success("Content updated!");
    } catch (err: any) { toast.error(err.message || "Failed to update content."); }
    finally { setSavingContent(false); }
  };

  const deleteContent = async (id: string) => {
    if (!window.confirm("Delete this content item?")) return;
    try {
      const { error } = await supabase.from("mentor_content").delete().eq("id", id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["mentor-content"] });
      toast.success("Content deleted.");
    } catch (err: any) { toast.error(err.message || "Failed to delete."); }
  };

  if (authLoading || profileLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm">Loading...</p></div>;
  }
  if (!user) return <Navigate to="/auth" replace />;

  const initials = (displayName || user.email || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const memberSince = user.created_at ? new Date(user.created_at) : new Date();
  const daysSinceJoin = Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24));
  const activeSubCount = subscriptions.filter((s: any) => s.status === "active").length;

  // Profile completeness
  const profileFields = [displayName, avatarUrl, country, age, tradingExperience, bio, timezone, tradingInterests.length > 0];
  const completeness = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Account Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
          </div>
          <Button variant="outline" size="sm" className="text-xs" onClick={signOut}>
            <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign Out
          </Button>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="bg-secondary border border-border rounded-xl p-1 h-auto flex-wrap">
            <TabsTrigger value="profile" className="rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:text-foreground px-4 py-2">
              <User className="h-3.5 w-3.5 mr-1.5" /> Profile
            </TabsTrigger>
            <TabsTrigger value="password" className="rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:text-foreground px-4 py-2">
              <Lock className="h-3.5 w-3.5 mr-1.5" /> Password
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:text-foreground px-4 py-2">
              <Bell className="h-3.5 w-3.5 mr-1.5" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="billing" className="rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:text-foreground px-4 py-2">
              <CreditCard className="h-3.5 w-3.5 mr-1.5" /> Billing
            </TabsTrigger>
            <TabsTrigger value="appearance" className="rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:text-foreground px-4 py-2">
              <Palette className="h-3.5 w-3.5 mr-1.5" /> Appearance
            </TabsTrigger>
            <TabsTrigger value="activity" className="rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:text-foreground px-4 py-2">
              <Activity className="h-3.5 w-3.5 mr-1.5" /> Activity
            </TabsTrigger>
            <TabsTrigger value="privacy" className="rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:text-foreground px-4 py-2">
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Privacy
            </TabsTrigger>
            {mentorProfile && (
              <TabsTrigger value="content" className="rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:text-foreground px-4 py-2">
                <BookOpen className="h-3.5 w-3.5 mr-1.5" /> My Content
              </TabsTrigger>
            )}
          </TabsList>

          {/* ──────────── PROFILE TAB ──────────── */}
          <TabsContent value="profile" className="space-y-6">
            {/* Profile Hero Card */}
            <motion.div
              variants={fadeIn} initial="hidden" animate="show" custom={0}
              className="relative rounded-2xl border border-border bg-card overflow-hidden"
            >
              {/* Banner */}
              <div
                className={`h-24 sm:h-28 relative group/banner ${isMentor ? "cursor-pointer" : ""}`}
                style={isMentor && bannerColor ? { background: bannerColor } : undefined}
                onClick={() => isMentor && setShowBannerPicker(!showBannerPicker)}
              >
                {!isMentor && (
                  <div className="absolute inset-0 bg-gradient-to-r from-muted via-card to-muted" />
                )}
                {isMentor && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-black/40 backdrop-blur-sm px-2.5 py-1 opacity-0 group-hover/banner:opacity-100 transition-opacity">
                      <Palette className="h-3 w-3 text-white" />
                      <span className="text-[11px] text-white font-medium">Change banner</span>
                    </div>
                  </>
                )}
                {isMentor && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-md bg-black/30 backdrop-blur-sm border border-white/15 px-2.5 py-1">
                    <BadgeCheck className="h-3.5 w-3.5 text-white" />
                    <span className="text-[11px] font-semibold text-white">Verified Mentor</span>
                  </div>
                )}
              </div>

              {/* Banner Color Picker */}
              <AnimatePresence>
                {showBannerPicker && isMentor && mentorProfile && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-b border-border"
                  >
                    <div className="px-6 py-4 flex flex-col gap-3">
                      <Label className="text-xs font-medium text-muted-foreground">Banner Color</Label>
                      {/* Hue slider */}
                      <input
                        type="range" min={0} max={360} value={parseInt(bannerColor.replace(/[^\d]/g, '') || '270')}
                        onChange={(e) => {
                          const h = Number(e.target.value);
                          setBannerColor(`hsl(${h}, 60%, 30%)`);
                        }}
                        className="w-full h-3 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, hsl(0,60%,30%), hsl(60,60%,30%), hsl(120,60%,30%), hsl(180,60%,30%), hsl(240,60%,30%), hsl(300,60%,30%), hsl(360,60%,30%))`,
                        }}
                      />
                      {/* Grayscale presets */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground mr-1">Neutrals</span>
                        {["#ffffff", "#e5e5e5", "#a3a3a3", "#737373", "#525252", "#404040", "#262626", "#171717", "#000000"].map((c) => (
                          <button
                            key={c}
                            onClick={(ev) => { ev.stopPropagation(); setBannerColor(c); }}
                            className={`h-6 w-6 rounded-md border transition-transform hover:scale-110 ${bannerColor === c ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : "border-border"}`}
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                      {/* Preview & Save */}
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg border border-border" style={{ background: bannerColor }} />
                        <Button
                          size="sm" variant="outline" className="text-xs"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const { error } = await supabase.from("mentors").update({ banner_color: bannerColor }).eq("id", mentorProfile.id);
                            if (error) { toast.error("Failed to save banner color."); return; }
                            queryClient.invalidateQueries({ queryKey: ["my-mentor-profile"] });
                            setShowBannerPicker(false);
                            toast.success("Banner color saved!");
                          }}
                        >
                          <Save className="h-3 w-3 mr-1" /> Save
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="px-6 pb-6 -mt-12 sm:-mt-14">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  {/* Avatar */}
                  <div className="relative group shrink-0">
                    <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center border-4 border-card shadow-xl">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-primary font-heading font-bold text-2xl">{initials}</span>
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center cursor-pointer"
                    >
                      <Camera className="h-6 w-6 text-white" />
                    </button>
                    <input
                      ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) { toast.error("File too large. Max 5MB."); return; }
                          uploadAvatar(file);
                        }
                      }}
                    />
                  </div>

                  {/* Name & Meta */}
                  <div className="flex-1 min-w-0 pb-1">
                    <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground truncate">
                      {displayName || "Set your name"}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-muted-foreground">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Mail className="h-3 w-3" /> {user.email}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs">
                        <CalendarDays className="h-3 w-3" /> Joined {memberSince.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>

                  {/* Upload button */}
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      <Upload className="h-3.5 w-3.5 mr-1.5" /> {uploading ? "Uploading..." : "Change Photo"}
                    </Button>
                    {avatarUrl && (
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => {
                        setAvatarUrl("");
                        supabase.from("profiles").update({ avatar_url: null, updated_at: new Date().toISOString() }).eq("id", user.id).then(() => {
                          queryClient.invalidateQueries({ queryKey: ["my-profile"] });
                          toast.success("Profile picture removed.");
                        });
                      }}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div variants={fadeIn} initial="hidden" animate="show" custom={1} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Days Active", value: daysSinceJoin, icon: CalendarDays, color: "text-blue-400 bg-blue-400/10" },
                { label: "Active Subs", value: activeSubCount, icon: Star, color: "text-amber-400 bg-amber-400/10" },
                { label: "Saved Mentors", value: savedCount, icon: Award, color: "text-pink-400 bg-pink-400/10" },
                { label: "Messages", value: messageStats.total, icon: Mail, color: messageStats.unread > 0 ? "text-primary bg-primary/10" : "text-muted-foreground bg-muted" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-border bg-card p-4 hover:border-border/80 transition-colors">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.color} mb-2.5`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                  <p className="font-heading text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
                  {stat.label === "Messages" && messageStats.unread > 0 && (
                    <span className="inline-block mt-1 text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                      {messageStats.unread} unread
                    </span>
                  )}
                </div>
              ))}
            </motion.div>

            {/* Profile Completeness */}
            <motion.div variants={fadeIn} initial="hidden" animate="show" custom={2}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-primary" />
                  <h3 className="font-heading font-semibold text-sm text-foreground">Profile completion</h3>
                </div>
                <span className={`text-xs font-bold ${completeness === 100 ? "text-primary" : "text-muted-foreground"}`}>
                  {completeness}%
                </span>
              </div>
              <Progress value={completeness} className="h-2 mb-3" />
              <div className="flex flex-wrap gap-2">
                {[
                  { done: !!displayName, label: "Display name" },
                  { done: !!avatarUrl, label: "Profile photo" },
                  { done: true, label: "Email verified" },
                  { done: !!country, label: "Country" },
                  { done: !!age, label: "Age" },
                  { done: !!tradingExperience, label: "Experience level" },
                  { done: !!bio, label: "Bio" },
                  { done: !!timezone, label: "Timezone" },
                  { done: tradingInterests.length > 0, label: "Markets" },
                ].map((item) => (
                  <span key={item.label} className={`inline-flex items-center gap-1 text-[11px] rounded-full px-2.5 py-1 border ${
                    item.done
                      ? "border-primary/30 bg-primary/5 text-primary"
                      : "border-border bg-muted text-muted-foreground"
                  }`}>
                    <CheckCircle2 className={`h-3 w-3 ${item.done ? "text-primary" : "text-muted-foreground/40"}`} />
                    {item.label}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Edit Profile Form */}
            <motion.div variants={fadeIn} initial="hidden" animate="show" custom={3}
              className="rounded-2xl border border-border bg-card p-6 space-y-5"
            >
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-primary" />
                <h3 className="font-heading font-semibold text-foreground">Edit profile</h3>
              </div>

              {/* Basic information */}
              <div className="space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Basic information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Display name</Label>
                    <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-muted border-border text-sm" placeholder="Your name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Country</Label>
                    <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between bg-muted border-border font-normal text-sm h-10">
                          <span className={country ? "" : "text-muted-foreground"}>{country || "Select country"}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search country..." />
                          <CommandList>
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup>
                              {country && (
                                <CommandItem value="__clear__" onSelect={() => { setCountry(""); setCountryOpen(false); }} className="text-muted-foreground">
                                  Clear selection
                                </CommandItem>
                              )}
                              {COUNTRIES.map((c) => (
                                <CommandItem key={c} value={c} onSelect={() => { setCountry(c); setCountryOpen(false); }}>
                                  <Check className={`mr-2 h-4 w-4 ${country === c ? "opacity-100" : "opacity-0"}`} />
                                  {c}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger className="bg-muted border-border text-sm">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">Helps mentors schedule sessions in your local time.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Age <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input type="number" min="13" max="120" value={age} onChange={(e) => setAge(e.target.value)} className="bg-muted border-border text-sm" placeholder="e.g. 25" />
                  </div>
                </div>
              </div>

              {/* Trading profile */}
              <div className="space-y-4 pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Trading profile</p>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Experience level</Label>
                  <Select value={tradingExperience} onValueChange={setTradingExperience}>
                    <SelectTrigger className="bg-muted border-border text-sm">
                      <SelectValue placeholder="Select your experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner — Just getting started</SelectItem>
                      <SelectItem value="intermediate">Intermediate — Some experience</SelectItem>
                      <SelectItem value="advanced">Advanced — Experienced trader</SelectItem>
                      <SelectItem value="professional">Professional — Full-time trader</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Markets you trade</Label>
                  <div className="flex flex-wrap gap-2">
                    {TRADING_MARKETS.map((m) => {
                      const active = tradingInterests.includes(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setTradingInterests((prev) => active ? prev.filter((x) => x !== m) : [...prev, m])}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            active
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Bio</Label>
                    <span className="text-[10px] text-muted-foreground">{bio.length}/300</span>
                  </div>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 300))}
                    className="bg-muted border-border text-sm min-h-[90px] resize-none"
                    placeholder="A short intro about you and your trading goals."
                  />
                </div>
              </div>

              {/* Account email */}
              <div className="space-y-4 pt-4 border-t border-border">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Account email</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Current email</Label>
                    <Input value={user.email || ""} disabled className="bg-muted/50 border-border text-sm text-muted-foreground" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Change email</Label>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="bg-muted border-border text-sm flex-1"
                        placeholder="new@email.com"
                      />
                      <Button
                        variant="outline"
                        className="text-sm shrink-0"
                        disabled={!newEmail.trim() || changeEmailMutation.isPending}
                        onClick={() => changeEmailMutation.mutate()}
                      >
                        {changeEmailMutation.isPending ? "Sending..." : "Update"}
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">A confirmation link is sent to the new address; the change applies once you click it.</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Your data is stored securely.</span>
                </div>
                <Button onClick={() => updateProfileMutation.mutate()} disabled={updateProfileMutation.isPending} className="text-sm font-semibold">
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {updateProfileMutation.isPending ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </motion.div>

            {/* Mentor availability (mentors only) */}
            {isMentor && mentorProfile && (
              <motion.div variants={fadeIn} initial="hidden" animate="show" custom={3.5}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-heading font-semibold text-foreground text-sm">Accepting New Students</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(mentorProfile as any).available
                        ? "Your profile shows as available — students can subscribe."
                        : "Paused — your profile is marked unavailable to new students."}
                    </p>
                  </div>
                  <Switch
                    checked={!!(mentorProfile as any).available}
                    disabled={toggleAvailabilityMutation.isPending}
                    onCheckedChange={(v) => toggleAvailabilityMutation.mutate(v)}
                  />
                </div>
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div variants={fadeIn} initial="hidden" animate="show" custom={4}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              <Link to="/mentors" className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:bg-primary/[0.02] transition-all group">
                <Star className="h-5 w-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="font-heading font-semibold text-sm text-foreground">Browse Mentors</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Find your next trading mentor</p>
              </Link>
              <Link to="/dashboard" className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:bg-primary/[0.02] transition-all group">
                <Award className="h-5 w-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="font-heading font-semibold text-sm text-foreground">Dashboard</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">View your subscriptions & messages</p>
              </Link>
              <Link to="/learn" className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:bg-primary/[0.02] transition-all group">
                <BookOpen className="h-5 w-5 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="font-heading font-semibold text-sm text-foreground">Free Content</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Watch free trading tutorials</p>
              </Link>
            </motion.div>
          </TabsContent>

          {/* ──────────── PASSWORD TAB ──────────── */}
          <TabsContent value="password">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="h-4 w-4 text-primary" />
                <h3 className="font-heading font-semibold text-foreground">Change Password</h3>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">New Password</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-muted border-border text-sm pr-10" placeholder="••••••••" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Confirm New Password</Label>
                <Input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-muted border-border text-sm" placeholder="••••••••" />
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] text-destructive">Passwords don't match</p>
                )}
              </div>
              {newPassword && (
                <div className="flex gap-2">
                  {["Length (8+)", "Match"].map((rule) => {
                    const pass = rule === "Length (8+)" ? newPassword.length >= 8 : (newPassword === confirmPassword && confirmPassword.length > 0);
                    return (
                      <span key={rule} className={`inline-flex items-center gap-1 text-[11px] rounded-full px-2.5 py-1 border ${pass ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-muted text-muted-foreground"}`}>
                        <CheckCircle2 className={`h-3 w-3 ${pass ? "text-primary" : "text-muted-foreground/40"}`} />
                        {rule}
                      </span>
                    );
                  })}
                </div>
              )}
              <Button onClick={() => changePasswordMutation.mutate()} disabled={changePasswordMutation.isPending} className="text-sm font-semibold">
                <Lock className="h-3.5 w-3.5 mr-1.5" /> Update Password
              </Button>
            </div>
            <div className="mt-6">
              <TwoFactorSettings />
            </div>
          </TabsContent>

          {/* ──────────── NOTIFICATIONS TAB ──────────── */}
          <TabsContent value="notifications">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Bell className="h-4 w-4 text-primary" />
                <h3 className="font-heading font-semibold text-foreground">Notifications</h3>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground text-sm">In-app notifications</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    New messages appear in real time under the bell icon in the top bar — no setup needed.
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">Email notifications are coming soon.</p>
            </div>
          </TabsContent>

          {/* ──────────── BILLING TAB ──────────── */}
          <TabsContent value="billing" className="space-y-8">
            {/* Billing Overview Banner */}
            <motion.div variants={fadeIn} initial="hidden" animate="show" custom={0}
              className="relative rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-8 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/[0.08] to-transparent rounded-bl-full pointer-events-none" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Billing & Payments</h2>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Manage your subscriptions, view billing history, withdraw earnings, and update payment methods.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-muted-foreground">Active Subscriptions</span>
                  <span className="font-heading text-3xl font-bold text-primary">{activeSubCount}</span>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions Grid */}
            <motion.div variants={fadeIn} initial="hidden" animate="show" custom={1}>
              <h3 className="font-heading font-semibold text-foreground text-lg mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  className="group rounded-2xl border border-border bg-card p-6 text-left hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                  disabled={connectLoading}
                  onClick={async () => {
                    setConnectLoading(true);
                    try {
                      const { data, error } = await supabase.functions.invoke("customer-portal");
                      if (error) throw error;
                      if (data?.error) {
                        if (data.error === "no_customer" || data.message?.includes("No billing account"))
                          toast.info(data.message || "No billing account found. Subscribe to a mentor first.");
                        else
                          throw new Error(data.error);
                        return;
                      }
                      if (data?.url) window.open(data.url, "_blank");
                      else toast.info("No active subscriptions yet. Subscribe to a mentor first to manage billing.");
                    } catch (err: any) {
                      const msg = err.message?.toLowerCase() || "";
                      if (msg.includes("no stripe customer") || msg.includes("no_customer") || msg.includes("non-2xx") || msg.includes("no billing"))
                        toast.info("No billing account found. Subscribe to a mentor first to manage your subscriptions.");
                      else
                        toast.error(err.message || "Failed to open billing portal.");
                    } finally {
                      setConnectLoading(false);
                    }
                  }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/15 transition-colors">
                    {connectLoading ? <Loader2 className="h-5 w-5 text-primary animate-spin" /> : <CreditCard className="h-5 w-5 text-primary" />}
                  </div>
                  <h4 className="font-heading font-semibold text-foreground mb-1">Manage Subscriptions</h4>
                  <p className="text-xs text-muted-foreground">Update plans, change payment method, or cancel</p>
                </button>

                {isMentor && (
                  <button
                    className="group rounded-2xl border border-border bg-card p-6 text-left hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                    disabled={connectLoading}
                    onClick={async () => {
                      setConnectLoading(true);
                      try {
                        const { data, error } = await supabase.functions.invoke("process-withdrawal", {
                          body: { action: "withdraw" },
                        });
                        if (error) throw error;
                        if (data?.error) throw new Error(data.error);
                        toast.success(data?.message || "Withdrawal initiated!");
                        queryClient.invalidateQueries({ queryKey: ["connect-balance"] });
                      } catch (err: any) {
                        const msg = err?.message || String(err);
                        const lower = msg.toLowerCase();
                        if (lower.includes("connect account not set up") || lower.includes("stripe connect account not set up") || lower.includes("non-2xx"))
                          toast.info("Set up your payout account first in the Mentor Hub → Income tab.");
                        else if (lower.includes("payouts not enabled"))
                          toast.info("Complete your Stripe account setup first to enable withdrawals.");
                        else if (lower.includes("no available balance") || lower.includes("insufficient"))
                          toast.info("No funds available to withdraw right now.");
                        else if (lower.includes("mentor not found"))
                          toast.info("Mentor profile not found. Make sure you're an approved mentor.");
                        else
                          toast.error(msg || "Failed to withdraw.");
                      } finally {
                        setConnectLoading(false);
                      }
                    }}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 mb-4 group-hover:bg-emerald-500/15 transition-colors">
                      {connectLoading ? <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" /> : <Download className="h-5 w-5 text-emerald-500 rotate-180" />}
                    </div>
                    <h4 className="font-heading font-semibold text-foreground mb-1">Withdraw Earnings</h4>
                    <p className="text-xs text-muted-foreground">Transfer your mentor earnings to your bank</p>
                  </button>
                )}

                <button
                  className="group rounded-2xl border border-border bg-card p-6 text-left hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                  disabled={connectLoading}
                  onClick={async () => {
                    setConnectLoading(true);
                    try {
                      const { data, error } = await supabase.functions.invoke("customer-portal");
                      if (error) throw error;
                      if (data?.error) {
                        if (data.error === "no_customer" || data.message?.includes("No billing account"))
                          toast.info(data.message || "No billing history yet. Subscribe to a mentor first.");
                        else
                          throw new Error(data.error);
                        return;
                      }
                      if (data?.url) window.open(data.url, "_blank");
                      else toast.info("No billing history yet. Your invoices will appear here after your first subscription.");
                    } catch (err: any) {
                      const msg = err?.message || String(err);
                      const lower = msg.toLowerCase();
                      if (lower.includes("no stripe customer") || lower.includes("no_customer") || lower.includes("no billing") || lower.includes("non-2xx"))
                        toast.info("No billing history yet. Subscribe to a mentor first to view invoices.");
                      else
                        toast.error(msg || "Failed to open portal.");
                    } finally {
                      setConnectLoading(false);
                    }
                  }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 mb-4 group-hover:bg-amber-400/15 transition-colors">
                    {connectLoading ? <Loader2 className="h-5 w-5 text-amber-400 animate-spin" /> : <Download className="h-5 w-5 text-amber-400" />}
                  </div>
                  <h4 className="font-heading font-semibold text-foreground mb-1">Billing History</h4>
                  <p className="text-xs text-muted-foreground">View and download past invoices</p>
                </button>
              </div>
            </motion.div>

            {/* Mentor Withdrawal Section */}
            {isMentor && (
              <motion.div variants={fadeIn} initial="hidden" animate="show" custom={2}
                className="rounded-2xl border border-border bg-card overflow-hidden"
              >
                <div className="border-b border-border px-8 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-foreground">Withdrawal & Payouts</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Manage your earnings and payout preferences</p>
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  {!connectBalance?.onboarded ? (
                    <div className="text-center py-8">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 mx-auto mb-4">
                        <TrendingUp className="h-6 w-6 text-emerald-500" />
                      </div>
                      <p className="text-sm text-foreground font-medium mb-1">Set up your payout account</p>
                      <p className="text-xs text-muted-foreground mb-5 max-w-sm mx-auto">Connect your bank account to start receiving payouts from your mentorship subscriptions.</p>
                      <Button
                        variant="glow"
                        className="font-semibold"
                        disabled={connectLoading}
                        onClick={async () => {
                          setConnectLoading(true);
                          try {
                            const { data, error } = await supabase.functions.invoke("create-connect-account");
                            if (error) throw error;
                            if (data?.error) throw new Error(data.error);
                            if (data?.url) window.open(data.url, "_blank");
                            else toast.error("Could not start onboarding. Please try again.");
                          } catch (err: any) {
                            const msg = err.message?.toLowerCase() || "";
                            if (msg.includes("non-2xx"))
                              toast.error("Unable to set up payouts right now. Please try again later.");
                            else
                              toast.error(err.message || "Failed to start onboarding.");
                          } finally {
                            setConnectLoading(false);
                          }
                        }}
                      >
                        {connectLoading ? (
                          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                        ) : (
                          <CreditCard className="h-4 w-4 mr-1.5" />
                        )}
                        {connectLoading ? "Setting up…" : "Set Up Payout Account"}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                        <div className="rounded-xl border border-border bg-muted/30 p-5">
                          <p className="text-xs text-muted-foreground mb-1">Available Balance</p>
                          <p className="font-heading text-2xl font-bold text-foreground">${(connectBalance.available ?? 0).toFixed(2)}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">Ready to withdraw</p>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/30 p-5">
                          <p className="text-xs text-muted-foreground mb-1">Pending</p>
                          <p className="font-heading text-2xl font-bold text-foreground">${(connectBalance.pending ?? 0).toFixed(2)}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">Processing payments</p>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/30 p-5">
                          <p className="text-xs text-muted-foreground mb-1">Total Earned</p>
                          <p className="font-heading text-2xl font-bold text-foreground">${(connectBalance.total_earned ?? 0).toFixed(2)}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">Lifetime earnings</p>
                        </div>
                      </div>

                      {!connectBalance.payouts_enabled && (
                        <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 mb-6">
                          <p className="text-sm text-foreground font-medium mb-1">⚠️ Onboarding Incomplete</p>
                          <p className="text-xs text-muted-foreground mb-3">Complete your account verification to enable payouts.</p>
                          <Button
                            variant="outline" size="sm" className="text-xs font-semibold"
                            onClick={async () => {
                              try {
                                const { data, error } = await supabase.functions.invoke("create-connect-account");
                                if (error) throw error;
                                if (data?.url) window.open(data.url, "_blank");
                              } catch (err: any) {
                                const msg = err.message?.toLowerCase() || "";
                                if (msg.includes("non-2xx"))
                                  toast.error("Unable to connect right now. Please try again later.");
                                else
                                  toast.error(err.message || "Failed to complete verification.");
                              }
                            }}
                          >
                            Complete Verification
                          </Button>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex gap-3">
                          <Button
                            variant="glow"
                            className="font-semibold"
                            disabled={!connectBalance.payouts_enabled || (connectBalance.available ?? 0) <= 0}
                            onClick={async () => {
                              try {
                                const { data, error } = await supabase.functions.invoke("process-withdrawal", {
                                  body: { action: "withdraw" },
                                });
                                if (error) throw error;
                                if (data?.error) throw new Error(data.error);
                                toast.success(data?.message || "Withdrawal initiated!");
                                queryClient.invalidateQueries({ queryKey: ["connect-balance"] });
                              } catch (err: any) {
                                const msg = err.message?.toLowerCase() || "";
                                if (msg.includes("connect account not set up") || msg.includes("non-2xx"))
                                  toast.info("Set up your payout account first to withdraw earnings.");
                                else
                                  toast.error(err.message || "Failed to withdraw.");
                              }
                            }}
                          >
                            <Download className="h-4 w-4 mr-1.5 rotate-180" /> Withdraw Funds
                          </Button>
                          <Button
                            variant="outline"
                            className="font-semibold text-sm"
                            onClick={async () => {
                              try {
                                const { data, error } = await supabase.functions.invoke("create-connect-account");
                                if (error) throw error;
                                if (data?.url) window.open(data.url, "_blank");
                              } catch (err: any) {
                                const msg = err.message?.toLowerCase() || "";
                                if (msg.includes("non-2xx"))
                                  toast.error("Unable to update payout method right now. Please try again later.");
                                else
                                  toast.error(err.message || "Failed to update payout method.");
                              }
                            }}
                          >
                            <CreditCard className="h-4 w-4 mr-1.5" /> Update Payout Method
                          </Button>
                        </div>

                        <div className="flex items-center gap-3 ml-auto p-3 rounded-xl bg-muted/30 border border-border">
                          <div>
                            <p className="text-xs font-medium text-foreground">Auto Payout</p>
                            <p className="text-[10px] text-muted-foreground">Monthly automatic transfers</p>
                          </div>
                          <Switch
                            checked={connectBalance.auto_payout ?? false}
                            onCheckedChange={async () => {
                              try {
                                const { data, error } = await supabase.functions.invoke("process-withdrawal", {
                                  body: { action: "toggle_auto_payout" },
                                });
                                if (error) throw error;
                                if (data?.error) throw new Error(data.error);
                                toast.success(data?.message || "Payout preference updated!");
                                queryClient.invalidateQueries({ queryKey: ["connect-balance"] });
                              } catch (err: any) {
                                const msg = err.message?.toLowerCase() || "";
                                if (msg.includes("non-2xx"))
                                  toast.error("Unable to update payout settings. Please try again later.");
                                else
                                  toast.error(err.message || "Failed to update payout preference.");
                              }
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* Active Subscriptions */}
            <motion.div variants={fadeIn} initial="hidden" animate="show" custom={3}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              <div className="border-b border-border px-8 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">Active Subscriptions</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{activeSubCount} active plan{activeSubCount !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <Button
                  variant="outline" size="sm" className="text-xs font-semibold"
                  onClick={async () => {
                    try {
                      const { data, error } = await supabase.functions.invoke("customer-portal");
                      if (error) throw error;
                      if (data?.url) window.open(data.url, "_blank");
                    } catch (err: any) {
                      const msg = err.message?.toLowerCase() || "";
                      if (msg.includes("no stripe customer") || msg.includes("non-2xx"))
                        toast.info("No active subscriptions to manage. Subscribe to a mentor first.");
                      else
                        toast.error(err.message || "Failed to open portal.");
                    }
                  }}
                >
                  Manage All
                </Button>
              </div>
              <div className="p-8">
                {activeSubCount === 0 ? (
                  <div className="text-center py-10">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 mx-auto mb-4">
                      <CreditCard className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">No active subscriptions</p>
                    <p className="text-xs text-muted-foreground mb-4">Browse mentors and subscribe to get started</p>
                    <Link to="/mentors">
                      <Button variant="outline" size="sm" className="text-xs font-semibold">
                        Browse Mentors
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subscriptions.filter((s: any) => s.status === "active").map((sub: any) => (
                      <div key={sub.id} className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/[0.03] p-5">
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 font-heading font-bold text-primary text-sm">
                            {(sub.mentors?.name || "M").charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-heading font-semibold text-foreground">{sub.mentors?.name || "Mentor"}</h4>
                            <span className="text-xs text-muted-foreground">Since {new Date(sub.started_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="font-heading text-lg font-bold text-foreground">${sub.mentors?.monthly_price || 0}</span>
                            <span className="text-xs text-muted-foreground">/mo</span>
                            <span className="block text-[11px] font-medium text-primary mt-0.5">Active</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs"
                            onClick={async () => {
                              if (!window.confirm(`Cancel your subscription to ${sub.mentors?.name || "this mentor"}? You can re-subscribe anytime.`)) return;
                              try {
                                const { data, error } = await supabase.functions.invoke("customer-portal");
                                if (error) throw error;
                                if (data?.url) window.open(data.url, "_blank");
                              } catch (err: any) { toast.error(err.message || "Failed to open portal."); }
                            }}
                          >
                            <X className="h-3 w-3 mr-1" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Billing History */}
            <motion.div variants={fadeIn} initial="hidden" animate="show" custom={4}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              <div className="border-b border-border px-8 py-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10">
                  <Clock className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground">Billing History</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">All past and current subscriptions</p>
                </div>
              </div>
              <div className="p-8">
                {subscriptions.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 mx-auto mb-4">
                      <Clock className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">No billing history yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="pb-3 font-heading font-semibold text-muted-foreground text-xs uppercase tracking-wider">Mentor</th>
                          <th className="pb-3 font-heading font-semibold text-muted-foreground text-xs uppercase tracking-wider">Amount</th>
                          <th className="pb-3 font-heading font-semibold text-muted-foreground text-xs uppercase tracking-wider">Date</th>
                          <th className="pb-3 font-heading font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {subscriptions.map((sub: any) => (
                          <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted font-heading font-bold text-xs text-foreground">
                                  {(sub.mentors?.name || "M").charAt(0)}
                                </div>
                                <span className="font-medium text-foreground">{sub.mentors?.name || "Mentor"}</span>
                              </div>
                            </td>
                            <td className="py-4 font-heading font-semibold text-foreground">${sub.mentors?.monthly_price || 0}/mo</td>
                            <td className="py-4 text-muted-foreground">{new Date(sub.started_at).toLocaleDateString()}</td>
                            <td className="py-4 text-right">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                sub.status === "active"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {sub.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Payment Method */}
            <motion.div variants={fadeIn} initial="hidden" animate="show" custom={5}
              className="rounded-2xl border border-border bg-card p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">Payment Method</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Manage your payment details</p>
                  </div>
                </div>
                <Button
                  variant="outline" size="sm" className="text-xs font-semibold"
                  onClick={async () => {
                    try {
                      const { data, error } = await supabase.functions.invoke("customer-portal");
                      if (error) throw error;
                      if (data?.url) window.open(data.url, "_blank");
                    } catch (err: any) { toast.error(err.message || "Failed to open portal."); }
                  }}
                >
                  Update
                </Button>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border">
                <div className="flex h-10 w-16 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[10px] font-bold tracking-wider">
                  VISA
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">•••• •••• •••• ••••</p>
                  <p className="text-xs text-muted-foreground">Update via billing portal</p>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* ──────────── APPEARANCE TAB ──────────── */}
          <TabsContent value="appearance">
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Palette className="h-4 w-4 text-primary" />
                  <h3 className="font-heading font-semibold text-foreground">Theme</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "dark", label: "Dark", icon: Moon, desc: "Easy on the eyes" },
                    { value: "light", label: "Light", icon: Sun, desc: "Classic look" },
                    { value: "system", label: "System", icon: Monitor, desc: "Match device" },
                  ].map((opt) => {
                    const currentTheme = localStorage.getItem("edgementor-theme") || "dark";
                    const isActive = currentTheme === opt.value;
                    return (
                      <motion.button
                        key={opt.value}
                        className={`rounded-xl border p-4 text-left transition-all ${
                          isActive
                            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                            : "border-border bg-muted/30 hover:border-primary/30"
                        }`}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (opt.value === "system") {
                            const sys = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                            localStorage.setItem("edgementor-theme", sys);
                            document.documentElement.classList.remove("light", "dark");
                            document.documentElement.classList.add(sys);
                          } else {
                            localStorage.setItem("edgementor-theme", opt.value);
                            document.documentElement.classList.remove("light", "dark");
                            document.documentElement.classList.add(opt.value);
                          }
                          window.location.reload();
                        }}
                      >
                        <opt.icon className={`h-5 w-5 mb-2 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                        <p className="font-heading font-semibold text-sm text-foreground">{opt.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Globe className="h-4 w-4 text-primary" />
                  <h3 className="font-heading font-semibold text-foreground">Display Preferences</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                    <div>
                      <h4 className="font-heading font-semibold text-foreground text-sm">Compact Mode</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Reduce spacing for more content density</p>
                    </div>
                    <Switch defaultChecked={false} />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                    <div>
                      <h4 className="font-heading font-semibold text-foreground text-sm">Animations</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Enable smooth transitions and effects</p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ──────────── ACTIVITY TAB ──────────── */}
          <TabsContent value="activity">
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Activity className="h-4 w-4 text-primary" />
                  <h3 className="font-heading font-semibold text-foreground">Recent Activity</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { action: "Logged in", time: "Just now", icon: User, color: "text-primary bg-primary/10" },
                    { action: `Joined EdgeMentor`, time: memberSince.toLocaleDateString(), icon: Award, color: "text-pink-400 bg-pink-400/10" },
                    ...(activeSubCount > 0 ? [{ action: `${activeSubCount} active subscription(s)`, time: "Current", icon: Star, color: "text-amber-400 bg-amber-400/10" }] : []),
                    ...(savedCount > 0 ? [{ action: `${savedCount} mentor(s) saved`, time: "Total", icon: Heart, color: "text-pink-400 bg-pink-400/10" }] : []),
                    ...(messageStats.total > 0 ? [{ action: `${messageStats.total} message(s) received`, time: `${messageStats.unread} unread`, icon: Mail, color: "text-blue-400 bg-blue-400/10" }] : []),
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border hover:border-primary/20 transition-colors"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.color} shrink-0`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{item.action}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{item.time}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h3 className="font-heading font-semibold text-foreground">Account Summary</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Member Since", value: memberSince.toLocaleDateString("en-US", { month: "long", year: "numeric" }), icon: CalendarDays },
                    { label: "Days Active", value: String(daysSinceJoin), icon: Clock },
                    { label: "Subscriptions", value: String(subscriptions.length), icon: Star },
                    { label: "Account Type", value: isMentor ? "Mentor" : "Student", icon: User },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-border bg-muted/30 p-4">
                      <item.icon className="h-4 w-4 text-primary mb-2" />
                      <p className="font-heading font-bold text-foreground">{item.value}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ──────────── PRIVACY TAB ──────────── */}
          <TabsContent value="privacy">
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <h3 className="font-heading font-semibold text-foreground">Privacy Settings</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                    <div>
                      <h4 className="font-heading font-semibold text-foreground text-sm">Profile Visibility</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Allow other users to see your profile info</p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                    <div>
                      <h4 className="font-heading font-semibold text-foreground text-sm">Show Online Status</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Let mentors see when you're online</p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                    <div>
                      <h4 className="font-heading font-semibold text-foreground text-sm">Share Activity</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Share your learning activity with your mentor</p>
                    </div>
                    <Switch defaultChecked={false} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Download className="h-4 w-4 text-primary" />
                  <h3 className="font-heading font-semibold text-foreground">Data & Export</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Download a copy of your account data including profile info, subscriptions, and activity.
                </p>
                <Button variant="outline" size="sm" className="text-xs font-semibold" onClick={() => toast.info("Data export requested. You'll receive an email when ready.")}>
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Request Data Export
                </Button>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-4 w-4 text-primary" />
                  <h3 className="font-heading font-semibold text-foreground">Security</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Email verified</p>
                      <p className="text-[11px] text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border">
                    <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Password</p>
                      <p className="text-[11px] text-muted-foreground">Last changed: —</p>
                    </div>
                    <Link to="/settings?tab=password" className="ml-auto text-xs text-primary hover:underline">Change</Link>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ──────────── MY CONTENT TAB ──────────── */}
          {mentorProfile && (
            <TabsContent value="content">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">Exclusive Content</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Manage content your subscribers can access.</p>
                  </div>
                  <Button size="sm" className="text-xs font-semibold" onClick={() => setShowAddContent(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Content
                  </Button>
                </div>

                <AnimatePresence>
                  {showAddContent && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="rounded-xl border border-primary/20 bg-primary/[0.02] p-4 mb-5 space-y-3 overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-heading font-semibold text-foreground text-sm">New Content</h4>
                        <button onClick={() => setShowAddContent(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                      </div>
                      <Input placeholder="Title" value={newContent.title} onChange={(e) => setNewContent({ ...newContent, title: e.target.value })} className="bg-muted border-border text-sm" />
                      <Textarea placeholder="Description (optional)" value={newContent.description} onChange={(e) => setNewContent({ ...newContent, description: e.target.value })} className="bg-muted border-border text-sm min-h-[60px]" />
                      <div className="flex gap-3">
                        <Select value={newContent.content_type} onValueChange={(v) => setNewContent({ ...newContent, content_type: v })}>
                          <SelectTrigger className="w-36 bg-muted border-border text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="link">Link</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="discord">Discord</SelectItem>
                            <SelectItem value="call">Call</SelectItem>
                            <SelectItem value="resource">Resource</SelectItem>
                            <SelectItem value="file">File Upload</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex-1 flex gap-2">
                          <Input placeholder="URL" value={newContent.content_url} onChange={(e) => setNewContent({ ...newContent, content_url: e.target.value })} className="bg-muted border-border text-sm flex-1" />
                          <Button type="button" variant="outline" size="sm" className="text-xs shrink-0" onClick={() => contentFileRef.current?.click()} disabled={uploadingFile}>
                            <Upload className="h-3.5 w-3.5 mr-1" /> {uploadingFile ? "Uploading..." : "Upload"}
                          </Button>
                          <input ref={contentFileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleContentFileUpload(f, 'new'); e.target.value = ''; }} />
                        </div>
                      </div>
                      <Button size="sm" className="text-xs font-semibold" onClick={addContent} disabled={savingContent || !newContent.title.trim()}>
                        {savingContent ? "Saving..." : "Save Content"}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {contentLoading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : mentorContent.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No content yet. Add videos, links, and resources for your subscribers.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mentorContent.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3 hover:border-primary/20 transition-colors">
                        {editingContent?.id === item.id ? (
                          <div className="flex-1 space-y-2">
                            <Input value={editingContent.title} onChange={(e) => setEditingContent({ ...editingContent, title: e.target.value })} className="bg-muted border-border text-sm" />
                            <Textarea value={editingContent.description} onChange={(e) => setEditingContent({ ...editingContent, description: e.target.value })} className="bg-muted border-border text-sm min-h-[50px]" />
                            <div className="flex gap-2 flex-wrap">
                              <Select value={editingContent.content_type} onValueChange={(v) => setEditingContent({ ...editingContent, content_type: v })}>
                                <SelectTrigger className="w-32 bg-muted border-border text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="link">Link</SelectItem>
                                  <SelectItem value="video">Video</SelectItem>
                                  <SelectItem value="discord">Discord</SelectItem>
                                  <SelectItem value="call">Call</SelectItem>
                                  <SelectItem value="resource">Resource</SelectItem>
                                  <SelectItem value="file">File Upload</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input value={editingContent.content_url} onChange={(e) => setEditingContent({ ...editingContent, content_url: e.target.value })} className="bg-muted border-border text-sm flex-1" placeholder="URL" />
                              <Button type="button" variant="outline" size="sm" className="text-xs shrink-0" onClick={() => editFileRef.current?.click()} disabled={uploadingFile}>
                                <Upload className="h-3.5 w-3.5 mr-1" /> {uploadingFile ? "Uploading..." : "Upload"}
                              </Button>
                              <input ref={editFileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleContentFileUpload(f, 'edit'); e.target.value = ''; }} />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" className="text-xs" onClick={updateContent} disabled={savingContent}>{savingContent ? "Saving..." : "Save"}</Button>
                              <Button size="sm" variant="ghost" className="text-xs" onClick={() => setEditingContent(null)}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground text-sm truncate">{item.title}</h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-muted-foreground capitalize rounded bg-muted px-1.5 py-0.5">{item.content_type}</span>
                                {item.description && <span className="text-[11px] text-muted-foreground truncate">{item.description}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingContent({ ...item })}>
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => deleteContent(item.id)}>
                                <Trash className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Danger Zone */}
        <div className="mt-10 rounded-2xl border border-destructive/30 bg-card p-6">
          <h3 className="font-heading font-semibold text-destructive mb-2 flex items-center gap-2">
            <Trash2 className="h-4 w-4" /> Danger Zone
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Deleting your account is permanent. All your data will be removed.
          </p>
          <Button variant="destructive" size="sm" className="text-xs font-semibold" onClick={() => {
            if (window.confirm("Are you sure you want to delete your account? This cannot be undone.")) deleteAccountMutation.mutate();
          }}>
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
