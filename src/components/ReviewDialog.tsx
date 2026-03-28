import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Clock, Shirt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const LEVEL_OPTIONS = [
  { value: "top", label: "🏆 Top", color: "border-primary bg-primary/10 text-primary" },
  { value: "bom", label: "👍 Bom", color: "border-green-500 bg-green-500/10 text-green-400" },
  { value: "razoavel", label: "😐 Razoável", color: "border-accent bg-accent/10 text-accent-foreground" },
  { value: "pessimo", label: "👎 Péssimo", color: "border-destructive bg-destructive/10 text-destructive" },
];

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
  const [refereeLevel, setRefereeLevel] = useState("");
  const [wasPunctual, setWasPunctual] = useState<boolean | null>(null);
  const [wasUniformed, setWasUniformed] = useState<boolean | null>(null);
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
    if (!refereeLevel) {
      toast({ title: "Classifique o árbitro", description: "Selecione o nível do árbitro.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("reviews").upsert({
      referee_id: refereeId,
      reviewer_id: user.id,
      rating,
      comment: comment.trim() || null,
      referee_level: refereeLevel,
      was_punctual: wasPunctual,
      was_uniformed: wasUniformed,
    } as any, { onConflict: "referee_id,reviewer_id" });
    setLoading(false);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível salvar a avaliação.", variant: "destructive" });
    } else {
      toast({ title: "Avaliação enviada!", description: `Você avaliou ${refereeName} com ${rating} estrela(s).` });
      setOpen(false);
      setRating(0);
      setComment("");
      setRefereeLevel("");
      setWasPunctual(null);
      setWasUniformed(null);
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">AVALIAR {refereeName.toUpperCase()}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Nota geral</Label>
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
          </div>

          {/* Referee Level */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Nível do árbitro</Label>
            <div className="grid grid-cols-2 gap-2">
              {LEVEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRefereeLevel(opt.value)}
                  className={`rounded-lg border p-3 text-sm font-medium transition-colors ${
                    refereeLevel === opt.value ? opt.color : "border-border hover:border-primary/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Punctuality */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> Chegou no horário?
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWasPunctual(true)}
                className={`rounded-lg border p-3 text-sm font-medium transition-colors ${
                  wasPunctual === true ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                }`}
              >
                ✅ Sim, pontual
              </button>
              <button
                type="button"
                onClick={() => setWasPunctual(false)}
                className={`rounded-lg border p-3 text-sm font-medium transition-colors ${
                  wasPunctual === false ? "border-destructive bg-destructive/10 text-destructive" : "border-border hover:border-primary/50"
                }`}
              >
                ❌ Atrasou
              </button>
            </div>
          </div>

          {/* Uniformed */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1 text-sm text-muted-foreground">
              <Shirt className="h-3.5 w-3.5" /> Estava uniformizado?
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWasUniformed(true)}
                className={`rounded-lg border p-3 text-sm font-medium transition-colors ${
                  wasUniformed === true ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                }`}
              >
                ✅ Sim
              </button>
              <button
                type="button"
                onClick={() => setWasUniformed(false)}
                className={`rounded-lg border p-3 text-sm font-medium transition-colors ${
                  wasUniformed === false ? "border-destructive bg-destructive/10 text-destructive" : "border-border hover:border-primary/50"
                }`}
              >
                ❌ Não
              </button>
            </div>
          </div>

          {/* Comment */}
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
