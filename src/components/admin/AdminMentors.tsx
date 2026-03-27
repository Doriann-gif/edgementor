import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Ban, Trash2 } from "lucide-react";
import { toast } from "sonner";

const AdminMentors = () => {
  const queryClient = useQueryClient();

  const { data: mentors = [], isLoading } = useQuery({
    queryKey: ["admin-mentors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("mentors").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ id, available }: { id: string; available: boolean }) => {
      const { error } = await supabase.from("mentors").update({ available: !available }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-mentors"] });
      toast.success("Mentor status updated.");
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mentors").update({ status: "removed" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-mentors"] });
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
      toast.success("Mentor removed from platform.");
    },
  });

  if (isLoading) return <p className="text-center py-12 text-muted-foreground text-sm">Loading mentors...</p>;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Instruments</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Students</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mentors.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">No mentors found.</TableCell></TableRow>
          ) : mentors.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-medium">{m.name}</TableCell>
              <TableCell>
                <Badge variant={m.status === "approved" ? "default" : "secondary"} className="text-[10px] capitalize">{m.status}</Badge>
                {!m.available && <Badge variant="destructive" className="text-[10px] ml-1">Suspended</Badge>}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {m.instruments.map((i) => <Badge key={i} variant="secondary" className="text-[10px]">{i}</Badge>)}
                </div>
              </TableCell>
              <TableCell className="text-xs font-medium">${m.monthly_price}/mo</TableCell>
              <TableCell className="text-xs">{m.students}</TableCell>
              <TableCell className="text-xs">{m.rating}</TableCell>
              <TableCell className="text-right">
                <div className="flex gap-1.5 justify-end">
                  <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => suspendMutation.mutate({ id: m.id, available: m.available })}>
                    <Ban className="h-3 w-3 mr-1" /> {m.available ? "Suspend" : "Unsuspend"}
                  </Button>
                  {m.status !== "removed" && (
                    <Button size="sm" variant="outline" className="h-7 text-[11px] text-destructive hover:text-destructive" onClick={() => removeMutation.mutate(m.id)}>
                      <Trash2 className="h-3 w-3 mr-1" /> Remove
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminMentors;
