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
import { CalendarDays, MapPin } from "lucide-react";

const FIXED_PRICES: Record<string, number> = {
  society: 130,
  campo: 200,
  futsal: 100,
  areia: 100,
};

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
  const [location, setLocation] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const price = FIXED_PRICES[fieldType] || 0;
  const platformFee = Math.round(price * 0.3);
  const refereePayout = price - platformFee;

  const playNotificationSound = () => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // WhatsApp-like double tone
    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
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

    const { error } = await supabase
      .from("matches" as any)
      .insert({
        referee_id: refereeId,
        requester_id: user.id,
        field_type: fieldType,
        location: location.trim(),
        scheduled_at: new Date(scheduledAt).toISOString(),
        price,
        platform_fee: platformFee,
        referee_payout: refereePayout,
        notes: notes.trim() || null,
      });

    setSubmitting(false);

    if (error) {
      toast({ title: "Erro ao agendar", description: error.message, variant: "destructive" });
    } else {
      playNotificationSound();
      toast({ title: "Partida agendada! 🎉", description: `${refereeName} foi escalado para sua partida.` });
      setOpen(false);
      setFieldType("");
      setLocation("");
      setScheduledAt("");
      setNotes("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            <Select value={fieldType} onValueChange={setFieldType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {availableFieldTypes.map((ft) => (
                  <SelectItem key={ft} value={ft}>
                    {FIELD_LABELS[ft] || ft} — R$ {FIXED_PRICES[ft]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              placeholder="Ex: Partida de campeonato, 2 tempos de 30min..."
              rows={2}
            />
          </div>

          {fieldType && (
            <div className="rounded-lg bg-secondary/50 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor total</span>
                <span className="font-semibold">R$ {price}</span>
              </div>
            </div>
          )}

          <Button onClick={handleSubmit} disabled={submitting} className="w-full font-semibold">
            {submitting ? "Agendando..." : "Confirmar agendamento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
