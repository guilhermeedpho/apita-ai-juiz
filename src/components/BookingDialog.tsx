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
import { CalendarDays, MapPin, Clock } from "lucide-react";
import PixPayment from "./PixPayment";

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
  const [showPixInfo, setShowPixInfo] = useState(false);
  const [createdMatchId, setCreatedMatchId] = useState<string | null>(null);

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
      playNotificationSound();
      toast({ title: "Partida agendada! 🎉", description: `${refereeName} foi escalado para sua partida.` });
      setShowPixInfo(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setShowPixInfo(false);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar {refereeName}</DialogTitle>
        </DialogHeader>
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

          {showPixInfo ? (
            <PixPayment price={price} onConfirm={handleClose} />
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} className="w-full font-semibold">
              {submitting ? "Agendando..." : "Confirmar agendamento"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
