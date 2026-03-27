import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

const AdminFeed = () => {
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-feed"],
    queryFn: async () => {
      const { data, error } = await supabase.from("feed_posts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("feed_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feed"] });
      toast.success("Post deleted.");
    },
    onError: () => toast.error("Failed to delete post."),
  });

  if (isLoading) return <p className="text-center py-12 text-muted-foreground text-sm">Loading feed posts...</p>;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Author</TableHead>
            <TableHead>Content</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.length === 0 ? (
            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-12">No feed posts yet.</TableCell></TableRow>
          ) : posts.map((post) => (
            <TableRow key={post.id}>
              <TableCell className="font-medium">{post.author_name}</TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-md truncate">{post.content}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline" className="h-7 text-[11px] text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(post.id)} disabled={deleteMutation.isPending}>
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminFeed;
