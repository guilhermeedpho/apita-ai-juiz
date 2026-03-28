import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Trash2, MapPin } from "lucide-react";

const FIELD_LABELS: Record<string, string> = {
  society: "Society",
  campo: "Campo (11x11)",
  futsal: "Futsal",
  areia: "Futebol de Areia",
};

const AdminMatchesManager = () => {
  const { toast } = useToast();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("matches")
        .select("*")
        .order("created_at", { ascending: false });

      setMatches(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleDelete = async (id: string) => {
    // Delete related messages first
    await supabase.from("messages").delete().eq("match_id", id);
    const { error } = await supabase.from("matches").delete().eq("id", id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setMatches((prev) => prev.filter((m) => m.id !== id));
      toast({ title: "Partida excluída!" });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-display flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-primary" />
        PARTIDAS ({matches.length})
      </h2>

      {loading ? (
        <p className="text-center text-muted-foreground py-4">Carregando...</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {matches.map((m) => (
            <Card key={m.id} className="bg-gradient-card border-border shadow-card">
              <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{FIELD_LABELS[m.field_type] || m.field_type}</span>
                    <Badge variant="outline" className="text-xs">{m.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {m.location} • R${m.price} •{" "}
                    {new Date(m.scheduled_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => handleDelete(m.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {matches.length === 0 && (
            <p className="text-center text-muted-foreground py-4">Nenhuma partida.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminMatchesManager;
