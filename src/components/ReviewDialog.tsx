import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ReviewDialogProps {
  refereeId: string;
  refereeName: string;
  onReviewSubmitted?: () => void;
}

const ReviewDialog = ({ refereeId, refereeName, onReviewSubmitted }: ReviewDialogProps) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Faça login", description: "Você precisa estar logado para avaliar.", variant: "destructive" });
      return;
    }
    if (rating === 0) {
      toast({ title: "Selecione uma nota", description: "Escolha de 1 a 5 estrelas.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("reviews").upsert({
      referee_id: refereeId,
      reviewer_id: user.id,
      rating,
      comment: comment.trim() || null,
    }, { onConflict: "referee_id,reviewer_id" });
    setLoading(false);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível salvar a avaliação.", variant: "destructive" });
    } else {
      toast({ title: "Avaliação enviada!", description: `Você avaliou ${refereeName} com ${rating} estrela(s).` });
      setOpen(false);
      setRating(0);
      setComment("");
      onReviewSubmitted?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          Avaliar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">AVALIAR {refereeName.toUpperCase()}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoverRating || rating)
                      ? "text-accent fill-current"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Deixe um comentário (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />
          <Button onClick={handleSubmit} className="w-full font-semibold" disabled={loading}>
            {loading ? "Enviando..." : "Enviar avaliação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog;
