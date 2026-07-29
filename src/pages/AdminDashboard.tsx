import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, LogOut, Tag, ClipboardList, Users, GraduationCap, MessageSquare, BarChart3, Crown, DollarSign, Inbox, UserCog, Banknote } from "lucide-react";
import AdminPayouts from "@/components/admin/AdminPayouts";
import AdminApplications from "@/components/admin/AdminApplications";
import AdminMentors from "@/components/admin/AdminMentors";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminStudents from "@/components/admin/AdminStudents";
import AdminFeed from "@/components/admin/AdminFeed";
import AdminStats from "@/components/admin/AdminStats";
import AdminContent from "@/components/admin/AdminContent";
import AdminBilling from "@/components/admin/AdminBilling";
import AdminLeads from "@/components/admin/AdminLeads";

const AdminDashboard = () => {
  const { user, isAdmin, loading, rolesLoading, signOut } = useAuth();

  // Wait for the role check too — redirecting while it's in flight bounced
  // admins to the homepage on every hard refresh.
  if (loading || rolesLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm">Loading...</p></div>;
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'linear-gradient(hsl(160 84% 39% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(160 84% 39% / 0.3) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
              <ArrowLeft className="h-4 w-4" /> Back to site
            </Link>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage the platform from one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/codes">
              <Button variant="outline" size="sm" className="text-xs"><Tag className="h-3.5 w-3.5 mr-1.5" /> Codes</Button>
            </Link>
            <Button variant="outline" size="sm" className="text-xs" onClick={signOut}>
              <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign Out
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="bg-secondary/50 border border-border h-10">
            <TabsTrigger value="stats" className="text-xs gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Stats</TabsTrigger>
            <TabsTrigger value="applications" className="text-xs gap-1.5"><ClipboardList className="h-3.5 w-3.5" /> Applications</TabsTrigger>
            <TabsTrigger value="mentors" className="text-xs gap-1.5"><Users className="h-3.5 w-3.5" /> Mentors</TabsTrigger>
            <TabsTrigger value="users" className="text-xs gap-1.5"><UserCog className="h-3.5 w-3.5" /> Users</TabsTrigger>
            <TabsTrigger value="content" className="text-xs gap-1.5"><Crown className="h-3.5 w-3.5" /> Content</TabsTrigger>
            <TabsTrigger value="students" className="text-xs gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> Students</TabsTrigger>
            <TabsTrigger value="feed" className="text-xs gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Feed</TabsTrigger>
            <TabsTrigger value="billing" className="text-xs gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Billing</TabsTrigger>
            <TabsTrigger value="payouts" className="text-xs gap-1.5"><Banknote className="h-3.5 w-3.5" /> Payouts</TabsTrigger>
            <TabsTrigger value="leads" className="text-xs gap-1.5"><Inbox className="h-3.5 w-3.5" /> Leads</TabsTrigger>
          </TabsList>

          <TabsContent value="stats"><AdminStats /></TabsContent>
          <TabsContent value="applications"><AdminApplications /></TabsContent>
          <TabsContent value="mentors"><AdminMentors /></TabsContent>
          <TabsContent value="users"><AdminUsers /></TabsContent>
          <TabsContent value="content"><AdminContent /></TabsContent>
          <TabsContent value="students"><AdminStudents /></TabsContent>
          <TabsContent value="feed"><AdminFeed /></TabsContent>
          <TabsContent value="billing"><AdminBilling /></TabsContent>
          <TabsContent value="payouts"><AdminPayouts /></TabsContent>
          <TabsContent value="leads"><AdminLeads /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
