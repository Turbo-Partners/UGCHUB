import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAvatarUrl } from '@/lib/utils';

type CreatorReview = {
  id: number;
  creatorId: number;
  companyId: number;
  campaignId: number | null;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  companyName: string;
  campaignTitle: string | null;
};

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: number;
  creatorName: string;
}

function InteractiveStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1" data-testid="interactive-stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="p-0.5 transition-transform hover:scale-110"
          data-testid={`star-${star}`}
        >
          <Star
            className={`h-8 w-8 transition-colors ${
              star <= (hovered || value) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewModal({ open, onOpenChange, creatorId, creatorName }: ReviewModalProps) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const { data: reviews = [] } = useQuery<CreatorReview[]>({
    queryKey: [`/api/users/${creatorId}/reviews`],
    queryFn: async () => {
      const res = await fetch(`/api/users/${creatorId}/reviews`, {
        credentials: 'include',
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open && !!creatorId,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: { rating: number; comment: string }) => {
      const res = await apiRequest('POST', `/api/users/${creatorId}/reviews`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${creatorId}/reviews`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${creatorId}/rating`] });
      toast.success('Avaliacao enviada com sucesso!');
      setRating(0);
      setComment('');
    },
    onError: () => {
      toast.error('Erro ao enviar avaliacao');
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Selecione uma nota de 1 a 5');
      return;
    }
    submitMutation.mutate({ rating, comment: comment.trim() || '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Avaliar {creatorName}</DialogTitle>
          <DialogDescription>
            Compartilhe sua experiencia trabalhando com este criador.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Write review */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Sua avaliacao</label>
            <div className="flex items-center gap-3">
              <InteractiveStars value={rating} onChange={setRating} />
              {rating > 0 && <span className="text-sm text-muted-foreground">{rating}/5</span>}
            </div>
            <Textarea
              placeholder="Comentario opcional (max 1000 caracteres)"
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 1000))}
              rows={3}
              data-testid="review-comment-input"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{comment.length}/1000</span>
              <Button
                onClick={handleSubmit}
                disabled={rating === 0 || submitMutation.isPending}
                data-testid="button-submit-review"
              >
                {submitMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enviar Avaliacao
              </Button>
            </div>
          </div>

          {/* Existing reviews */}
          {reviews.length > 0 && (
            <div className="border-t pt-4 space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Avaliacoes ({reviews.length})
              </h4>
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-3 rounded-lg border bg-muted/30 space-y-2"
                  data-testid={`review-${review.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{review.companyName}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${
                            s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.campaignTitle && (
                    <p className="text-xs text-muted-foreground">
                      Campanha: {review.campaignTitle}
                    </p>
                  )}
                  {review.comment && <p className="text-sm text-foreground/80">{review.comment}</p>}
                  <p className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
