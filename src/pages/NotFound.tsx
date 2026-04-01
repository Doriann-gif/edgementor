import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Home, SearchX, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <PageTransition>
      <Helmet>
        <title>Page Not Found — EdgeMentor</title>
      </Helmet>
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center space-y-6 max-w-md">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto"
          >
            <SearchX className="h-10 w-10 text-primary" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="font-heading text-6xl font-bold text-foreground"
          >
            404
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-lg text-muted-foreground"
          >
            This page doesn't exist or has been moved.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link to="/">
              <Button className="font-semibold gap-2">
                <Home className="h-4 w-4" /> Go Home
              </Button>
            </Link>
            <Link to="/mentors">
              <Button variant="outline" className="font-semibold gap-2">
                <Users className="h-4 w-4" /> Browse Mentors
              </Button>
            </Link>
            <Link to="/learn">
              <Button variant="ghost" className="font-semibold gap-2">
                <BookOpen className="h-4 w-4" /> Free Content
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default NotFound;
