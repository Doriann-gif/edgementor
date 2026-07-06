import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { MotionConfig } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import PinkGlow from "@/components/PinkGlow";
import UptrendLine from "@/components/UptrendLine";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import Navbar from "./components/Navbar";

// Eagerly load the homepage since it's the landing page
import Homepage from "./pages/Homepage";

// Lazy-load all other pages to reduce initial bundle size
const Index = lazy(() => import("./pages/Index"));
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
const MentorContentPage = lazy(() => import("./pages/MentorContent"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const FreeContent = lazy(() => import("./pages/FreeContent"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const HideFooterOnAdmin = () => {
  const location = useLocation();
  const hideOn = ["/admin", "/mentor-dashboard", "/settings"];
  if (hideOn.some((p) => location.pathname.startsWith(p))) return null;
  return <Footer />;
};

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <AuthProvider>
      <MotionConfig reducedMotion="user">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PinkGlow />
          <UptrendLine />
          <Navbar />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/mentors" element={<MentorListing />} />
              <Route path="/mentor/:id" element={<MentorProfile />} />
              <Route path="/subscribe/:id" element={<Subscribe />} />
              <Route path="/apply" element={<Index />} />
              <Route path="/learn" element={<FreeContent />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/dashboard" element={<StudentDashboard />} />
              <Route path="/mentor-dashboard" element={<MentorDashboard />} />
              <Route path="/settings" element={<AccountSettings />} />
              <Route path="/codes" element={<DiscountCodes />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/about" element={<About />} />
              <Route path="/mentorship/:id" element={<MentorContentPage />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <HideFooterOnAdmin />
          <CookieConsent />
        </BrowserRouter>
      </TooltipProvider>
      </MotionConfig>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;