import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle } from "lucide-react";

const ContactAdminDialog = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!user) return;
    if (!subject.trim() || !message.trim()) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    setSending(true);
    const { error } = await supabase
      .from("support_messages" as any)
      .insert({
        user_id: user.id,
        subject: subject.trim(),
        message: message.trim(),
      });

    setSending(false);
    if (error) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Mensagem enviada! ✉️", description: "O admin responderá em breve." });
      setOpen(false);
      setSubject("");
      setMessage("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full font-semibold">
          <MessageCircle className="h-4 w-4 mr-2" />
          Falar com o Admin
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contato com Administração</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Assunto *</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Problema com agendamento"
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label>Mensagem *</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descreva sua dúvida ou problema..."
              rows={4}
              maxLength={1000}
            />
          </div>
          <Button onClick={handleSend} disabled={sending} className="w-full font-semibold">
            {sending ? "Enviando..." : "Enviar mensagem"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactAdminDialog;
