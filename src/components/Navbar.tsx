import { Link, useNavigate } from "react-router-dom";
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
import { Zap, User, Settings, Menu, X, Moon, Sun, Bell, Shield, LogOut, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const { user, isAdmin, isMentor, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

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
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
