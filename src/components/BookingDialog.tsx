import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, MapPin, Clock, Loader2, ExternalLink } from "lucide-react";

const PRICE_TABLE: Record<string, Record<number, number>> = {
  society: { 60: 130, 90: 180, 120: 220 },
  campo: { 60: 200, 90: 280 },
  futsal: { 60: 100, 90: 140, 120: 170 },
  areia: { 60: 100, 90: 140, 120: 170 },
};

const DURATION_OPTIONS = [
  { value: 60, label: "60 minutos" },
  { value: 90, label: "90 minutos" },
  { value: 120, label: "120 minutos" },
];

const FIELD_LABELS: Record<string, string> = {
  society: "Society",
  campo: "Campo (11x11)",
  futsal: "Futsal",
  areia: "Futebol de Areia",
};

const INFINITEPAY_HANDLE = "nagattoclimatizacoes";

interface BookingDialogProps {
  refereeId: string;
  refereeName: string;
  availableFieldTypes: string[];
}

const BookingDialog = ({ refereeId, refereeName, availableFieldTypes }: BookingDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [fieldType, setFieldType] = useState("");
  const [duration, setDuration] = useState<number>(60);
  const [location, setLocation] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const price = PRICE_TABLE[fieldType]?.[duration] || 0;
  const platformFee = Math.round(price * 0.3);
  const refereePayout = price - platformFee;

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Faça login para agendar", variant: "destructive" });
      return;
    }
    if (!fieldType || !location.trim() || !scheduledAt) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    try {
      // 1. Create match with pending status
      const { data, error } = await supabase
        .from("matches" as any)
        .insert({
          referee_id: refereeId,
          requester_id: user.id,
          field_type: fieldType,
          duration,
          location: location.trim(),
          scheduled_at: new Date(scheduledAt).toISOString(),
          price,
          platform_fee: platformFee,
          referee_payout: refereePayout,
          notes: notes.trim() || null,
        })
        .select("id")
        .single();

      if (error) {
        toast({ title: "Erro ao agendar", description: error.message, variant: "destructive" });
        return;
      }

      const matchId = (data as any)?.id;
      if (!matchId) {
        toast({ title: "Erro ao criar partida", variant: "destructive" });
        return;
      }

      // 2. Generate InfinitePay checkout URL
      const paymentNsu = `APITAJA-${matchId.slice(0, 8).toUpperCase()}`;
      const redirectUrl = `${window.location.origin}/pagamento-confirmado?match_id=${matchId}&nsu=${paymentNsu}`;

      const items = [{
        name: `Árbitro - ${FIELD_LABELS[fieldType] || fieldType} ${duration}min`,
        price: price * 100,
        quantity: 1,
      }];

      const checkoutUrl = `https://checkout.infinitepay.io/${INFINITEPAY_HANDLE}?items=${encodeURIComponent(JSON.stringify(items))}&order_nsu=${paymentNsu}&redirect_url=${encodeURIComponent(redirectUrl)}`;

      // Save payment NSU
      await supabase
        .from("matches" as any)
        .update({ payment_nsu: paymentNsu } as any)
        .eq("id", matchId);

      toast({
        title: "Partida criada! 🎉",
        description: "Você será redirecionado para o pagamento.",
      });

      // 3. Redirect to InfinitePay checkout (use location.href to avoid popup blockers)
      handleClose();
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error("Booking error:", err);
      toast({ title: "Erro ao agendar", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFieldType("");
    setDuration(60);
    setLocation("");
    setScheduledAt("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="font-semibold">
          <CalendarDays className="h-4 w-4 mr-1" />
          Agendar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar {refereeName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Tipo de campo *</Label>
            <Select value={fieldType} onValueChange={(v) => setFieldType(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {availableFieldTypes.map((ft) => (
                  <SelectItem key={ft} value={ft}>
                    {FIELD_LABELS[ft] || ft}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Tempo de jogo *
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDuration(opt.value)}
                  className={`rounded-lg border p-3 text-sm font-medium transition-colors ${
                    duration === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {opt.label}
                  {fieldType && (
                    <span className="block text-xs mt-1">
                      R$ {PRICE_TABLE[fieldType]?.[opt.value] || "—"}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> Local do campo *
            </Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Arena Society - Zona Sul, SP"
            />
          </div>

          <div className="space-y-2">
            <Label>Data e horário *</Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Partida de campeonato..."
              rows={2}
            />
          </div>

          {fieldType && (
            <div className="rounded-lg bg-secondary/50 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modalidade</span>
                <span>{FIELD_LABELS[fieldType]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duração</span>
                <span>{duration} min</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Valor total</span>
                <span>R$ {price}</span>
              </div>
            </div>
          )}

          <Button onClick={handleSubmit} disabled={submitting} className="w-full font-semibold gap-2">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Criando...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4" /> Agendar e pagar via InfinitePay
              </>
            )}
          </Button>

          <p className="text-[11px] text-muted-foreground text-center">
            Você será redirecionado para o checkout seguro da InfinitePay para efetuar o pagamento via PIX ou cartão.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
