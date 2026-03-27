import { Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const HomeButton = () => {
  const { pathname } = useLocation();
  if (pathname === "/") return null;

  return (
    <Link
      to="/"
      className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80 backdrop-blur-sm text-muted-foreground transition-colors hover:text-primary hover:border-primary/30 shadow-lg"
      aria-label="Go to homepage"
    >
      <Home className="h-4.5 w-4.5" />
    </Link>
  );
};

export default HomeButton;
