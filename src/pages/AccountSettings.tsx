import { useState, useEffect } from "react";
import { Navigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, User, Lock, Bell, CreditCard, Trash2, Save, Zap, LogOut,
} from "lucide-react";
import { toast } from "sonner";

const AccountSettings = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "profile";

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

  // Subscriptions (billing history)
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

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setAvatarUrl(profile.avatar_url || "");
      setEmailNotifications(profile.email_notifications ?? true);
      setMarketingEmails(profile.marketing_emails ?? false);
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          avatar_url: avatarUrl || null,
          email_notifications: emailNotifications,
          marketing_emails: marketingEmails,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Profile updated!");
    },
    onError: () => toast.error("Failed to update profile."),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) throw new Error("Passwords don't match.");
      if (newPassword.length < 6) throw new Error("Password must be at least 6 characters.");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated!");
    },
    onError: (err: any) => toast.error(err.message || "Failed to change password."),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      // Sign out — actual account deletion would require an edge function with service role
      await supabase.auth.signOut();
      toast.success("You have been signed out. Contact support to fully delete your account.");
    },
  });

  if (authLoading || profileLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm">Loading...</p></div>;
  }
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(hsl(160 84% 39% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(160 84% 39% / 0.3) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-8">
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
          <TabsList className="bg-secondary border border-border rounded-xl p-1 h-auto">
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
          </TabsList>

          {/* Profile */}
          <TabsContent value="profile">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-xs">Display Name</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-muted border-border text-sm" placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Avatar URL</Label>
                <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="bg-muted border-border text-sm" placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Email</Label>
                <Input value={user.email || ""} disabled className="bg-muted/50 border-border text-sm text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground">Email cannot be changed.</p>
              </div>
              <Button onClick={() => updateProfileMutation.mutate()} disabled={updateProfileMutation.isPending} className="text-sm font-semibold">
                <Save className="h-3.5 w-3.5 mr-1.5" /> Save Changes
              </Button>
            </div>
          </TabsContent>

          {/* Password */}
          <TabsContent value="password">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-xs">New Password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-muted border-border text-sm" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Confirm New Password</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-muted border-border text-sm" placeholder="••••••••" />
              </div>
              <Button onClick={() => changePasswordMutation.mutate()} disabled={changePasswordMutation.isPending} className="text-sm font-semibold">
                <Lock className="h-3.5 w-3.5 mr-1.5" /> Update Password
              </Button>
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-foreground text-sm">Email Notifications</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Receive notifications about messages and mentor updates.</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-foreground text-sm">Marketing Emails</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Tips, new mentors, and platform updates.</p>
                </div>
                <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
              </div>
              <Button onClick={() => updateProfileMutation.mutate()} disabled={updateProfileMutation.isPending} className="text-sm font-semibold">
                <Save className="h-3.5 w-3.5 mr-1.5" /> Save Preferences
              </Button>
            </div>
          </TabsContent>

          {/* Billing */}
          <TabsContent value="billing">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-heading font-semibold text-foreground mb-4">Subscription History</h3>
              {subscriptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No subscriptions yet.</div>
              ) : (
                <div className="space-y-3">
                  {subscriptions.map((sub: any) => (
                    <div key={sub.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4">
                      <div>
                        <h4 className="font-heading font-semibold text-foreground text-sm">{sub.mentors?.name || "Mentor"}</h4>
                        <span className="text-xs text-muted-foreground">Started {new Date(sub.started_at).toLocaleDateString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-heading font-bold text-foreground">${sub.mentors?.monthly_price || 0}/mo</span>
                        <span className={`block text-[11px] font-medium mt-0.5 ${sub.status === "active" ? "text-primary" : "text-muted-foreground"}`}>
                          {sub.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Danger Zone */}
        <div className="mt-10 rounded-2xl border border-destructive/30 bg-card p-6">
          <h3 className="font-heading font-semibold text-destructive mb-2 flex items-center gap-2">
            <Trash2 className="h-4 w-4" /> Danger Zone
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Deleting your account is permanent. All your data will be removed.
          </p>
          <Button
            variant="destructive"
            size="sm"
            className="text-xs font-semibold"
            onClick={() => {
              if (window.confirm("Are you sure you want to delete your account? This cannot be undone.")) {
                deleteAccountMutation.mutate();
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
