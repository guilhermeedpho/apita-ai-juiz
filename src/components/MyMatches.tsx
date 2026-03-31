import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, CreditCard } from "lucide-react";
import ChatDialog from "./ChatDialog";

const INFINITEPAY_HANDLE = "nagattoclimatizacoes";

interface MatchData {
  id: string;
  field_type: string;
  duration: number;
  location: string;
  scheduled_at: string;
  status: string;
  price: number;
  referee_id: string;
  requester_id: string;
  payment_nsu: string | null;
  refereeName?: string;
  requesterName?: string;
}

const FIELD_LABELS: Record<string, string> = {
  society: "Society",
  campo: "Campo (11x11)",
  futsal: "Futsal",
  areia: "Futebol de Areia",
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-accent/20 text-accent" },
  confirmed: { label: "Confirmado", className: "bg-primary/20 text-primary" },
  completed: { label: "Concluído", className: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelado", className: "bg-destructive/20 text-destructive" },
};

const MyMatches = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchMatches = async () => {
      // Get matches where user is requester
      const { data: reqMatches } = await supabase
        .from("matches")
        .select("*")
        .eq("requester_id", user.id)
        .order("scheduled_at", { ascending: false });

      // Get matches where user is referee
      const { data: refereeRows } = await supabase
        .from("referees")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let refMatches: any[] = [];
      if (refereeRows) {
        const { data } = await supabase
          .from("matches")
          .select("*")
          .eq("referee_id", refereeRows.id)
          .order("scheduled_at", { ascending: false });
        refMatches = data || [];
      }

      // Merge and deduplicate
      const allMatches = [...(reqMatches || []), ...refMatches];
      const uniqueMap = new Map(allMatches.map((m) => [m.id, m]));
      const unique = Array.from(uniqueMap.values());

      // Fetch names
      const refereeIds = [...new Set(unique.map((m) => m.referee_id))];
      const requesterIds = [...new Set(unique.map((m) => m.requester_id))];

      const { data: refereeProfiles } = await supabase
        .from("referees")
        .select("id, user_id")
        .in("id", refereeIds);

      const refUserIds = (refereeProfiles || []).map((r) => r.user_id);
      const allUserIds = [...new Set([...requesterIds, ...refUserIds])];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", allUserIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));
      const refereeUserMap = new Map((refereeProfiles || []).map((r) => [r.id, r.user_id]));

      const mapped: MatchData[] = unique.map((m) => ({
        ...m,
        refereeName: profileMap.get(refereeUserMap.get(m.referee_id) || "") || "Árbitro",
        requesterName: profileMap.get(m.requester_id) || "Contratante",
      }));

      setMatches(mapped);
      setLoading(false);
    };

    fetchMatches();
  }, [user]);

  if (!user) return null;

  return (
    <Card className="bg-gradient-card border-border shadow-card">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          MINHAS PARTIDAS
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-4">Carregando...</p>
        ) : matches.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">Nenhuma partida agendada.</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {matches.map((m) => {
              const isRequester = m.requester_id === user.id;
              const otherName = isRequester ? m.refereeName! : m.requesterName!;
              const statusInfo = STATUS_LABELS[m.status] || STATUS_LABELS.pending;

              return (
                <div
                  key={m.id}
                  className="rounded-xl border border-border p-4 space-y-2"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{FIELD_LABELS[m.field_type] || m.field_type}</span>
                      <span className="text-xs text-muted-foreground">• {m.duration}min</span>
                    </div>
                    <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {m.location}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {new Date(m.scheduled_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground">
                      {isRequester ? `Árbitro: ${otherName}` : `Contratante: ${otherName}`}
                    </span>
                    <ChatDialog matchId={m.id} otherName={otherName} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyMatches;
