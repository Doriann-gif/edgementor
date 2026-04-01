import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import PinkGlow from "@/components/PinkGlow";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import Homepage from "./pages/Homepage.tsx";
import Index from "./pages/Index.tsx";
import MentorListing from "./pages/MentorListing.tsx";
import MentorProfile from "./pages/MentorProfile.tsx";
import Subscribe from "./pages/Subscribe.tsx";
import Auth from "./pages/Auth.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import StudentDashboard from "./pages/StudentDashboard.tsx";
import MentorDashboard from "./pages/MentorDashboard.tsx";
import AccountSettings from "./pages/AccountSettings.tsx";
import DiscountCodes from "./pages/DiscountCodes.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Terms from "./pages/Terms.tsx";
import Privacy from "./pages/Privacy.tsx";
import About from "./pages/About.tsx";
import MentorContentPage from "./pages/MentorContent.tsx";
import Navbar from "./components/Navbar";
import PaymentSuccess from "./pages/PaymentSuccess.tsx";
import FreeContent from "./pages/FreeContent.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

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
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PinkGlow />
          <Navbar />
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
          <HideFooterOnAdmin />
          <CookieConsent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
