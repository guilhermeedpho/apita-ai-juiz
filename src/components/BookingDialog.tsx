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

interface BookingDialogProps {
  refereeId: string;
  refereeName: string;
  availableFieldTypes: string[];
}

type DialogStep = "form" | "payment" | "success";

const BookingDialog = ({ refereeId, refereeName, availableFieldTypes }: BookingDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [fieldType, setFieldType] = useState("");
  const [duration, setDuration] = useState<number>(60);
  const [location, setLocation] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<DialogStep>("form");
  const [createdMatchId, setCreatedMatchId] = useState<string | null>(null);
  const [confirmedScheduledAt, setConfirmedScheduledAt] = useState("");
  const [confirmedLocation, setConfirmedLocation] = useState("");
  const [confirmedFieldType, setConfirmedFieldType] = useState("");
  const [confirmedDuration, setConfirmedDuration] = useState(0);
  const [confirmedPrice, setConfirmedPrice] = useState(0);

  const price = PRICE_TABLE[fieldType]?.[duration] || 0;
  const platformFee = Math.round(price * 0.3);
  const refereePayout = price - platformFee;

  const playNotificationSound = () => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playTone = (freq: number, startTime: number, dur: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + dur);
      osc.start(startTime);
      osc.stop(startTime + dur);
    };
    const now = audioCtx.currentTime;
    playTone(880, now, 0.15);
    playTone(1175, now + 0.18, 0.15);
  };

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

    setSubmitting(false);

    if (error) {
      toast({ title: "Erro ao agendar", description: error.message, variant: "destructive" });
    } else {
      setCreatedMatchId((data as any)?.id || null);
      setConfirmedScheduledAt(new Date(scheduledAt).toLocaleString("pt-BR"));
      setConfirmedLocation(location.trim());
      setConfirmedFieldType(fieldType);
      setConfirmedDuration(duration);
      setConfirmedPrice(price);
      playNotificationSound();
      toast({ title: "Partida agendada! 🎉", description: `${refereeName} foi escalado para sua partida.` });
      setStep("payment");
    }
  };

  const cancelMatch = async () => {
    if (createdMatchId) {
      const { error } = await supabase
        .from("matches" as any)
        .delete()
        .eq("id", createdMatchId);

      if (!error) {
        toast({ title: "Partida cancelada", description: "O agendamento foi cancelado pois o pagamento não foi realizado." });
      }
    }
  };

  const confirmPayment = async () => {
    if (!createdMatchId || !user) {
      handleClose();
      return;
    }

    const { error } = await supabase
      .from("matches" as any)
      .update({ status: "confirmed" })
      .eq("id", createdMatchId)
      .eq("requester_id", user.id);

    if (error) {
      toast({ title: "Erro ao confirmar pagamento", description: error.message, variant: "destructive" });
      throw error;
    }

    toast({ title: "Pagamento confirmado! ✅", description: "Sua marcação foi liberada com sucesso." });
    playNotificationSound();
    setStep("success");
  };

  const handleClose = () => {
    setOpen(false);
    setStep("form");
    setCreatedMatchId(null);
    setFieldType("");
    setDuration(60);
    setLocation("");
    setScheduledAt("");
    setNotes("");
  };

  const handleCancelPayment = () => {
    void cancelMatch();
    handleClose();
  };

  const handleDialogChange = (v: boolean) => {
    if (!v) {
      if (step === "payment") {
        void cancelMatch();
      }
      handleClose();
      return;
    }

    setOpen(true);
  };

  const goToMyMatches = () => {
    handleClose();
    navigate("/perfil");
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="font-semibold">
          <CalendarDays className="h-4 w-4 mr-1" />
          Agendar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "success" ? "Partida Confirmada! 🎉" : `Agendar ${refereeName}`}
          </DialogTitle>
        </DialogHeader>

        {step === "success" ? (
          <div className="pt-2 space-y-5 text-center">
            <div className="flex justify-center">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
                <PartyPopper className="h-6 w-6 text-accent absolute -top-1 -right-1 animate-bounce" />
              </div>
            </div>

            <div>
              <p className="text-lg font-semibold text-foreground">Pagamento confirmado!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Sua partida com <strong>{refereeName}</strong> está confirmada.
              </p>
            </div>

            <div className="rounded-lg bg-secondary/50 p-4 text-sm space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Árbitro</span>
                <strong>{refereeName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modalidade</span>
                <span>{FIELD_LABELS[confirmedFieldType] || confirmedFieldType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duração</span>
                <span>{confirmedDuration} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Local</span>
                <span className="text-right max-w-[60%]">{confirmedLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Data</span>
                <span>{confirmedScheduledAt}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-border pt-2 mt-1">
                <span>Valor pago</span>
                <span className="text-primary">R$ {confirmedPrice}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button onClick={goToMyMatches} className="w-full font-semibold gap-2">
                <CalendarDays className="h-4 w-4" />
                Ver minhas partidas
              </Button>
              <Button variant="outline" onClick={handleClose} className="w-full font-semibold">
                Fechar
              </Button>
            </div>
          </div>
        ) : step === "payment" ? (
          <div className="pt-2">
            <PixPayment price={confirmedPrice} onConfirm={confirmPayment} onCancel={handleCancelPayment} />
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Tipo de campo *</Label>
              <Select value={fieldType} onValueChange={(v) => { setFieldType(v); }}>
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

            <Button onClick={handleSubmit} disabled={submitting} className="w-full font-semibold">
              {submitting ? "Agendando..." : "Confirmar agendamento"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
