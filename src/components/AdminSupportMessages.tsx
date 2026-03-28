import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Reply } from "lucide-react";

interface SupportMsg {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: string;
  admin_reply: string | null;
  created_at: string;
  userName?: string;
}

const AdminSupportMessages = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<SupportMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("support_messages" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        const userIds = [...new Set((data as any[]).map((m: any) => m.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        const nameMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));

        setMessages(
          (data as any[]).map((m: any) => ({
            ...m,
            userName: nameMap.get(m.user_id) || "Usuário",
          }))
        );
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleReply = async (id: string) => {
    if (!replyText.trim()) return;

    const { error } = await supabase
      .from("support_messages" as any)
      .update({
        admin_reply: replyText.trim(),
        status: "replied",
        replied_at: new Date().toISOString(),
      } as any)
      .eq("id", id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, admin_reply: replyText.trim(), status: "replied" } : m))
      );
      setReplyingId(null);
      setReplyText("");
      toast({ title: "Resposta enviada!" });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-display flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        MENSAGENS DE SUPORTE ({messages.length})
      </h2>

      {loading ? (
        <p className="text-center text-muted-foreground py-4">Carregando...</p>
      ) : messages.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">Nenhuma mensagem.</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {messages.map((m) => (
            <Card key={m.id} className="bg-gradient-card border-border shadow-card">
              <CardContent className="py-3 px-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{m.userName}</span>
                  <Badge className={m.status === "open" ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"}>
                    {m.status === "open" ? "Aberto" : "Respondido"}
                  </Badge>
                </div>
                <p className="text-xs font-semibold">{m.subject}</p>
                <p className="text-xs text-muted-foreground">{m.message}</p>
                {m.admin_reply && (
                  <div className="bg-primary/5 rounded-lg p-2 text-xs">
                    <span className="font-medium text-primary">Resposta:</span> {m.admin_reply}
                  </div>
                )}
                {m.status === "open" && (
                  <>
                    {replyingId === m.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Sua resposta..."
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleReply(m.id)}>Enviar</Button>
                          <Button size="sm" variant="ghost" onClick={() => setReplyingId(null)}>Cancelar</Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => { setReplyingId(m.id); setReplyText(""); }}>
                        <Reply className="h-3 w-3 mr-1" /> Responder
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSupportMessages;
