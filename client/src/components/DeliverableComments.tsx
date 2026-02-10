import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Comment {
  id: number;
  deliverableId: number;
  userId: number;
  comment: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    avatar: string | null;
    role: string;
  };
}

interface DeliverableCommentsProps {
  deliverableId: number;
  currentUserId: number;
}

export function DeliverableComments({ deliverableId, currentUserId }: DeliverableCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ["/api/deliverables", deliverableId, "comments"],
    refetchInterval: 5000,
  });

  const postComment = useMutation({
    mutationFn: async (comment: string) => {
      const res = await fetch(`/api/deliverables/${deliverableId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ comment }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      return res.json();
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/deliverables", deliverableId, "comments"] });
    },
  });

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    postComment.mutate(newComment);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8" data-testid="comments-loading">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card data-testid="deliverable-comments">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comentários ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4" data-testid="comments-empty">
            Nenhum comentário ainda. Seja o primeiro a comentar!
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment, index) => (
              <div key={comment.id}>
                {index > 0 && <Separator />}
                <div className="flex gap-3 pt-4" data-testid={`comment-${comment.id}`}>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={comment.user.avatar || undefined} />
                    <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm" data-testid={`comment-author-${comment.id}`}>
                        {comment.user.name}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap" data-testid={`comment-content-${comment.id}`}>
                      {comment.comment}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          <label htmlFor="new-comment" className="text-sm font-medium">
            Adicionar comentário
          </label>
          <div className="flex gap-2">
            <Textarea
              id="new-comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escreva seu comentário..."
              className="min-h-[80px]"
              data-testid="input-comment"
            />
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim() || postComment.isPending}
              size="icon"
              className="h-[80px] w-[80px]"
              data-testid="button-send-comment"
            >
              {postComment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
