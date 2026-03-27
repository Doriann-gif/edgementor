import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, User, Settings, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const Navbar = () => {
  const { user, isAdmin, isMentor } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to="/" className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" /> EdgeMentor
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          <Link to="/mentors">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Mentors</Button>
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
              <Link to="/settings">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </Button>
              </Link>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm" className="text-xs">Sign In</Button>
            </Link>
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
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground">Settings</Button>
              </Link>
            </>
          ) : (
            <Link to="/auth" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" size="sm" className="w-full text-xs mt-1">Sign In</Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
