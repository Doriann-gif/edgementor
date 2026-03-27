import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, CreditCard, DollarSign } from "lucide-react";

const AdminStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [mentorsRes, profilesRes, subsRes, mentorPricesRes] = await Promise.all([
        supabase.from("mentors").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("subscriptions").select("mentor_id"),
        supabase.from("mentors").select("id, monthly_price").eq("status", "approved"),
      ]);

      const priceMap = new Map<string, number>();
      (mentorPricesRes.data || []).forEach((m) => priceMap.set(m.id, m.monthly_price));

      const totalRevenue = (subsRes.data || []).reduce((sum, s) => sum + (priceMap.get(s.mentor_id) || 0), 0);

      return {
        totalMentors: mentorsRes.count || 0,
        totalStudents: profilesRes.count || 0,
        totalTransactions: subsRes.data?.length || 0,
        totalRevenue,
      };
    },
  });

  if (isLoading) return <p className="text-center py-12 text-muted-foreground text-sm">Loading stats...</p>;

  const cards = [
    { label: "Total Mentors", value: stats?.totalMentors || 0, icon: Users, color: "text-primary" },
    { label: "Total Students", value: stats?.totalStudents || 0, icon: GraduationCap, color: "text-blue-400" },
    { label: "Total Transactions", value: stats?.totalTransactions || 0, icon: CreditCard, color: "text-amber-400" },
    { label: "Platform Revenue", value: `$${(stats?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: "text-emerald-400" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
            <c.icon className={`h-4 w-4 ${c.color}`} />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-heading">{c.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminStats;
