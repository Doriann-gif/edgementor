import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, useNavigationType } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { MotionConfig } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CompareProvider } from "@/contexts/CompareContext";
import CompareBar from "@/components/compare/CompareBar";
import PinkGlow from "@/components/PinkGlow";
import UptrendLine from "@/components/UptrendLine";
import ErrorBoundary from "@/components/ErrorBoundary";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import MfaGate from "@/components/MfaGate";
import Navbar from "./components/Navbar";

// Eagerly load the homepage since it's the landing page
import Homepage from "./pages/Homepage";

// Lazy-load all other pages to reduce initial bundle size
const BecomeAMentor = lazy(() => import("./pages/BecomeAMentor"));
const MentorListing = lazy(() => import("./pages/MentorListing"));
const MentorProfile = lazy(() => import("./pages/MentorProfile"));
const Subscribe = lazy(() => import("./pages/Subscribe"));
const Auth = lazy(() => import("./pages/Auth"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const MentorDashboard = lazy(() => import("./pages/MentorDashboard"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const DiscountCodes = lazy(() => import("./pages/DiscountCodes"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const About = lazy(() => import("./pages/About"));
const Verification = lazy(() => import("./pages/Verification"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const MentorContentPage = lazy(() => import("./pages/MentorContent"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const FreeContent = lazy(() => import("./pages/FreeContent"));
const Messages = lazy(() => import("./pages/Messages"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Defaults refetch on every window focus and treat data as instantly stale,
// so tabbing back re-runs every query on the page. At real traffic that's a
// needless multiplier on database load for data that rarely changes.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

// SPA navigations keep the previous scroll position by default — a footer
// link would open the next page already scrolled to the bottom. Only browser
// back/forward (POP) keeps its position, matching native behavior.
const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  useEffect(() => {
    if (navigationType !== "POP") window.scrollTo(0, 0);
  }, [pathname, navigationType]);
  return null;
};

// Warm the most-likely next routes during browser idle time so navigating
// into the booking funnel (marketplace → mentor profile) is instant — the
// lazy chunks are already fetched by the time the user clicks.
const RoutePrefetch = () => {
  useEffect(() => {
    const prefetch = () => {
      void import("./pages/MentorListing");
      void import("./pages/MentorProfile");
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(prefetch, { timeout: 3000 });
      return () => window.cancelIdleCallback?.(id);
    }
    const t = setTimeout(prefetch, 2500);
    return () => clearTimeout(t);
  }, []);
  return null;
};

const HideFooterOnAdmin = () => {
  const location = useLocation();
  const hideOn = ["/admin", "/mentor-dashboard", "/settings"];
  if (hideOn.some((p) => location.pathname.startsWith(p))) return null;
  return <Footer />;
};

const App = () => (
  <ErrorBoundary>
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <AuthProvider>
      <CompareProvider>
      <MotionConfig reducedMotion="user">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <RoutePrefetch />
          <PinkGlow />
          <UptrendLine />
          <MfaGate>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
            >
              Skip to content
            </a>
            <Navbar />
            <main id="main-content" tabIndex={-1}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/mentors" element={<MentorListing />} />
                <Route path="/mentor/:id" element={<MentorProfile />} />
                <Route path="/subscribe/:id" element={<Subscribe />} />
                <Route path="/apply" element={<BecomeAMentor />} />
                <Route path="/learn" element={<FreeContent />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/dashboard" element={<StudentDashboard />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/mentor-dashboard" element={<MentorDashboard />} />
                <Route path="/settings" element={<AccountSettings />} />
                <Route path="/codes" element={<DiscountCodes />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/about" element={<About />} />
                <Route path="/verification" element={<Verification />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/mentorship/:id" element={<MentorContentPage />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </main>
            <HideFooterOnAdmin />
            <CompareBar />
            <CookieConsent />
          </MfaGate>
        </BrowserRouter>
      </TooltipProvider>
      </MotionConfig>
      </CompareProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </HelmetProvider>
  </ErrorBoundary>
);

export default App;