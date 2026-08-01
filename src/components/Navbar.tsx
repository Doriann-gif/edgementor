import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Zap, User, Settings, Menu, X, Moon, Sun, Bell, Shield, LogOut, CreditCard, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { signInWithGoogle } from "@/integrations/auth/google";
import NotificationBell from "@/components/NotificationBell";
import { useChatRealtime, useChatUnreadCount } from "@/hooks/use-chat";
import { toast } from "sonner";

const Navbar = () => {
  const { user, isAdmin, isMentor, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  // One app-wide chat realtime subscription keeps the unread badge live on
  // every page (the Navbar is always mounted for a signed-in user).
  useChatRealtime();
  const { data: unreadChats = 0 } = useChatUnreadCount();
  const chatBadge = unreadChats > 9 ? "9+" : String(unreadChats);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const { data: profile } = useQuery({
    queryKey: ["navbar-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user!.id)
        .single();
      return data;
    },
  });

  const initials = (profile?.display_name || user?.email || "U")
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join("");

  const SettingsDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-border/50 pl-1 pr-2.5 py-1 hover:bg-muted/50 transition-colors cursor-pointer">
          <Avatar className="h-7 w-7">
            <AvatarImage src={profile?.avatar_url || undefined} alt="avatar" />
            <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium text-foreground truncate">{profile?.display_name || "User"}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/settings?tab=profile")} className="cursor-pointer">
          <User className="h-4 w-4 mr-2" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/settings?tab=password")} className="cursor-pointer">
          <Shield className="h-4 w-4 mr-2" /> Privacy & Security
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/settings?tab=notifications")} className="cursor-pointer">
          <Bell className="h-4 w-4 mr-2" /> Notifications
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/settings?tab=billing")} className="cursor-pointer">
          <CreditCard className="h-4 w-4 mr-2" /> Billing
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
          {theme === "dark" ? (
            <><Sun className="h-4 w-4 mr-2" /> Light Mode</>
          ) : (
            <><Moon className="h-4 w-4 mr-2" /> Dark Mode</>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4 mr-2" /> Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <nav className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50 relative">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink/20 to-transparent" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to="/" className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" /> EdgeMentor
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          <Link to="/mentors">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Mentors</Button>
          </Link>
          <Link to="/how-it-works">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">How It Works</Button>
          </Link>
          <Link to="/learn">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Learn</Button>
          </Link>
          <Link to="/apply">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Apply</Button>
          </Link>
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Admin</Button>
                </Link>
              )}
              {isMentor && (
                <Link to="/mentor-dashboard">
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Mentor Hub</Button>
                </Link>
              )}
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="text-xs">
                  <User className="h-3.5 w-3.5 mr-1" /> Dashboard
                </Button>
              </Link>
              <Link to="/messages" className="relative" aria-label="Chats">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </Button>
                {unreadChats > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                    {chatBadge}
                  </span>
                )}
              </Link>
              <NotificationBell />
              <SettingsDropdown />
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
                {theme === "dark" ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
              </Button>
              <Link to="/auth">
                <Button variant="outline" size="sm" className="text-xs">Sign In</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-sm px-4 py-3 space-y-1">
          <Link to="/mentors" onClick={() => setMobileOpen(false)}>
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground">Mentors</Button>
          </Link>
          <Link to="/how-it-works" onClick={() => setMobileOpen(false)}>
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground">How It Works</Button>
          </Link>
          <Link to="/learn" onClick={() => setMobileOpen(false)}>
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground">Learn</Button>
          </Link>
          <Link to="/apply" onClick={() => setMobileOpen(false)}>
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground">Apply</Button>
          </Link>
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground">Admin</Button>
                </Link>
              )}
              {isMentor && (
                <Link to="/mentor-dashboard" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground">Mentor Hub</Button>
                </Link>
              )}
              <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground">Dashboard</Button>
              </Link>
              <Link to="/messages" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Chats
                  {unreadChats > 0 && (
                    <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                      {chatBadge}
                    </span>
                  )}
                </Button>
              </Link>
              <Link to="/settings" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground">
                  <Settings className="h-3.5 w-3.5 mr-1.5" /> Settings
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground" onClick={toggleTheme}>
                {theme === "dark" ? <Sun className="h-3.5 w-3.5 mr-1.5" /> : <Moon className="h-3.5 w-3.5 mr-1.5" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs text-destructive"
                onClick={() => { setMobileOpen(false); handleSignOut(); }}
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" /> Log Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground" onClick={toggleTheme}>
                {theme === "dark" ? <Sun className="h-3.5 w-3.5 mr-1.5" /> : <Moon className="h-3.5 w-3.5 mr-1.5" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </Button>
              <Link to="/auth" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" size="sm" className="w-full text-xs mt-1">Sign In</Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs mt-1 gap-2"
                onClick={async () => {
                  setMobileOpen(false);
                  try {
                    const { error } = await signInWithGoogle();
                    if (error) {
                      toast.error(error.message || "Google sign-in failed.");
                    }
                    // On success the browser redirects to Google and back.
                  } catch (err: any) {
                    toast.error(err.message || "Google sign-in failed.");
                  }
                }}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
