import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const AdminStudents = () => {
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscriptions").select("user_id, status, mentors(name)").eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  const activeSubMap = new Map<string, string[]>();
  subscriptions.forEach((s: any) => {
    const list = activeSubMap.get(s.user_id) || [];
    list.push(s.mentors?.name || "Unknown");
    activeSubMap.set(s.user_id, list);
  });

  if (isLoading) return <p className="text-center py-12 text-muted-foreground text-sm">Loading students...</p>;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Active Mentorships</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.length === 0 ? (
            <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-12">No students found.</TableCell></TableRow>
          ) : profiles.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.display_name || "—"}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                {activeSubMap.has(p.id) ? (
                  <div className="flex flex-wrap gap-1">
                    {activeSubMap.get(p.id)!.map((name, i) => (
                      <Badge key={i} variant="default" className="text-[10px]">{name}</Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminStudents;
